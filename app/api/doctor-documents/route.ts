import { NextResponse } from "next/server";
import { getDocumentQueue } from "@/lib/documentQueue";
import { isVisibleToConfiguredDoctor } from "@/lib/doctorDocumentAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const documents = await getDocumentQueue();
    const storedDocuments = documents
      .filter(isVisibleToConfiguredDoctor)
      .map((document) => ({
        id: document.id,
        caseId: document.caseId,
        doctorName: document.doctorName ?? "",
        fileName: document.fileName,
        size: document.size,
        sha256: document.sha256,
        storageProvider: document.storageProvider,
        createdAt: document.createdAt,
      }));

    return NextResponse.json({ documents: storedDocuments });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar os documentos." }, { status: 500 });
  }
}