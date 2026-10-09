export type CaseStatus =
  | "rascunho"
  | "aguardando_upload"
  | "em_analise"
  | "revisao_pendente"
  | "revisao_concluida";

export interface ClinicalCase {
  id: string;
  reference: string;
  subjectLabel: string; // fictional, de-identified label, never a real patient
  createdAt: string;
  status: CaseStatus;
  documents: ClinicalDocument[];
  findings: Finding[];
  conflicts: Conflict[];
  gaps: Gap[];
  timeline: TimelineEvent[];
  reviewDecisions?: ReviewDecision[];
  attestation?: Attestation;
  reviewSnapshot?: ReviewSnapshot;
}

export interface ClinicalDocument {
  id: string;
  name: string;
  type: string;
  pages: number;
  uploadedAt?: string;
  sizeLabel: string;
  origin?: "user_upload" | "demo";
  fileStored?: boolean;
  objectKey?: string;
  storageProvider?: "aws-s3" | "local-demo";
  encryptionStatus?: "kms" | "s3-managed" | "local-demo";
  sha256?: string;
  processingError?: string;
  extractedPages?: string[];
  extractionStatus?: "text_extracted" | "no_text" | "unreadable";
}

export interface EvidenceRef {
  docId: string;
  docName: string;
  page: number;
  excerpt: string;
}

export interface Finding {
  id: string;
  title: string;
  category: string;
  summary: string;
  confidence: "alta" | "media" | "baixa";
  evidence: EvidenceRef[];
}

export interface Conflict {
  id: string;
  title: string;
  description: string;
  severity: "alta" | "media" | "baixa";
  sourceA: EvidenceRef;
  sourceB: EvidenceRef;
}

export interface Gap {
  id: string;
  title: string;
  description: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  label: string;
  docId: string;
  docName: string;
  page?: number;
  excerpt?: string;
  metric?: string;
  value?: number;
  unit?: string;
}

export type ReviewAction = "confirmado" | "corrigido" | "rejeitado";

export interface ReviewDecision {
  itemId: string;
  itemType: "finding" | "conflict";
  itemTitle: string;
  action: ReviewAction;
  note?: string;
  correctedValue?: string;
  reviewer: string;
  decidedAt: string;
}

export interface Attestation {
  attestationId: string;
  reviewer: string;
  completedAt: string;
  contentHash: string;
  status: "local";
  snapshotVersion: string;
  documentHashes: Array<{ documentId: string; documentName: string; sha256: string; hashScope: "original-pdf" | "extracted-content-and-metadata" }>;
  analysisHash: string;
  decisionsHash: string;
}

export interface ReviewSnapshot {
  version: string;
  createdAt: string;
  reviewer: string;
  documentHashes: Array<{ documentId: string; documentName: string; sha256: string; hashScope: "original-pdf" | "extracted-content-and-metadata" }>;
  analysisHash: string;
  decisionsHash: string;
  contentHash: string;
  source: "browser-local";
}

export interface JevItem {
  id: string;
  relatedTitle: string;
  relatedType: "finding" | "conflict" | "gap";
  humanReviewRequired: boolean;
  priority: "alta" | "media" | "baixa";
  clarity: "alta" | "media" | "baixa";
  reason: string;
}
