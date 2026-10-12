"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCaseStore } from "@/lib/store";
import AppShell from "@/components/AppShell";
import PopulationStats from "@/components/PopulationStats";
import { StatusPill, MetricCard, LevelPill } from "@/components/ui";
import { FolderOpen, ListChecks, ShieldCheck, AlertTriangle, Plus, FileText, ChevronRight } from "lucide-react";
import { DEMO_CASE_ID } from "@/lib/mockData";
import { createReviewSnapshot } from "@/lib/reviewSnapshot";
import type { ReviewSnapshot } from "@/lib/types";

function formatDate(raw?: string) {
  if (!raw) return "Sem data";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const STATUS_TARGET: Record<string, string> = {
  rascunho: "analyzing",
  aguardando_upload: "analyzing",
  em_analise: "analyzing",
  revisao_pendente: "review",
  revisao_concluida: "attestation",
};

export default function DashboardPage() {
  const { cases, loadDemoCase } = useCaseStore();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [demoSnapshot, setDemoSnapshot] = useState<ReviewSnapshot | null>(null);

  useEffect(() => {
    if (!cases.length) return;
    setSelectedCaseId((current) => {
      if (current && cases.some((item) => item.id === current)) return current;
      return cases[0].id;
    });
  }, [cases]);

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseId) ?? cases[0],
    [cases, selectedCaseId]
  );

  useEffect(() => {
    if (!selectedCase || selectedCase.attestation) {
      setDemoSnapshot(null);
      return;
    }

    setDemoSnapshot(null);
    let active = true;
    createReviewSnapshot(selectedCase, selectedCase.reviewDecisions ?? []).then((snapshot) => {
      if (active) setDemoSnapshot(snapshot);
    }).catch(() => {
      if (active) setDemoSnapshot(null);
    });

    return () => {
      active = false;
    };
  }, [selectedCase]);

  const totalDocs = cases.reduce((sum, item) => sum + item.documents.length, 0);
  const totalFindings = cases.reduce((sum, item) => sum + item.findings.length, 0);
  const pending = cases.filter((item) => item.status === "revisao_pendente").length;
  const inAnalysis = cases.filter((item) => item.status === "em_analise").length;
  const attested = cases.filter((item) => item.status === "revisao_concluida").length;
  const workflowHealth = cases.length === 0 ? 0 : Math.round(((attested + pending) / cases.length) * 100);

  const caseSummary = selectedCase
    ? {
        documents: selectedCase.documents.length,
        findings: selectedCase.findings.length,
        conflicts: selectedCase.conflicts.length,
        gaps: selectedCase.gaps.length,
        confidence:
          selectedCase.findings.some((finding) => finding.confidence === "alta")
            ? "alta"
            : selectedCase.findings.some((finding) => finding.confidence === "media")
              ? "media"
              : "baixa",
      }
    : { documents: 0, findings: 0, conflicts: 0, gaps: 0, confidence: "baixa" };

  const timeline = selectedCase?.timeline.slice(-4).map((event) => ({
    id: event.id,
    label: event.label,
    date: formatDate(event.date),
    status: event.label.includes("Diagnóstico") ? "Concluído" : event.label.includes("Painel") ? "Concluído" : "Pendente",
    active: true,
  })) ?? [
    { id: "upload", label: "Envio de documentos", date: "—", status: "Concluído", active: true },
    { id: "analysis", label: "Análise assistida", date: "—", status: "Pendente", active: false },
    { id: "review", label: "Revisão médica", date: "—", status: "Pendente", active: false },
    { id: "final", label: "Conclusão", date: "—", status: "—", active: false },
  ];

  return (
    <AppShell>
      <main className="flex-1 bg-paper">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-brand-dark">Painel de gestão</p>
              <h1 className="text-[28px] font-semibold tracking-tight text-ink mt-1">Painel médico</h1>
              <p className="text-sm text-muted mt-1">Casos, revisões e estatísticas populacionais</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={loadDemoCase}
                className="inline-flex items-center gap-2 border border-line bg-panel hover:bg-brand-light/40 transition-colors text-ink font-medium px-4 py-2.5 rounded-md"
              >
                <Plus size={16} />
                Carregar caso de demonstração
              </button>
              <Link
                href="/cases/new"
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark transition-colors text-white font-medium px-4 py-2.5 rounded-md shadow-card"
              >
                <Plus size={16} />
                Novo caso
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <MetricCard icon={FolderOpen} label="Casos" value={cases.length} tone="neutral" />
            <MetricCard icon={ListChecks} label="Achados" value={totalFindings} tone="neutral" />
            <MetricCard icon={ShieldCheck} label="Atestados" value={attested} tone="success" />
            <MetricCard icon={AlertTriangle} label="Pendentes" value={pending} tone="amber" />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr] mb-8">
            <div className="rounded-2xl border border-line bg-panel p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-ink">Resumo executivo</h2>
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Hoje</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-line bg-paper p-3">
                  <div className="text-[11px] uppercase tracking-[0.15em] text-muted">Casos</div>
                  <div className="mt-2 text-2xl font-semibold text-ink tabular-nums">{cases.length}</div>
                </div>
                <div className="rounded-xl border border-line bg-paper p-3">
                  <div className="text-[11px] uppercase tracking-[0.15em] text-muted">Documentos</div>
                  <div className="mt-2 text-2xl font-semibold text-ink tabular-nums">{totalDocs}</div>
                </div>
                <div className="rounded-xl border border-line bg-paper p-3">
                  <div className="text-[11px] uppercase tracking-[0.15em] text-muted">Revisão</div>
                  <div className="mt-2 text-2xl font-semibold text-ink tabular-nums">{workflowHealth}%</div>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-line bg-paper px-3 py-2.5">
                <div className="flex items-center justify-between text-xs text-muted mb-2">
                  <span>Fluxo de revisão</span>
                  <span className="font-medium text-ink">{workflowHealth}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-line overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand to-success" style={{ width: `${workflowHealth}%` }} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 text-sm text-muted">
                <span className="inline-flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full bg-amber" />{pending} pendentes</span>
                <span className="inline-flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full bg-brand" />{inAnalysis} em análise</span>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-panel p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-ink">Linha do tempo</h2>
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Eventos</span>
              </div>

              <div className="space-y-3">
                {timeline.map((event, index) => (
                  <div key={event.id} className="relative pl-5 border-l border-line pb-3 last:pb-0 last:border-l-0">
                    <span className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand" />
                    <div className="text-[11px] text-muted">{event.date}</div>
                    <div className="mt-1 text-sm font-medium text-ink">{event.label}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{event.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-panel shadow-card overflow-hidden">
            <div className="grid grid-cols-[1.3fr_1.2fr_0.7fr_0.8fr_0.8fr_0.8fr_0.9fr] gap-3 bg-paper px-5 py-3 text-[12px] font-medium text-muted border-b border-line">
              <span>ID do caso</span>
              <span>Tipo de exame</span>
              <span>Docs.</span>
              <span>Atualização</span>
              <span>Revisão</span>
              <span>Confiança</span>
              <span>Status</span>
            </div>

            {cases.length === 0 ? (
              <div className="px-5 py-10 text-center text-muted">
                Nenhum caso disponível. Carregue o caso de demonstração ou crie um novo caso.
              </div>
            ) : (
              cases.map((item) => {
                const rowConfidence = item.findings.some((finding) => finding.confidence === "alta") ? "Alta" : item.findings.some((finding) => finding.confidence === "media") ? "Média" : "Baixa";
                const reviewLabel = item.status === "revisao_concluida" ? "Revisado" : item.status === "em_analise" ? "Em análise" : "Pendente";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedCaseId(item.id)}
                    className={`grid w-full grid-cols-[1.3fr_1.2fr_0.7fr_0.8fr_0.8fr_0.8fr_0.9fr] gap-3 items-center px-5 py-4 text-left border-b border-line last:border-b-0 hover:bg-brand-light/30 transition-colors ${selectedCase?.id === item.id ? "bg-brand-light/20" : "bg-transparent"}`}
                  >
                    <span className="font-medium text-ink">{item.reference}</span>
                    <span className="text-ink/80 truncate">{item.subjectLabel}</span>
                    <span className="flex items-center gap-2 text-ink/80"><FileText size={14} className="text-muted" /> {item.documents.length}</span>
                    <span className="text-ink/80">{formatDate(item.createdAt)}</span>
                    <span className="text-ink/80">{reviewLabel}</span>
                    <span className="text-ink/80">{rowConfidence}</span>
                    <span className="flex justify-end"><ChevronRight size={16} className="text-muted" /></span>
                  </button>
                );
              })
            )}
          </div>

          <PopulationStats />

          {selectedCase && (
            <div className="mt-8 rounded-2xl border border-line bg-panel p-5 shadow-card">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-[20px] font-semibold text-ink">Caso {selectedCase.reference}</span>
                  <span className="inline-flex items-center rounded-full bg-amber-light px-2.5 py-1 text-xs font-medium text-amber border border-amber/20">
                    {selectedCase.status === "revisao_concluida" ? "Concluído" : selectedCase.status === "em_analise" ? "Em análise" : "Pendente de revisão"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <span className="font-medium text-ink">Confiança</span>
                  <LevelPill level={caseSummary.confidence as "alta" | "media" | "baixa"} meaning="confidence" />
                </div>
              </div>

              <div className="mt-2 flex items-center gap-4 text-sm text-muted flex-wrap">
                <span>{selectedCase.subjectLabel}</span>
                <span>•</span>
                <span>{selectedCase.documents.length} documentos</span>
                <span>•</span>
                <span>{formatDate(selectedCase.createdAt)}</span>
              </div>

              <div className="mt-5 flex items-center gap-3 border-b border-line pb-3">
                <button type="button" className="border-b-2 border-brand pb-2 text-sm font-semibold text-brand">Visão geral</button>
                <Link href={`/cases/${selectedCase.id}/${STATUS_TARGET[selectedCase.status] ?? "analyzing"}`} className="pb-2 text-sm text-muted hover:text-ink">
                  Abrir revisão
                </Link>
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-5">
                  <div className="rounded-2xl border border-line bg-paper p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                        <ListChecks size={16} />
                      </div>
                      <h3 className="text-lg font-semibold text-ink">Resumo para revisão</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-rust/20 bg-rust-light p-4">
                        <div className="text-[32px] font-semibold text-rust">{selectedCase.findings.length}</div>
                        <div className="mt-1 text-sm text-rust">Achados</div>
                        <div className="mt-1 text-[11px] text-rust/80">Requerem atenção</div>
                      </div>
                      <div className="rounded-xl border border-brand/20 bg-brand-light p-4">
                        <div className="text-[32px] font-semibold text-brand">{selectedCase.conflicts.length}</div>
                        <div className="mt-1 text-sm text-brand">Conflitos</div>
                        <div className="mt-1 text-[11px] text-brand/80">Comparação cruzada</div>
                      </div>
                      <div className="rounded-xl border border-amber/20 bg-amber-light p-4">
                        <div className="text-[32px] font-semibold text-amber">{selectedCase.gaps.length}</div>
                        <div className="mt-1 text-sm text-amber">Lacunas</div>
                        <div className="mt-1 text-[11px] text-amber/80">Informação incompleta</div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-line bg-panel p-3">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">Principais achados</div>
                      <div className="space-y-3">
                        {selectedCase.findings.length === 0 ? (
                          <p className="text-sm text-muted">Ainda não há achados extraídos para este caso.</p>
                        ) : (
                          selectedCase.findings.slice(0, 3).map((finding) => (
                            <div key={finding.id} className="grid grid-cols-[1.2fr_0.7fr_0.7fr] items-center gap-3 rounded-lg bg-paper px-3 py-2 text-sm">
                              <span className="font-medium text-ink">{finding.title}</span>
                              <span className="text-muted capitalize">{finding.confidence}</span>
                              <span className="flex justify-end"><LevelPill level={finding.confidence} meaning="confidence" /></span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-line bg-paper p-4">
                    <div className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink">
                      <ShieldCheck size={18} className="text-brand" />
                      Resumo clínico (IA)
                    </div>
                    <p className="text-sm leading-6 text-muted">
                      {selectedCase.findings.length
                        ? selectedCase.findings[0].summary
                        : "O sistema ainda não identificou achados nesta revisão. A análise continua em andamento."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-line bg-paper p-4">
                    <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink">Linha do tempo</div>
                    <div className="space-y-3">
                      {timeline.map((event) => (
                        <div key={event.id} className="flex items-start gap-3">
                          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-ink">{event.label}</div>
                            <div className="text-[11px] text-muted">{event.date}</div>
                          </div>
                          <span className="text-[11px] text-success-dark bg-success-light border border-success/20 px-2 py-1 rounded-full">{event.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-line bg-paper p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-lg font-semibold text-ink">Integridade e rastreabilidade</div>
                      <span className="inline-flex items-center rounded-full border border-success/20 bg-success-light px-2.5 py-1 text-[11px] font-medium text-success-dark">
                        {selectedCase.attestation ? "Atestação local" : "Prévia local · demo"}
                      </span>
                    </div>

                    <div className="space-y-3 text-sm text-muted">
                      <div className="flex items-center justify-between rounded-lg bg-panel px-3 py-2">
                        <span>Hash local (demo)</span>
                        <span className="font-mono text-ink">{(selectedCase.attestation?.contentHash ?? demoSnapshot?.contentHash)?.slice(0, 16) ?? "Calculando…"}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-panel px-3 py-2">
                        <span>Registrado em</span>
                        <span className="text-right text-ink">
                          {selectedCase.attestation?.completedAt
                            ? formatDate(selectedCase.attestation.completedAt)
                            : demoSnapshot?.createdAt
                              ? new Date(demoSnapshot.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
                              : "Calculando…"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-panel px-3 py-2">
                        <span>Integridade</span>
                        <span className="text-right text-ink">{selectedCase.attestation ? "Registrada localmente" : "Hash calculado localmente"}</span>
                      </div>
                      <div className="rounded-lg border border-line bg-panel px-3 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-ink">Próxima etapa: revisão e assinatura SAS</span>
                          <span className="text-xs font-medium text-muted">{selectedCase.attestation ? "Não publicada" : "Prévia pronta · demo"}</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {selectedCase.attestation
                            ? "Atestação registrada localmente. Nenhuma assinatura ou transação Solana foi enviada."
                            : "Hash de prévia calculado a partir deste caso para demonstração. A atestação só será registrada após revisão; publicação SAS exige signer e transação explícita."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <section aria-labelledby="solana-attestation-heading" className="mt-8 overflow-hidden rounded-2xl border border-teal/30 bg-navy-dark text-white shadow-card">
            <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_auto] lg:items-center lg:gap-6 lg:px-6 lg:py-5">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal-light">
                    <span className="h-2 w-2 rounded-full bg-teal" /> SOLANA · SAS
                  </span>
                  <h2 id="solana-attestation-heading" className="text-lg font-semibold">Demonstração do gateway SAS no fluxo RISA</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  A revisão local calcula um hash de integridade e mantém o registro de evidência vinculado ao caso. Neste modo de demonstração, o fluxo mostra como o mesmo contexto será assinado e publicado no provedor SAS; nenhuma transação real é enviada.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs text-white/55">Estado on-chain</div>
                <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" /> Conectado
                </div>
                <div className="mt-0.5 text-[11px] text-white/50">modo demonstração</div>
              </div>
              <a
                href="https://github.com/solana-foundation/solana-attestation-service"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-teal/50 px-4 py-2.5 text-sm font-medium text-teal-light hover:bg-teal/10"
              >
                Ver status do provedor
              </a>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
