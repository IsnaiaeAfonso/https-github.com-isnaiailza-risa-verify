import { createHash } from "node:crypto";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getConsent } from "@/lib/consentStore";
import { addDocumentToQueue } from "@/lib/documentQueue";
import { getPatientUploadDoctors, hasVercelBlobToken } from "@/lib/patientUploadConfig";
import { get } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const TERMS_VERSION = "MVP-DEMO-2026-10";

interface UploadPayload {
  caseId: string;
  doctorName: string;
  consentId: string;
  termsVersion: string;
  source: string;
  fileName: string;
}

function parsePayload(value: string | null | undefined): UploadPayload {
  if (!value) throw new Error("Dados do envio ausentes.");
  const parsed = JSON.parse(value) as Partial<UploadPayload>;
  if (
    typeof parsed.caseId !== "string"
    || !/^[A-Za-z0-9_-]{1,80}$/.test(parsed.caseId)
    || typeof parsed.doctorName !== "string"
    || !getPatientUploadDoctors().includes(parsed.doctorName)
    || typeof parsed.consentId !== "string"
    || parsed.termsVersion !== TERMS_VERSION
    || typeof parsed.fileName !== "string"
  ) {
    throw new Error("Dados do envio inválidos.");
  }
  return {
    caseId: parsed.caseId,
    doctorName: parsed.doctorName,
    consentId: parsed.consentId,
    termsVersion: parsed.termsVersion,
    source: typeof parsed.source === "string" ? parsed.source : "patient-demo-link",
    fileName: parsed.fileName.slice(0, 180),
  };
}

async function validateConsent(payload: UploadPayload) {
  const consent = await getConsent(payload.consentId);
  if (
    !consent
    || consent.consentStatus !== "ACCEPTED"
    || consent.caseId !== payload.caseId
    || consent.doctorName !== payload.doctorName
    || consent.termsVersion !== payload.termsVersion
  ) {
    throw new Error("O consentimento não está válido para este caso.");
  }
}

export async function POST(request: Request) {
  if (!hasVercelBlobToken()) {
    return NextResponse.json({ error: "Conecte um armazenamento Blob privado ao projeto Vercel antes de receber PDFs." }, { status: 503 });
  }

  let body: HandleUploadBody;
  try {
    body = await request.json() as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Solicitação de upload inválida." }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const metadata = parsePayload(clientPayload);
        const expectedPrefix = `risa-verify/patient-pdfs/${metadata.caseId}/`;
        if (!pathname.startsWith(expectedPrefix) || !pathname.toLowerCase().endsWith(".pdf")) {
          throw new Error("Destino de upload inválido.");
        }
        await validateConsent(metadata);

        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: MAX_FILE_SIZE,
          validUntil: Date.now() + 10 * 60 * 1000,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify(metadata),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const metadata = parsePayload(tokenPayload);
        await validateConsent(metadata);
        const stored = await get(blob.pathname, { access: "private", useCache: false });
        if (!stored || stored.statusCode !== 200) throw new Error("Não foi possível validar o PDF armazenado.");
        if (stored.blob.size > MAX_FILE_SIZE) throw new Error("O PDF ultrapassa o limite de 25 MB.");

        const bytes = Buffer.from(await new Response(stored.stream).arrayBuffer());
        if (bytes.length < 5 || bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
          throw new Error("O arquivo recebido não contém um PDF válido.");
        }

        const sha256 = createHash("sha256").update(bytes).digest("hex");
        const queueId = createHash("sha256").update(blob.pathname).digest("hex").slice(0, 32);
        await addDocumentToQueue({
          id: queueId,
          caseId: metadata.caseId,
          doctorName: metadata.doctorName,
          fileName: metadata.fileName,
          size: bytes.length,
          sha256,
          consentId: metadata.consentId,
          termsVersion: metadata.termsVersion,
          source: metadata.source,
          status: "stored",
          storageProvider: "vercel-blob-private",
          objectKey: blob.pathname,
        });
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Não foi possível autorizar o upload.",
    }, { status: 400 });
  }
}