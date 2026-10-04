"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCaseStore } from "@/lib/store";
import AppShell from "@/components/AppShell";
import CaseHeader from "@/components/CaseHeader";
import { Card, EvidenceQuote, LevelPill } from "@/components/ui";
import { ReviewAction, ReviewDecision } from "@/lib/types";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Info, PenLine, XCircle } from "lucide-react";

interface ReviewEvidence {
  label: string;
  docName: string;
  page: number;
  excerpt: string;
}

interface ReviewItem {
  id: string;
  type: "finding" | "conflict";
  title: string;
  detail: string;
  category?: string;
  confidence?: "alta" | "media" | "baixa";
  severity?: "alta" | "media" | "baixa";
  evidence?: ReviewEvidence[];
  evidencePairs?: { label: string; docName: string; page: number; excerpt: string }[];
}

interface LocalDecision {
  action: ReviewAction;
  note: string;
  correctedValue: string;
}

const ACTION_ICONS = {
  confirmado: CheckCircle2,
  corrigido: PenLine,
  rejeitado: XCircle,
};

const ACTION_LABELS: Record<ReviewAction, string> = {
  confirmado: "Confirmado",
  corrigido: "Corrigido",
  rejeitado: "Rejeitado",
};

export default function ProfessionalReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getCase, submitDecisions, completeReview } = useCaseStore();
  const clinicalCase = getCase(params.id);

  const items: ReviewItem[] = useMemo(() => {
    if (!clinicalCase) return [];
    const findingItems: ReviewItem[] = clinicalCase.findings.map((finding) => ({
      id: finding.id,
      type: "finding",
      title: finding.title,
      detail: finding.summary,
      category: finding.category,
      confidence: finding.confidence,
      evidence: finding.evidence.map((evidence, index) => ({
        label: `Fonte ${index + 1}`,
        docName: evidence.docName,
        page: evidence.page,
        excerpt: evidence.excerpt,
      })),
    }));
    const conflictItems: ReviewItem[] = clinicalCase.conflicts.map((conflict) => ({
      id: conflict.id,
      type: "conflict",
      title: conflict.title,
      detail: conflict.description,
      severity: conflict.severity,
      evidencePairs: [
        { label: "Fonte A", ...conflict.sourceA },
        { label: "Fonte B", ...conflict.sourceB },
      ],
    }));
    return [...findingItems, ...conflictItems];
  }, [clinicalCase]);

  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, LocalDecision>>({});
  const [reviewer] = useState("Dr(a). Revisor(a) responsável");
  const [showAllEvidence, setShowAllEvidence] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [warning, setWarning] = useState("");

  if (!clinicalCase) {
    return <AppShell><main className="flex-1 flex items-center justify-center text-muted text-sm">Caso não encontrado.</main></AppShell>;
  }

  if (items.length === 0) {
    return <AppShell><main className="flex-1 flex items-center justify-center text-muted text-sm">Nenhum achado ou conflito para revisar neste caso.</main></AppShell>;
  }

  const activeCase = clinicalCase;
  const item = items[index];
  const decision = decisions[item.id];
  const isLast = index === items.length - 1;
  const decidedCount = Object.keys(decisions).filter((id) => decisions[id]?.action).length;
  const progress = Math.round((decidedCount / items.length) * 100);
  const correctionOriginal = item.type === "finding"
    ? item.title
    : `Fonte A: ${item.evidencePairs?.[0]?.excerpt ?? ""} · Fonte B: ${item.evidencePairs?.[1]?.excerpt ?? ""}`;

  function setAction(action: ReviewAction) {
    setWarning("");
    setDecisions((previous) => ({
      ...previous,
      [item.id]: {
        action,
        note: previous[item.id]?.note ?? "",
        correctedValue: previous[item.id]?.correctedValue ?? "",
      },
    }));
  }

  function setField(field: "note" | "correctedValue", value: string) {
    setDecisions((previous) => ({
      ...previous,
      [item.id]: {
        action: previous[item.id]?.action ?? "corrigido",
        note: previous[item.id]?.note ?? "",
        correctedValue: previous[item.id]?.correctedValue ?? "",
        [field]: value,
      },
    }));
  }

  function goTo(newIndex: number) {
    setShowAllEvidence(false);
    setWarning("");
    setIndex(Math.max(0, Math.min(items.length - 1, newIndex)));
  }

  function canContinue() {
    if (!decision?.action) {
      setWarning("Selecione uma ação para este item antes de continuar.");
      return false;
    }
    if (decision.action === "corrigido" && !decision.correctedValue.trim()) {
      setWarning("Informe o valor corrigido antes de continuar.");
      return false;
    }
    return true;
  }

  function handleContinue() {
    setWarning("");
    if (!canContinue()) return;
    if (!isLast) {
      goTo(index + 1);
      return;
    }
    const undecidedIndex = items.findIndex((reviewItem) => {
      const currentDecision = decisions[reviewItem.id];
      return !currentDecision?.action || (currentDecision.action === "corrigido" && !currentDecision.correctedValue.trim());
    });
    if (undecidedIndex >= 0) {
      setWarning("Revise todos os itens e preencha os valores corrigidos antes de concluir.");
      goTo(undecidedIndex);
      return;
    }
    setShowSummary(true);
  }

  function finishReview() {
    const reviewDecisions: ReviewDecision[] = items.map((reviewItem) => ({
      itemId: reviewItem.id,
      itemType: reviewItem.type,
      itemTitle: reviewItem.title,
      action: decisions[reviewItem.id].action,
      note: decisions[reviewItem.id].note.trim() || undefined,
      correctedValue: decisions[reviewItem.id].action === "corrigido"
        ? decisions[reviewItem.id].correctedValue.trim()
        : undefined,
      reviewer,
      decidedAt: new Date().toISOString(),
    }));
    submitDecisions(activeCase.id, reviewDecisions);
    completeReview(activeCase.id, reviewer);
    router.push(`/cases/${activeCase.id}/attestation`);
  }

  const actionOptions: { key: ReviewAction; label: string; description: string }[] = item.type === "finding"
    ? [
        { key: "confirmado", label: "Confirmar informação", description: "Considerar a informação apresentada correta." },
        { key: "corrigido", label: "Corrigir informação", description: "Registrar a informação revisada pelo profissional." },
        { key: "rejeitado", label: "Rejeitar achado", description: "Indicar que este achado não deve ser considerado na revisão." },
      ]
    : [
        { key: "confirmado", label: "Confirmar divergência", description: "Manter o conflito entre as fontes para a revisão do caso." },
        { key: "corrigido", label: "Registrar informação revisada", description: "Informar a interpretação revisada pelo profissional." },
        { key: "rejeitado", label: "Descartar conflito", description: "Indicar que a divergência não deve permanecer como conflito na revisão." },
      ];

  const summaryCounts = items.reduce<Record<ReviewAction, number>>((counts, reviewItem) => {
    const action = decisions[reviewItem.id]?.action;
    if (action) counts[action] += 1;
    return counts;
  }, { confirmado: 0, corrigido: 0, rejeitado: 0 });

  return (
    <AppShell>
      <main className="flex-1 bg-paper flex flex-col">
        <CaseHeader clinicalCase={clinicalCase} subtitle="Confirmação, correção ou rejeição dos achados" />
        <div className="max-w-5xl mx-auto w-full px-6 py-6 flex-1">
          <Card className="px-5 py-4 mb-5 flex items-start gap-3 border-brand/20 bg-brand-light/30">
            <Info size={18} className="text-brand-dark shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-ink">Revisão humana</p>
              <p className="text-sm text-muted mt-1 leading-relaxed">Revise as informações organizadas pelo CliniVerify antes de concluir o caso. O profissional confirma, corrige ou rejeita cada item; a atestação só acontece depois da revisão.</p>
            </div>
          </Card>

          {!showSummary ? (
            <>
              <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                <div>
                  <h2 className="text-lg font-semibold text-ink">Revisão profissional</h2>
                  <p className="text-sm text-muted mt-1">{decidedCount} de {items.length} itens revisados</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted tabular-nums">Item {index + 1} de {items.length}</span>
                  <button onClick={() => goTo(index - 1)} disabled={index === 0} className="focus-ring rounded-md border border-line p-1.5 text-ink/70 hover:bg-ink/5 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Item anterior"><ChevronLeft size={16} /></button>
                  <button onClick={() => goTo(index + 1)} disabled={isLast} className="focus-ring rounded-md border border-line p-1.5 text-ink/70 hover:bg-ink/5 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Próximo item"><ChevronRight size={16} /></button>
                </div>
              </div>
              <div className="h-2 rounded-full bg-line overflow-hidden mb-6" aria-label={`Progresso da revisão: ${progress}%`}>
                <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
              </div>

              <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5 items-start">
                <Card className="px-5 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">{item.type === "finding" ? "Achado" : "Conflito"} · Item {String(index + 1).padStart(2, "0")}</span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-amber/20 bg-amber-light text-amber">{decision?.action ? "Revisado" : "Pendente de revisão"}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {item.category && <span className="text-xs text-muted rounded-full bg-ink/5 px-2.5 py-1">{item.category}</span>}
                    {item.confidence && <LevelPill level={item.confidence} label={`Sinal do sistema · confiança ${item.confidence}`} />}
                    {item.severity && <LevelPill level={item.severity} label={`Severidade ${item.severity}`} />}
                  </div>
                  <h3 className="text-base font-semibold text-ink mt-3">{item.title}</h3>
                  <p className="text-sm text-muted mt-2 leading-relaxed">{item.detail}</p>

                  {item.evidence && item.evidence.length > 0 && (
                    <div className="mt-5 space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Evidência principal</h4>
                      {(showAllEvidence ? item.evidence : item.evidence.slice(0, 1)).map((evidence, evidenceIndex) => (
                        <div key={`${evidence.docName}-${evidence.page}`} className="rounded-lg border border-brand/20 bg-brand-light/20 p-3.5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">{evidence.label}</p>
                          <p className="text-xs text-muted mt-1">{evidence.docName} · página {evidence.page}</p>
                          <div className="mt-2"><EvidenceQuote docName={evidence.docName} page={evidence.page} excerpt={evidence.excerpt} /></div>
                          {evidenceIndex === 0 && item.evidence && item.evidence.length > 1 && !showAllEvidence && <p className="text-[11px] text-muted mt-2">Evidência principal entre {item.evidence.length} fontes registradas.</p>}
                        </div>
                      ))}
                      {item.evidence.length > 1 && <button onClick={() => setShowAllEvidence((show) => !show)} className="focus-ring text-xs font-medium text-brand-dark hover:underline">{showAllEvidence ? "Mostrar menos" : `Ver outras evidências (${item.evidence.length - 1})`}</button>}
                    </div>
                  )}

                  {item.evidencePairs && (
                    <div className="mt-5">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Fontes em comparação</h4>
                      <div className="grid md:grid-cols-[1fr_auto_1fr] items-stretch gap-3">
                        <div className="rounded-lg border border-brand/30 bg-brand-light/30 px-3.5 py-3">
                          <p className="text-xs font-semibold tracking-wide text-muted">FONTE A</p>
                          <p className="text-xs font-mono text-ink/80 mt-2 break-words">{item.evidencePairs[0].docName}</p>
                          <p className="text-xs text-muted mt-1 mb-2">Página {item.evidencePairs[0].page}</p>
                          <p className="text-sm text-ink leading-relaxed">“{item.evidencePairs[0].excerpt}”</p>
                        </div>
                        <span className="flex items-center justify-center text-xs font-bold tracking-widest text-rust">VS</span>
                        <div className="rounded-lg border border-rust/30 bg-rust-light/40 px-3.5 py-3">
                          <p className="text-xs font-semibold tracking-wide text-muted">FONTE B</p>
                          <p className="text-xs font-mono text-ink/80 mt-2 break-words">{item.evidencePairs[1].docName}</p>
                          <p className="text-xs text-muted mt-1 mb-2">Página {item.evidencePairs[1].page}</p>
                          <p className="text-sm text-ink leading-relaxed">“{item.evidencePairs[1].excerpt}”</p>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>

                <Card className="px-5 py-5">
                  <h4 className="text-sm font-semibold text-ink mb-1">Decisão do profissional</h4>
                  <p className="text-xs text-muted mb-3">O sinal de confiança/severidade apoia a revisão e não representa uma decisão clínica.</p>
                  <div className="space-y-2">
                    {actionOptions.map((option) => {
                      const Icon = ACTION_ICONS[option.key];
                      const active = decision?.action === option.key;
                      return (
                        <button key={option.key} onClick={() => setAction(option.key)} className={`focus-ring w-full flex items-start gap-2.5 text-left rounded-md border px-3.5 py-2.5 transition-colors ${active ? "border-brand bg-brand-light/50" : "border-line hover:border-ink/20"}`}>
                          <Icon size={16} className={`shrink-0 mt-0.5 ${active ? "text-brand-dark" : "text-muted"}`} />
                          <span><span className="block text-sm font-medium text-ink">{option.label}</span><span className="block text-xs text-muted mt-0.5">{option.description}</span></span>
                        </button>
                      );
                    })}
                  </div>

                  {decision?.action === "corrigido" && (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-md border border-line bg-paper px-3 py-2.5">
                        <p className="text-xs font-medium text-muted">Valor identificado pelo CliniVerify</p>
                        <p className="text-sm text-ink mt-1 leading-relaxed">{correctionOriginal}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1.5">Valor corrigido</label>
                        <input value={decision.correctedValue} onChange={(event) => setField("correctedValue", event.target.value)} placeholder="Informe o valor revisado" className="focus-ring w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/70" />
                        {!decision.correctedValue.trim() && <p className="text-xs text-amber mt-1">Preencha este campo para avançar.</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1.5">Justificativa</label>
                        <textarea value={decision.note} onChange={(event) => setField("note", event.target.value)} rows={3} placeholder="Registre a justificativa do profissional..." className="focus-ring w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/70 resize-none" />
                      </div>
                    </div>
                  )}

                  {decision?.action !== "corrigido" && (
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-muted mb-1.5">Observações (opcional)</label>
                      <textarea value={decision?.note ?? ""} onChange={(event) => setField("note", event.target.value)} rows={3} placeholder="Adicionar comentário sobre esta revisão..." className="focus-ring w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/70 resize-none" />
                    </div>
                  )}

                  {warning && <div className="mt-3 flex items-start gap-1.5 text-xs text-rust"><AlertCircle size={13} className="shrink-0 mt-0.5" />{warning}</div>}
                  <div className="mt-5 flex flex-wrap items-center gap-2.5">
                    <button onClick={() => router.push(`/cases/${clinicalCase.id}/review`)} className="focus-ring text-sm font-medium text-ink border border-line px-4 py-2 rounded-md hover:bg-ink/5 transition-colors">Cancelar</button>
                    <button onClick={handleContinue} className="focus-ring text-sm font-medium text-white bg-brand hover:bg-brand-dark transition-colors px-4 py-2 rounded-md shadow-card">{isLast ? "Ver resumo da revisão" : "Salvar e continuar"}</button>
                  </div>
                  <p className="text-xs text-muted mt-3">{decidedCount} de {items.length} itens com decisão registrada</p>
                </Card>
              </div>
            </>
          ) : (
            <div className="max-w-3xl mx-auto">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-ink">Resumo da revisão</h2>
                <p className="text-sm text-muted mt-1">Confira as decisões registradas pelo profissional antes de concluir e seguir para a atestação.</p>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {(["confirmado", "corrigido", "rejeitado"] as ReviewAction[]).map((action) => {
                  const Icon = ACTION_ICONS[action];
                  return <Card key={action} className="px-4 py-3 flex items-center gap-3"><Icon size={17} className="text-brand-dark shrink-0" /><div><p className="text-xl font-semibold text-ink tabular-nums">{summaryCounts[action]}</p><p className="text-xs text-muted">{ACTION_LABELS[action]}{summaryCounts[action] === 1 ? "" : "s"}</p></div></Card>;
                })}
              </div>
              <Card className="divide-y divide-line">
                {items.map((reviewItem, itemIndex) => {
                  const savedDecision = decisions[reviewItem.id];
                  const Icon = ACTION_ICONS[savedDecision.action];
                  return <div key={reviewItem.id} className="flex items-start justify-between gap-3 px-4 py-3"><div className="min-w-0"><p className="text-xs text-muted">{reviewItem.type === "finding" ? "Achado" : "Conflito"} · {String(itemIndex + 1).padStart(2, "0")}</p><p className="text-sm font-medium text-ink mt-0.5">{reviewItem.title}</p>{savedDecision.correctedValue && <p className="text-xs text-muted mt-1">Valor corrigido: <span className="text-ink">{savedDecision.correctedValue}</span></p>}</div><span className="inline-flex items-center gap-1.5 shrink-0 text-xs font-medium text-brand-dark"><Icon size={14} />{ACTION_LABELS[savedDecision.action]}</span></div>;
                })}
              </Card>
              <div className="flex flex-wrap justify-end gap-2 mt-5">
                <button onClick={() => { setShowSummary(false); goTo(0); }} className="focus-ring text-sm font-medium text-ink border border-line px-4 py-2 rounded-md hover:bg-ink/5">Voltar e revisar</button>
                <button onClick={finishReview} className="focus-ring text-sm font-medium text-white bg-brand hover:bg-brand-dark px-4 py-2 rounded-md shadow-card">Concluir revisão</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
