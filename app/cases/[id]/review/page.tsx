"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCaseStore } from "@/lib/store";
import AppShell from "@/components/AppShell";
import CaseHeader from "@/components/CaseHeader";
import ClinicalAssistant from "@/components/ClinicalAssistant";
import ConflictModal from "@/components/ConflictModal";
import TrendChart from "@/components/TrendChart";
import { Card, StatBlock, LevelPill, EvidenceQuote } from "@/components/ui";
import { DEMO_CASE_ID, labTrend } from "@/lib/mockData";
import { ClinicalCase, Conflict, EvidenceRef, Finding } from "@/lib/types";
import { AlertTriangle, UserCheck, ShieldCheck, FileText, ExternalLink } from "lucide-react";

type Tab = "geral" | "timeline" | "conflitos" | "lacunas" | "estruturada";

function formatDate(iso: string) {
  if (!iso) return "Data não informada";
  if (/^\d{4}$/.test(iso)) return iso;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

const TYPE_LABEL: Record<string, string> = { finding: "Achado", conflict: "Conflito", gap: "Lacuna" };

function trendForCase(clinicalCase: ClinicalCase) {
  const measurableEvents = clinicalCase.timeline.filter(
    (event) => Boolean(event.date) && typeof event.value === "number" && Boolean(event.metric) && Boolean(event.unit)
  );
  const firstEvent = measurableEvents[0];
  if (!firstEvent?.metric || !firstEvent.unit) return null;

  const matchingEvents = measurableEvents.filter(
    (event) => event.metric === firstEvent.metric && event.unit === firstEvent.unit
  );
  if (matchingEvents.length < 2) return null;

  return {
    metric: firstEvent.metric,
    unit: firstEvent.unit,
    points: matchingEvents.map((event) => ({ date: event.date, value: event.value as number })),
  };
}

export default function ReviewPage() {
  const params = useParams<{ id: string }>();
  const { getCase, jevItemsFor } = useCaseStore();
  const clinicalCase = getCase(params.id);
  const [tab, setTab] = useState<Tab>("geral");
  const [openConflict, setOpenConflict] = useState<Conflict | null>(null);
  const [openEvidence, setOpenEvidence] = useState<{ finding: Finding; evidence: EvidenceRef } | null>(null);

  if (!clinicalCase) {
    return (
      <AppShell>
        <main className="flex-1 flex items-center justify-center text-muted text-sm">Caso não encontrado.</main>
      </AppShell>
    );
  }

  const isAnalyzing = clinicalCase.status === "em_analise";
  const jevItems = jevItemsFor(clinicalCase.id);
  const trend = clinicalCase.id === DEMO_CASE_ID ? labTrend : trendForCase(clinicalCase);
  const requiredCount = jevItems.filter((i) => i.humanReviewRequired).length;
  const decisionLabel = { confirmado: "Confirmado", corrigido: "Corrigido", rejeitado: "Rejeitado" } as const;

  const TABS: { key: Tab; label: string }[] = [
    { key: "geral", label: "Visão geral" },
    { key: "timeline", label: "Timeline" },
    { key: "conflitos", label: `Conflitos (${clinicalCase.conflicts.length})` },
    { key: "lacunas", label: `Lacunas (${clinicalCase.gaps.length})` },
    { key: "estruturada", label: "Revisão estruturada" },
  ];

  return (
    <AppShell>
      <main className="flex-1 bg-paper flex flex-col">
        <CaseHeader
          clinicalCase={clinicalCase}
          subtitle={`${clinicalCase.documents.length} ${clinicalCase.documents.length === 1 ? "documento" : "documentos"} · análise concluída`}
          action={{ label: "Revisar achados →", href: `/cases/${clinicalCase.id}/professional-review` }}
        />

        {isAnalyzing ? (
          <div className="max-w-5xl mx-auto w-full px-6 py-16 text-sm text-muted text-center">
            Este caso ainda não possui análise concluída.{" "}
            <Link href={`/cases/${clinicalCase.id}/analyzing`} className="text-brand-dark hover:underline">
              Executar análise
            </Link>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto w-full px-6 py-6 flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <Card className="px-5 py-4">
                <StatBlock label="Documentos" value={clinicalCase.documents.length} />
              </Card>
              <Card className="px-5 py-4">
                <StatBlock label="Achados" value={clinicalCase.findings.length} />
              </Card>
              <Card className="px-5 py-4">
                <StatBlock label="Conflitos" value={clinicalCase.conflicts.length} />
              </Card>
              <Card className="px-5 py-4">
                <StatBlock label="Lacunas" value={clinicalCase.gaps.length} />
              </Card>
            </div>

            <div className="flex items-center gap-1 border-b border-line mb-6 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`shrink-0 text-sm px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
                    tab === t.key ? "border-brand text-brand-dark font-medium" : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "geral" && (
              <div className="space-y-3">
                {clinicalCase.findings.map((f) => (
                  <Card key={f.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs text-muted">{f.category}</span>
                        <h4 className="text-sm font-medium text-ink mt-0.5">{f.title}</h4>
                      </div>
                      <LevelPill level={f.confidence} label={`Confiança ${f.confidence === "alta" ? "alta" : f.confidence === "media" ? "média" : "baixa"}`} />
                    </div>
                    {clinicalCase.reviewDecisions?.filter((decision) => decision.itemId === f.id).map((decision) => (
                      <span key={`${decision.itemId}-${decision.decidedAt}`} className="inline-flex mt-2 rounded-full border border-success/20 bg-success-light px-2.5 py-0.5 text-xs font-medium text-success-dark">Revisão: {decisionLabel[decision.action]}</span>
                    ))}
                    <p className="text-sm text-muted mt-2 leading-relaxed">{f.summary}</p>
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Evidências e fontes</p>
                      {f.evidence.map((ev, i) => (
                        <button key={i} type="button" onClick={() => setOpenEvidence({ finding: f, evidence: ev })} className="focus-ring w-full text-left rounded-lg hover:border-brand/50 transition-colors">
                          <EvidenceQuote docName={ev.docName} page={ev.page} excerpt={ev.excerpt} />
                          <span className="block px-3 pb-2 text-xs font-medium text-brand-dark">Ver detalhes da evidência <ExternalLink size={12} className="inline ml-1" /></span>
                        </button>
                      ))}
                    </div>
                  </Card>
                ))}
                {clinicalCase.findings.length === 0 && <p className="text-sm text-muted">Nenhum achado identificado.</p>}
              </div>
            )}

            {tab === "timeline" && (
              <div className="space-y-6">
                {trend ? (
                  <Card className="px-5 py-5">
                    <TrendChart points={trend.points} metric={trend.metric} unit={trend.unit} />
                  </Card>
                ) : (
                  <p className="text-sm text-muted">Sem dados suficientes para montar uma tendência.</p>
                )}
                <Card className="px-5 py-4">
                  <ol className="relative border-l border-line ml-1.5 space-y-5">
                    {clinicalCase.timeline.map((ev) => (
                      <li key={ev.id} className="ml-4">
                        <span className="absolute -translate-x-[calc(0.375rem+1px)] mt-1.5 h-2 w-2 rounded-full bg-brand" />
                        <span className="text-xs text-muted font-mono">{formatDate(ev.date)}</span>
                        <p className="text-sm text-ink">{ev.label}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {ev.docName}{ev.page ? ` · pág. ${ev.page}` : ""}
                        </p>
                      </li>
                    ))}
                    {clinicalCase.timeline.length === 0 && (
                      <p className="text-sm text-muted">Sem eventos suficientes para montar uma timeline.</p>
                    )}
                  </ol>
                </Card>
              </div>
            )}

            {tab === "conflitos" && (
              <div className="space-y-2.5">
                {clinicalCase.conflicts.map((c) => (
                  <div key={c.id} className="bg-panel border border-line rounded-lg px-4 py-4 shadow-card">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold text-ink leading-snug">{c.title}</h3>
                      <LevelPill level={c.severity} label={`Severidade ${c.severity}`} />
                    </div>
                    <p className="text-sm text-muted mt-2 leading-relaxed">{c.description}</p>
                    {clinicalCase.reviewDecisions?.filter((decision) => decision.itemId === c.id).map((decision) => (
                      <span key={`${decision.itemId}-${decision.decidedAt}`} className="inline-flex mt-2 rounded-full border border-success/20 bg-success-light px-2.5 py-0.5 text-xs font-medium text-success-dark">Revisão: {decisionLabel[decision.action]}</span>
                    ))}
                    <div className="grid md:grid-cols-2 gap-3 mt-4">
                      {[{ label: "Fonte A", source: c.sourceA }, { label: "Fonte B", source: c.sourceB }].map(({ label, source }) => (
                        <div key={label} className="rounded-md border border-line bg-paper px-3.5 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
                          <p className="text-xs font-mono text-ink/80 mt-1 break-words">{source.docName} · p. {source.page}</p>
                          <p className="text-sm text-ink mt-2 leading-relaxed">“{source.excerpt}”</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                      <p className="text-xs text-muted">Fontes divergentes para revisão</p>
                      <button type="button" onClick={() => setOpenConflict(c)} className="focus-ring text-sm font-medium text-brand-dark hover:underline">Revisar conflito</button>
                    </div>
                  </div>
                ))}
                {clinicalCase.conflicts.length === 0 && <p className="text-sm text-muted">Nenhum conflito identificado entre as fontes.</p>}
              </div>
            )}

            {tab === "lacunas" && (
              <div className="space-y-2.5">
                {clinicalCase.gaps.map((g) => (
                  <Card key={g.id} className="px-4 py-3.5">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-amber shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-ink leading-snug">{g.title}</p>
                        <p className="text-xs text-muted mt-1 leading-relaxed">{g.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
                {clinicalCase.gaps.length === 0 && <p className="text-sm text-muted">Nenhuma lacuna relevante identificada.</p>}
              </div>
            )}

            {tab === "estruturada" && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={16} className="text-brand-dark" />
                  <h3 className="text-sm font-semibold text-ink">Julgamento e Encaminhamento (JEV)</h3>
                </div>
                <Card className="px-5 py-4 mb-5 flex items-center gap-3 bg-brand-light/40 border-brand/20">
                  <UserCheck size={18} className="text-brand-dark shrink-0" />
                  <p className="text-sm text-ink">
                    <strong className="font-semibold">{requiredCount}</strong> de {jevItems.length} itens foram
                    sinalizados como necessitando revisão humana antes da conclusão do caso.
                  </p>
                </Card>
                <p className="text-xs text-muted mb-3">Indicadores de fluxo para apoiar a revisão humana; não representam diagnóstico ou decisão médica.</p>
                <div className="space-y-3">
                  {jevItems.map((item) => (
                    <Card key={item.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-brand-dark">{TYPE_LABEL[item.relatedType]}</span>
                          <p className="text-sm font-semibold text-ink mt-1 leading-snug">{item.relatedTitle}</p>
                          <p className="text-sm text-muted mt-2 leading-relaxed">{item.reason}</p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${item.humanReviewRequired ? "bg-amber-light text-amber border-amber/20" : "bg-ink/5 text-muted border-ink/10"}`}>
                          {item.humanReviewRequired ? "Revisão humana necessária" : "Revisão humana opcional"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-5 mt-4 pt-3 border-t border-line">
                        <div className="flex items-center gap-2"><span className="text-xs text-muted">Prioridade do fluxo</span><LevelPill level={item.priority} /></div>
                        <div className="flex items-center gap-2"><span className="text-xs text-muted">Clareza do registro</span><LevelPill level={item.clarity} /></div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {(clinicalCase.status === "revisao_pendente" || clinicalCase.status === "revisao_concluida") && (
              <ClinicalAssistant key={clinicalCase.id} clinicalCase={clinicalCase} />
            )}
          </div>
        )}
      </main>
      <ConflictModal conflict={openConflict} onClose={() => setOpenConflict(null)} reviewHref={`/cases/${clinicalCase.id}/professional-review`} />
      {openEvidence && (() => {
        const doc = clinicalCase.documents.find((document) => document.id === openEvidence.evidence.docId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="evidence-title">
            <button type="button" aria-label="Fechar detalhe da evidência" onClick={() => setOpenEvidence(null)} className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]" />
            <div className="relative w-full max-w-xl bg-panel border border-line rounded-xl shadow-xl">
              <div className="px-6 py-5 border-b border-line">
                <span className="text-xs uppercase tracking-wide text-muted">Detalhe da evidência</span>
                <h2 id="evidence-title" className="text-base font-semibold text-ink mt-1">{openEvidence.finding.title}</h2>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div><p className="text-xs text-muted">Tipo do achado</p><p className="text-sm font-medium text-ink mt-1">{openEvidence.finding.category}</p></div>
                <div className="rounded-md border border-line bg-paper px-4 py-3">
                  <div className="flex items-center gap-2 text-brand-dark"><FileText size={15} /><span className="text-xs font-semibold">Documento de origem</span></div>
                  <p className="text-sm font-medium text-ink mt-2 break-words">{openEvidence.evidence.docName}</p>
                  <p className="text-xs text-muted mt-1">Página {openEvidence.evidence.page}{doc?.type ? ` · ${doc.type}` : ""}{doc?.uploadedAt ? ` · ${formatDate(doc.uploadedAt)}` : ""}</p>
                </div>
                <blockquote className="border-l-2 border-brand bg-brand-light/30 px-4 py-3 text-sm text-ink leading-relaxed">“{openEvidence.evidence.excerpt}”</blockquote>
              </div>
              <div className="px-6 py-4 border-t border-line flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setOpenEvidence(null)} className="focus-ring text-sm font-medium text-ink border border-line px-4 py-2 rounded-md hover:bg-ink/5">Fechar</button>
                <Link href={`/cases/${clinicalCase.id}/professional-review`} className="focus-ring text-sm font-medium text-white bg-brand hover:bg-brand-dark px-4 py-2 rounded-md">Enviar para revisão</Link>
              </div>
            </div>
          </div>
        );
      })()}
    </AppShell>
  );
}
