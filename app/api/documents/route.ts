import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getDocumentQueue } from "@/lib/documentQueue";

const AWS_REGION = process.env.AWS_REGION ?? "us-east-1";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_S3_PREFIX = process.env.AWS_S3_PREFIX ?? "iasx";
const AWS_KMS_KEY_ID = process.env.AWS_KMS_KEY_ID;

function sha256(buffer: Buffer): string {
  return require("node:crypto")
    .createHash("sha256")
    .update(buffer)
    .digest("hex");
}

export async function GET() {
  const queue = await getDocumentQueue();
  return NextResponse.json({ queue });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const caseId = String(formData.get("caseId") ?? "unassigned");
    const purpose = String(formData.get("purpose") ?? "clinical-review");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Um arquivo PDF é obrigatório." },
        { status: 400 },
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "O arquivo deve ser menor que 25 MB." },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const digest = sha256(buffer);

    if (!AWS_S3_BUCKET) {
      return NextResponse.json(
        {
          objectKey: `local-demo/${caseId}/${file.name}`,
          storageProvider: "local-demo",
          encryptionStatus: "local-demo",
          sha256: digest,
          size: buffer.length,
          message:
            "O modo local foi usado. Configure AWS_S3_BUCKET para ativar armazenamento remoto.",
        },
        { status: 202 },
      );
    }

    const client = new S3Client({ region: AWS_REGION });
    const objectKey = `${AWS_S3_PREFIX}/${caseId}/${crypto.randomUUID()}-${file.name}`;
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: objectKey,
      Body: buffer,
      ContentType: file.type || "application/pdf",
      ContentLength: buffer.length,
      Metadata: {
        purpose,
        caseId,
        sha256: digest,
        "x-iasx-product": "clinical-review",
      },
      ServerSideEncryption: AWS_KMS_KEY_ID ? "aws:kms" : "AES256",
      ...(AWS_KMS_KEY_ID ? { SSEKMSKeyId: AWS_KMS_KEY_ID } : {}),
    });

    await client.send(command);

    return NextResponse.json({
      objectKey,
      storageProvider: "aws-s3",
      encryptionStatus: AWS_KMS_KEY_ID ? "kms" : "s3-managed",
      sha256: digest,
      size: buffer.length,
    });
  } catch (error) {
    console.error("document upload failed", error);
    return NextResponse.json(
      { error: "Não foi possível concluir o armazenamento seguro." },
      { status: 500 },
    );
  }
}
