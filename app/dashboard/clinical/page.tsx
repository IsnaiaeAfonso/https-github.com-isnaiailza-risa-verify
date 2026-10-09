"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { Card, EvidenceQuote, LevelPill, MetricCard, StatusPill } from "@/components/ui";
import { useCaseStore } from "@/lib/store";
import { useDoctorPreferences } from "@/lib/doctorPreferences";
import { AlertTriangle, ArrowRight, FileCheck2, Fingerprint, ListChecks, ShieldCheck, Stethoscope } from "lucide-react";

export default function ClinicalValueDashboardPage() {
  const { cases } = useCaseStore();
  const preferences = useDoctorPreferences();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(cases[0]?.id ?? null);
  const selectedCase = useMemo(
    () => cases.find((clinicalCase) => clinicalCase.id === selectedCaseId) ?? cases[0],
    [cases, selectedCaseId]
  );

  const highPriority = selectedCase?.conflicts.filter((conflict) => conflict.severity === "alta").length ?? 0;
  const evidenceCount = selectedCase
    ? selectedCase.findings.reduce((total, finding) => total + finding.evidence.length, 0) +
      selectedCase.conflicts.length * 2
    : 0;

  if (!selectedCase) {
    return (
      <AppShell>
        <main className="flex-1 flex items-center justify-center bg-paper px-6 text-sm text-muted">
          Carregue um caso para consultar o painel de valor clínico.
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex-1 bg-paper">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-brand-dark">Valor clínico</p>
              <h1 className="text-[28px] font-semibold tracking-tight text-ink mt-1">Quadro de evidências e risco</h1>
              <p className="text-sm text-muted mt-1">Resumo documentado para suporte à revisão profissional.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.showRisaSection && (
                <Link href={`/cases/${selectedCase.id}/review?tab=risa`} className="inline-flex items-center gap-2 rounded-md border border-brand/30 bg-brand-light/50 px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-brand-light">
                  <Stethoscope size={15} /> RISA — Escuta Clínica
                </Link>
              )}
              {preferences.showClinicalSummary && (
                <Link href={`/cases/${selectedCase.id}/final-summary`} className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark px-4 py-2.5 rounded-md text-sm font-medium text-white">
                  Abrir resumo final <ArrowRight size={15} />
                </Link>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon={FileCheck2} label="Documentos" value={selectedCase.documents.length} tone="neutral" />
            <MetricCard icon={ListChecks} label="Achados" value={selectedCase.findings.length} tone="amber" />
            {preferences.showRiskCards && (
              <MetricCard icon={AlertTriangle} label="Conflitos" value={selectedCase.conflicts.length} tone="rust" />
            )}
            {preferences.showRiskCards && (
              <MetricCard icon={Fingerprint} label="Evidências" value={evidenceCount} tone="success" />
            )}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">Caso selecionado</p>
                  <h2 className="text-lg font-semibold text-ink mt-1">{selectedCase.reference}</h2>
                </div>
                <StatusPill status={selectedCase.status} />
              </div>
              <div className="mt-3 text-sm text-muted">{selectedCase.subjectLabel}</div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {cases.map((clinicalCase) => (
                  <button
                    key={clinicalCase.id}
                    type="button"
                    onClick={() => setSelectedCaseId(clinicalCase.id)}
                    className={`rounded-lg border px-4 py-3 text-left transition-colors ${selectedCase.id === clinicalCase.id ? "border-brand bg-brand-light/40" : "border-line bg-paper hover:border-brand/50"}`}
                  >
                    <span className="block text-sm font-medium text-ink">{clinicalCase.reference}</span>
                    <span className="mt-1 block text-xs text-muted">{clinicalCase.documents.length} documentos · {clinicalCase.findings.length} achados</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-brand-dark" />
                <h2 className="text-sm font-semibold text-ink">Resumo de risco para revisão</h2>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-rust/20 bg-rust-light/50 px-4 py-3">
                  <div className="flex justify-between text-xs text-rust">
                    <span>Conflitos de alta severidade</span><strong>{highPriority}</strong>
                  </div>
                  <p className="text-xs text-muted mt-1">Exigem comparação cuidadosa entre fontes.</p>
                </div>
                <div className="rounded-lg border border-amber/20 bg-amber-light/50 px-4 py-3">
                  <div className="flex justify-between text-xs text-amber">
                    <span>Achados de baixa confiança</span><strong>{selectedCase.findings.filter((finding) => finding.confidence === "baixa").length}</strong>
                  </div>
                  <p className="text-xs text-muted mt-1">Requerem confirmação por documentação adicional.</p>
                </div>
                <div className="rounded-lg border border-brand/20 bg-brand-light/40 px-4 py-3">
                  <div className="flex justify-between text-xs text-brand-dark">
                    <span>Fontes rastreáveis</span><strong>{evidenceCount}</strong>
                  </div>
                  <p className="text-xs text-muted mt-1">Cada item está vinculado a um documento e uma página.</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Stethoscope size={17} className="text-brand-dark" />
                <h2 className="text-sm font-semibold text-ink">Achados identificados</h2>
              </div>
              <div className="mt-4 space-y-3">
                {selectedCase.findings.map((finding) => (
                  <div key={finding.id} className="rounded-lg border border-line bg-paper p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-ink">{finding.title}</p>
                        <p className="text-xs text-muted mt-1">{finding.category}</p>
                      </div>
                      <LevelPill level={finding.confidence} meaning="confidence" />
                    </div>
                    <p className="text-xs leading-relaxed text-muted mt-2">{finding.summary}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Fingerprint size={17} className="text-brand-dark" />
                <h2 className="text-sm font-semibold text-ink">Evidências documentadas</h2>
              </div>
              <div className="mt-4 space-y-3">
                {selectedCase.findings.flatMap((finding) => finding.evidence).slice(0, 5).map((evidence, index) => (
                  <EvidenceQuote key={`${evidence.docId}-${index}`} docName={evidence.docName} page={evidence.page} excerpt={evidence.excerpt} />
                ))}
              </div>
            </Card>
          </div>

          <Card className="mt-6 p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-brand-dark" />
              <h2 className="text-sm font-semibold text-ink">Limitação do sistema</h2>
            </div>
            <p className="text-sm leading-6 text-muted mt-3">
              Este painel organiza achados, evidências, conflitos e lacunas. A IA não substitui o julgamento do profissional, não fornece diagnóstico e não recomenda tratamento. A decisão final deve ser feita pelo médico após consulta dos documentos e das fontes disponíveis.
            </p>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
