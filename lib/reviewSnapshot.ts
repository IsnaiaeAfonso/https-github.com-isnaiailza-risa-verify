import type { ClinicalCase, ReviewDecision, ReviewSnapshot } from "@/lib/types";

const SNAPSHOT_VERSION = "iasx-review-v1";
const ANALYSIS_VERSION = "clinical-analyzer-v1";

async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function sortById<T extends { id: string }>(items: T[]): T[] {
  return [...items].sort((first, second) => first.id.localeCompare(second.id));
}

export async function createReviewSnapshot(
  clinicalCase: ClinicalCase,
  decisions: ReviewDecision[],
  createdAt = new Date().toISOString(),
): Promise<ReviewSnapshot> {
  const documentHashes = await Promise.all(
    [...clinicalCase.documents]
      .sort((first, second) => first.id.localeCompare(second.id))
      .map(async (document) => ({
        documentId: document.id,
        documentName: document.name,
        sha256: document.sha256 ?? await sha256({
          name: document.name,
          pages: document.pages,
          extractedPages: document.extractedPages ?? [],
          extractionStatus: document.extractionStatus ?? "unknown",
        }),
        hashScope: document.sha256 ? "original-pdf" as const : "extracted-content-and-metadata" as const,
      })),
  );

  const analysisPayload = {
    version: ANALYSIS_VERSION,
    findings: sortById(clinicalCase.findings),
    conflicts: sortById(clinicalCase.conflicts),
    gaps: sortById(clinicalCase.gaps),
    timeline: sortById(clinicalCase.timeline),
  };
  const normalizedDecisions = [...decisions]
    .map((decision) => ({
      itemId: decision.itemId,
      itemType: decision.itemType,
      itemTitle: decision.itemTitle,
      action: decision.action,
      note: decision.note ?? "",
      correctedValue: decision.correctedValue ?? "",
      reviewer: decision.reviewer,
      decidedAt: decision.decidedAt,
    }))
    .sort((first, second) => first.itemId.localeCompare(second.itemId));

  const analysisHash = await sha256(analysisPayload);
  const decisionsHash = await sha256(normalizedDecisions);
  const canonicalSnapshot = {
    version: SNAPSHOT_VERSION,
    caseId: clinicalCase.id,
    documents: documentHashes,
    analysisHash,
    decisionsHash,
  };
  const contentHash = await sha256(canonicalSnapshot);

  return {
    version: SNAPSHOT_VERSION,
    createdAt,
    reviewer: decisions[0]?.reviewer ?? "Revisor não informado",
    documentHashes,
    analysisHash,
    decisionsHash,
    contentHash,
    source: "browser-local",
  };
}

export async function verifyReviewSnapshot(clinicalCase: ClinicalCase): Promise<boolean> {
  if (!clinicalCase.reviewSnapshot || !clinicalCase.reviewDecisions?.length) return false;
  const current = await createReviewSnapshot(
    clinicalCase,
    clinicalCase.reviewDecisions,
    clinicalCase.reviewSnapshot.createdAt,
  );
  return current.contentHash === clinicalCase.reviewSnapshot.contentHash
    && current.analysisHash === clinicalCase.reviewSnapshot.analysisHash
    && current.decisionsHash === clinicalCase.reviewSnapshot.decisionsHash
    && JSON.stringify(current.documentHashes) === JSON.stringify(clinicalCase.reviewSnapshot.documentHashes);
}
