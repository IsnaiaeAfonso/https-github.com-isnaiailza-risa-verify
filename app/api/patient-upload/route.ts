import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getConsent } from "@/lib/consentStore";
import { addDocumentToQueue, updateDocumentQueue } from "@/lib/documentQueue";
import { getPatientUploadDoctors, getPatientUploadMode, isPatientUploadStorageReady, isVercelRuntime } from "@/lib/patientUploadConfig";

const AWS_REGION = process.env.AWS_REGION ?? "us-east-1";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_S3_PREFIX = process.env.AWS_S3_PREFIX ?? "iasx";
const AWS_KMS_KEY_ID = process.env.AWS_KMS_KEY_ID;
const DEMO_CASE_ID = "CV-DEMO-00123";
const TERMS_VERSION = "MVP-DEMO-2026-10";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function GET() {
  const storageConfigured = isPatientUploadStorageReady();
  return NextResponse.json({
    doctors: getPatientUploadDoctors(),
    uploadMode: getPatientUploadMode(),
    storageConfigured,
    uploadToken: "patient-demo-link",
  });
}

export async function POST(request: Request) {
  try {
    if (isVercelRuntime()) {
      return NextResponse.json({
        error: isPatientUploadStorageReady()
          ? "Este deploy usa envio direto ao armazenamento. Atualize a página do paciente e tente novamente."
          : "O armazenamento persistente ainda não está configurado neste deploy.",
      }, { status: isPatientUploadStorageReady() ? 400 : 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const caseId = String(formData.get("caseId") ?? DEMO_CASE_ID).trim();
    const doctorName = String(formData.get("doctorName") ?? "").trim();
    const consentId = String(formData.get("consentId") ?? "").trim();
    const termsVersion = String(formData.get("termsVersion") ?? TERMS_VERSION).trim();
    const source = String(formData.get("source") ?? "patient-demo-link");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Selecione um arquivo PDF válido." }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "O arquivo deve ser menor que 25 MB." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length < 5 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return NextResponse.json({ error: "O arquivo selecionado não contém um PDF válido." }, { status: 400 });
    }

    const consent = await getConsent(consentId);
    if (!consent || consent.consentStatus !== "ACCEPTED") {
      return NextResponse.json({
        error: "É necessário aceitar o termo de compartilhamento antes de enviar documentos.",
      }, { status: 403 });
    }

    if (consent.caseId !== caseId || consent.termsVersion !== termsVersion) {
      return NextResponse.json({ error: "O consentimento não corresponde ao caso ou termo atual." }, { status: 400 });
    }

    const doctors = getPatientUploadDoctors();
    if (!doctorName || !doctors.includes(doctorName)) {
      return NextResponse.json({ error: "Selecione um médico válido para este envio." }, { status: 400 });
    }
    if (consent.doctorName !== doctorName) {
      return NextResponse.json({ error: "O consentimento não corresponde ao médico selecionado." }, { status: 400 });
    }

    const digest = sha256(buffer);
    const safeCaseId = caseId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "document.pdf";
    const objectKey = `${AWS_S3_PREFIX}/${safeCaseId}/patient-upload/${randomUUID()}-${safeFileName}`;
    const queueEntry = await addDocumentToQueue({
      caseId,
      doctorName,
      fileName: file.name,
      size: buffer.length,
      sha256: digest,
      consentId,
      termsVersion,
      source,
      status: "queued",
      storageProvider: AWS_S3_BUCKET ? "aws-s3" : "local-demo",
    });

    if (!AWS_S3_BUCKET) {
      const localDirectory = join(process.cwd(), "data", "uploads", safeCaseId);
      await mkdir(localDirectory, { recursive: true });
      const localFileName = `${randomUUID()}.pdf`;
      await writeFile(join(localDirectory, localFileName), buffer, { flag: "wx" });
      const localObjectKey = `data/uploads/${safeCaseId}/${localFileName}`;
      const queuedItem = await updateDocumentQueue(queueEntry.id, {
        status: "stored",
        storageProvider: "local-demo",
        objectKey: localObjectKey,
      });
      return NextResponse.json({
        queueId: queueEntry.id,
        objectKey: localObjectKey,
        storageProvider: "local-demo",
        encryptionStatus: "local-demo",
        sha256: digest,
        size: buffer.length,
        source,
        consentId,
        termsVersion,
        queueStatus: queuedItem?.status,
        message: "PDF incluído na fila e salvo no modo local. Configure AWS_S3_BUCKET para ativar armazenamento remoto.",
      }, { status: 202 });
    }

    try {
      const client = new S3Client({ region: AWS_REGION });
      await client.send(new PutObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: objectKey,
        Body: buffer,
        ContentType: "application/pdf",
        ContentLength: buffer.length,
        Metadata: {
          caseId,
          doctorName,
          purpose: "patient-upload",
          source,
          consentId,
          termsVersion,
          sha256: digest,
          "x-iasx-product": "clinical-review",
        },
        ServerSideEncryption: AWS_KMS_KEY_ID ? "aws:kms" : "AES256",
        ...(AWS_KMS_KEY_ID ? { SSEKMSKeyId: AWS_KMS_KEY_ID } : {}),
      }));
    } catch (error) {
      await updateDocumentQueue(queueEntry.id, {
        status: "failed",
        error: error instanceof Error ? error.message : "S3 upload failed",
      });
      throw error;
    }

    await updateDocumentQueue(queueEntry.id, {
      status: "stored",
      storageProvider: "aws-s3",
      objectKey,
    });

    return NextResponse.json({
      queueId: queueEntry.id,
      objectKey,
      storageProvider: "aws-s3",
      encryptionStatus: AWS_KMS_KEY_ID ? "kms" : "s3-managed",
      sha256: digest,
      size: buffer.length,
      source,
      consentId,
      termsVersion,
      queueStatus: "stored",
    });
  } catch (error) {
    console.error("patient upload failed", error);
    return NextResponse.json({ error: "Não foi possível concluir o envio seguro." }, { status: 500 });
  }
}
