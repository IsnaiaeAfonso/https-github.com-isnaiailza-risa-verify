"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ClinicalCase,
  ClinicalDocument,
  ReviewDecision,
  Attestation,
  JevItem,
} from "./types";
import { buildDemoCase, jevItemsForDemo, DEMO_CASE_ID } from "./mockData";
import { analyzeClinicalDocuments } from "./clinicalAnalyzer";
import { createReviewSnapshot } from "./reviewSnapshot";

const STORAGE_KEY = "iasx-clinical-review-state-v1";
const EXPLICIT_DEMO_KEY = `${STORAGE_KEY}-demo-explicitly-loaded`;
const LEGACY_SEED_CASE_IDS = new Set(["case-002", "case-003"]);
const LEGACY_DEMO_DOCUMENT_IDS = new Set([
  "doc-1",
  "doc-2",
  "doc-3",
  "doc-4",
  "doc-5",
]);
const LEGACY_DEMO_FINDING_IDS = new Set(["f-1", "f-2", "f-3", "f-4", "f-5"]);
const LEGACY_DEMO_CONFLICT_IDS = new Set(["c-1", "c-2", "c-3"]);
const LEGACY_DEMO_GAP_IDS = new Set(["g-1", "g-2", "g-3"]);
const LEGACY_DEMO_TIMELINE_IDS = new Set([
  "t-1",
  "t-2",
  "t-3",
  "t-4",
  "t-5",
  "t-6",
]);

interface StoreShape {
  cases: ClinicalCase[];
}

function removeLegacyDemoData(clinicalCase: ClinicalCase): ClinicalCase {
  return {
    ...clinicalCase,
    documents: clinicalCase.documents.filter(
      (document) => !LEGACY_DEMO_DOCUMENT_IDS.has(document.id),
    ),
    findings: clinicalCase.findings.filter(
      (finding) => !LEGACY_DEMO_FINDING_IDS.has(finding.id),
    ),
    conflicts: clinicalCase.conflicts.filter(
      (conflict) => !LEGACY_DEMO_CONFLICT_IDS.has(conflict.id),
    ),
    gaps: clinicalCase.gaps.filter((gap) => !LEGACY_DEMO_GAP_IDS.has(gap.id)),
    timeline: clinicalCase.timeline.filter(
      (event) => !LEGACY_DEMO_TIMELINE_IDS.has(event.id),
    ),
  };
}

function loadInitial(): StoreShape {
  if (typeof window === "undefined") return { cases: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as StoreShape;
      if (!Array.isArray(stored.cases)) return { cases: [] };

      const demoExplicitlyLoaded =
        window.localStorage.getItem(EXPLICIT_DEMO_KEY) === "true";
      return {
        ...stored,
        cases: stored.cases
          .filter(
            (clinicalCase) =>
              !LEGACY_SEED_CASE_IDS.has(clinicalCase.id) &&
              (clinicalCase.id !== DEMO_CASE_ID || demoExplicitlyLoaded),
          )
          .map((clinicalCase) =>
            clinicalCase.id === DEMO_CASE_ID
              ? clinicalCase
              : removeLegacyDemoData(clinicalCase),
          ),
      };
    }
  } catch {
    // ignore corrupted storage and start empty
  }
  return { cases: [] };
}

async function stableHash(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

interface CaseStoreApi {
  cases: ClinicalCase[];
  getCase: (id: string) => ClinicalCase | undefined;
  createCase: (subjectLabel: string) => ClinicalCase;
  loadDemoCase: () => void;
  addDocuments: (
    caseId: string,
    files: {
      name: string;
      sizeLabel: string;
      pages: number;
      extractedPages: string[];
      extractionStatus: "text_extracted" | "no_text" | "unreadable";
      objectKey?: string;
      storageProvider?: "aws-s3" | "local-demo";
      encryptionStatus?: "kms" | "s3-managed" | "local-demo";
      sha256?: string;
      processingError?: string;
    }[],
  ) => void;
  runAnalysis: (caseId: string) => void;
  submitDecisions: (caseId: string, decisions: ReviewDecision[]) => void;
  completeReview: (caseId: string, reviewer: string, decisions: ReviewDecision[]) => Promise<Attestation>;
  jevItemsFor: (caseId: string) => JevItem[];
}

const CaseStoreContext = createContext<CaseStoreApi | null>(null);

let caseCounter = 143;

export function CaseStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreShape>({ cases: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadInitial());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const api = useMemo<CaseStoreApi>(() => {
    return {
      cases: state.cases,
      getCase: (id) => state.cases.find((c) => c.id === id),
      createCase: (subjectLabel: string) => {
        caseCounter += 1;
        const newCase: ClinicalCase = {
          id: `case-${Date.now()}`,
          reference: `IASX-2025-${String(caseCounter).padStart(6, "0")}`,
          subjectLabel:
            subjectLabel ||
            `Sujeito de revisão #${caseCounter} (dados fictícios)`,
          createdAt: new Date().toISOString(),
          status: "rascunho",
          documents: [],
          findings: [],
          conflicts: [],
          gaps: [],
          timeline: [],
        };
        setState((s) => ({ cases: [newCase, ...s.cases] }));
        return newCase;
      },
      loadDemoCase: () => {
        window.localStorage.setItem(EXPLICIT_DEMO_KEY, "true");
        setState((s) =>
          s.cases.some((c) => c.id === DEMO_CASE_ID)
            ? s
            : { cases: [buildDemoCase(), ...s.cases] },
        );
      },
      addDocuments: (caseId, files) => {
        setState((s) => ({
          cases: s.cases.map((c) => {
            if (c.id !== caseId) return c;
            const docs: ClinicalDocument[] = files.map((f, i) => ({
              id: `${caseId}-doc-${c.documents.length + i + 1}`,
              name: f.name,
              type: "Documento enviado",
              pages: f.pages,
              uploadedAt: new Date().toISOString(),
              sizeLabel: f.sizeLabel,
              origin: "user_upload",
              fileStored: Boolean(f.objectKey),
              objectKey: f.objectKey,
              storageProvider: f.storageProvider,
              encryptionStatus: f.encryptionStatus,
              processingError: f.processingError,
              sha256: f.sha256,
              extractedPages: f.extractedPages,
              extractionStatus: f.extractionStatus,
            }));
            return {
              ...c,
              documents: [...c.documents, ...docs],
              status: "aguardando_upload",
            };
          }),
        }));
      },
      runAnalysis: (caseId) => {
        setState((s) => ({
          cases: s.cases.map((c) =>
            c.id === caseId ? { ...c, status: "em_analise" } : c,
          ),
        }));

        setTimeout(() => {
          setState((s) => ({
            cases: s.cases.map((c) => {
              if (c.id !== caseId) return c;
              if (caseId === DEMO_CASE_ID) {
                return { ...c, status: "revisao_pendente" };
              }

              const analysis = analyzeClinicalDocuments(c.documents);
              return {
                ...c,
                status: "revisao_pendente",
                ...analysis,
              };
            }),
          }));
        }, 3200);
      },

      submitDecisions: (caseId, decisions) => {
        setState((s) => ({
          cases: s.cases.map((c) =>
            c.id === caseId ? { ...c, reviewDecisions: decisions } : c,
          ),
        }));
      },
      completeReview: async (caseId, reviewer, decisions) => {
        const clinicalCase = state.cases.find((item) => item.id === caseId);
        if (!clinicalCase) throw new Error("Caso não encontrado para registrar a revisão.");
        const reviewSnapshot = await createReviewSnapshot(clinicalCase, decisions);
        const completedAt = new Date().toISOString();
        const attestation: Attestation = {
          attestationId: `LOCAL-${caseId.slice(-6).toUpperCase()}-${reviewSnapshot.contentHash.slice(0, 8).toUpperCase()}`,
          reviewer,
          completedAt,
          contentHash: reviewSnapshot.contentHash,
          status: "local",
          snapshotVersion: reviewSnapshot.version,
          documentHashes: reviewSnapshot.documentHashes,
          analysisHash: reviewSnapshot.analysisHash,
          decisionsHash: reviewSnapshot.decisionsHash,
        };
        setState((s) => ({
          cases: s.cases.map((c) =>
            c.id === caseId
              ? { ...c, status: "revisao_concluida", reviewDecisions: decisions, attestation, reviewSnapshot }
              : c,
          ),
        }));
        return attestation;
      },
      jevItemsFor: (caseId) => {
        if (caseId === DEMO_CASE_ID) return jevItemsForDemo;

        const clinicalCase = state.cases.find((c) => c.id === caseId);
        if (!clinicalCase) return [];

        return [
          ...clinicalCase.findings.map(
            (finding): JevItem => ({
              id: `jev-${finding.id}`,
              relatedTitle: finding.title,
              relatedType: "finding",
              humanReviewRequired: true,
              priority: finding.confidence,
              clarity: finding.confidence,
              reason: finding.summary,
            }),
          ),
          ...clinicalCase.conflicts.map(
            (conflict): JevItem => ({
              id: `jev-${conflict.id}`,
              relatedTitle: conflict.title,
              relatedType: "conflict",
              humanReviewRequired: true,
              priority: conflict.severity,
              clarity: "media",
              reason: conflict.description,
            }),
          ),
          ...clinicalCase.gaps.map(
            (gap): JevItem => ({
              id: `jev-${gap.id}`,
              relatedTitle: gap.title,
              relatedType: "gap",
              humanReviewRequired: true,
              priority: "baixa",
              clarity: "media",
              reason: gap.description,
            }),
          ),
        ];
      },
    };
  }, [state]);

  return (
    <CaseStoreContext.Provider value={api}>
      {children}
    </CaseStoreContext.Provider>
  );
}

export function useCaseStore() {
  const ctx = useContext(CaseStoreContext);
  if (!ctx)
    throw new Error("useCaseStore must be used within CaseStoreProvider");
  return ctx;
}
