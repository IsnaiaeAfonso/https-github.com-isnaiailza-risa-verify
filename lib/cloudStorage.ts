export type UploadDocumentResult = {
  objectKey: string;
  storageProvider: "aws-s3" | "local-demo";
  encryptionStatus: "kms" | "s3-managed" | "local-demo";
  sha256: string;
  size: number;
  message?: string;
};

export async function uploadDocument(
  file: File,
  caseId: string,
): Promise<UploadDocumentResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("caseId", caseId);
  formData.append("purpose", "clinical-review");

  const response = await fetch("/api/documents", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as UploadDocumentResult & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Não foi possível armazenar o documento.");
  }

  return payload;
}
