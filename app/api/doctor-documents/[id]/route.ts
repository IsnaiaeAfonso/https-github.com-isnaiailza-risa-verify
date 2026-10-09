import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { NextResponse } from "next/server";
import { getDocumentQueueItem } from "@/lib/documentQueue";
import { isVisibleToConfiguredDoctor } from "@/lib/doctorDocumentAccess";

export const runtime = "nodejs";

const AWS_REGION = process.env.AWS_REGION ?? "us-east-1";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const document = await getDocumentQueueItem(params.id);
  if (!document || !isVisibleToConfiguredDoctor(document) || !document.objectKey) {
    return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  }

  try {
    let pdf: Uint8Array;
    if (document.storageProvider === "aws-s3") {
      if (!AWS_S3_BUCKET) return NextResponse.json({ error: "Armazenamento remoto indisponível." }, { status: 503 });
      const response = await new S3Client({ region: AWS_REGION }).send(new GetObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: document.objectKey,
      }));
      if (!response.Body) return NextResponse.json({ error: "Arquivo vazio." }, { status: 404 });
      pdf = await response.Body.transformToByteArray();
    } else if (document.storageProvider === "local-demo") {
      const uploadsRoot = resolve(process.cwd(), "data", "uploads", document.caseId.replace(/[^a-zA-Z0-9_-]/g, "_"));
      const filePath = resolve(process.cwd(), document.objectKey);
      const pathFromRoot = relative(uploadsRoot, filePath);
      if (!pathFromRoot || pathFromRoot.startsWith(`..${sep}`) || pathFromRoot === ".." || isAbsolute(pathFromRoot)) {
        return NextResponse.json({ error: "Caminho de arquivo inválido." }, { status: 400 });
      }
      pdf = await readFile(filePath);
    } else {
      return NextResponse.json({ error: "Provedor de armazenamento não suportado." }, { status: 503 });
    }

    const safeFileName = document.fileName.replace(/[\r\n"\\]/g, "_");
    const responseBody = new ArrayBuffer(pdf.byteLength);
    new Uint8Array(responseBody).set(pdf);
    return new Response(responseBody, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.byteLength),
        "Content-Disposition": `inline; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível abrir o PDF armazenado." }, { status: 500 });
  }
}