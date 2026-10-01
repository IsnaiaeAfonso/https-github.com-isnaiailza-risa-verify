"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ClinicalCase,
  ClinicalDocument,
  ReviewDecision,
  Attestation,
} from "./types";
import { seedCases, buildDemoCase, jevItemsForDemo, DEMO_CASE_ID } from "./mockData";

const STORAGE_KEY = "iasx-clinical-review-state-v1";

interface StoreShape {
  cases: ClinicalCase[];
}

function loadInitial(): StoreShape {
  if (typeof window === "undefined") return { cases: seedCases };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoreShape;
  } catch {
    // ignore corrupted storage, fall back to seed
  }
  return { cases: seedCases };
}

interface CaseStoreApi {
  cases: ClinicalCase[];
  getCase: (id: string) => ClinicalCase | undefined;
  createCase: (subjectLabel: string) => ClinicalCase;
  addDocuments: (caseId: string, files: { name: string; sizeLabel: string }[]) => void;
  runAnalysis: (caseId: string) => void;
  submitDecisions: (caseId: string, decisions: ReviewDecision[]) => void;
  completeReview: (caseId: string, reviewer: string) => Attestation;
  jevItemsFor: (caseId: string) => typeof jevItemsForDemo;
}

const CaseStoreContext = createContext<CaseStoreApi | null>(null);

let caseCounter = 143;

export function CaseStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreShape>(() => loadInitial());
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
          subjectLabel: subjectLabel || `Sujeito de revisão #${caseCounter} (dados fictícios)`,
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
      addDocuments: (caseId, files) => {
        setState((s) => ({
          cases: s.cases.map((c) => {
            if (c.id !== caseId) return c;
            const docs: ClinicalDocument[] = files.map((f, i) => ({
              id: `${caseId}-doc-${c.documents.length + i + 1}`,
              name: f.name,
              type: "Documento enviado",
              pages: Math.max(1, Math.round(Math.random() * 6)),
              uploadedAt: new Date().toISOString(),
              sizeLabel: f.sizeLabel,
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
          cases: s.cases.map((c) => (c.id === caseId ? { ...c, status: "em_analise" } : c)),
        }));
        // simulate async pipeline completion; UI screen also drives its own timer,
        // this just ensures the underlying record is populated once analysis "finishes".
        setTimeout(() => {
          setState((s) => ({
            cases: s.cases.map((c) => {
              if (c.id !== caseId) return c;
              const demo = buildDemoCase();
              return {
                ...c,
                status: "revisao_pendente",
                documents: c.documents.length ? c.documents : demo.documents,
                findings: demo.findings,
                conflicts: demo.conflicts,
                gaps: demo.gaps,
                timeline: demo.timeline,
              };
            }),
          }));
        }, 3200);
      },
      submitDecisions: (caseId, decisions) => {
        setState((s) => ({
          cases: s.cases.map((c) =>
            c.id === caseId ? { ...c, reviewDecisions: decisions } : c
          ),
        }));
      },
      completeReview: (caseId, reviewer) => {
        const txChars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
        const randomTx = Array.from({ length: 44 }, () =>
          txChars[Math.floor(Math.random() * txChars.length)]
        ).join("");
        const randomHash = Array.from({ length: 64 }, () =>
          "0123456789abcdef"[Math.floor(Math.random() * 16)]
        ).join("");
        const attestation: Attestation = {
          attestationId: `ATT-${caseId.slice(-6).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
          reviewer,
          completedAt: new Date().toISOString(),
          network: "Solana Devnet",
          transactionId: randomTx,
          contentHash: randomHash,
          status: "confirmado",
        };
        setState((s) => ({
          cases: s.cases.map((c) =>
            c.id === caseId ? { ...c, status: "revisao_concluida", attestation } : c
          ),
        }));
        return attestation;
      },
      jevItemsFor: (caseId) => {
        // Mock: demo case gets curated JEV items, others get a generic subset.
        return caseId === DEMO_CASE_ID ? jevItemsForDemo : jevItemsForDemo.slice(0, 3);
      },
    };
  }, [state]);

  return <CaseStoreContext.Provider value={api}>{children}</CaseStoreContext.Provider>;
}

export function useCaseStore() {
  const ctx = useContext(CaseStoreContext);
  if (!ctx) throw new Error("useCaseStore must be used within CaseStoreProvider");
  return ctx;
}
