"use client";

import Link from "next/link";
import { useCaseStore } from "@/lib/store";
import { StatusPill, MetricCard } from "@/components/ui";
import AppShell from "@/components/AppShell";
import { FolderOpen, ListChecks, ShieldCheck, AlertTriangle, Plus, FileText, FlaskConical } from "lucide-react";
import { DEMO_CASE_ID } from "@/lib/mockData";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
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

  const totalDocs = cases.reduce((n, c) => n + c.documents.length, 0);
  const totalFindings = cases.reduce((n, c) => n + c.findings.length, 0);
  const attested = cases.filter((c) => c.status === "revisao_concluida").length;
  const pending = cases.filter((c) => c.status === "revisao_pendente").length;

  return (
    <AppShell>
      <main className="flex-1 bg-paper">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
              <p className="text-sm text-muted mt-1">Visão geral dos seus casos de revisão clínica.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={loadDemoCase}
                disabled={cases.some((c) => c.id === DEMO_CASE_ID)}
                className="focus-ring inline-flex items-center gap-2 border border-line bg-panel hover:bg-brand-light/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-ink text-sm font-medium px-4 py-2.5 rounded-md"
              >
                <FlaskConical size={16} />
                Carregar caso demonstrativo
              </button>
              <Link
                href="/cases/new"
                className="focus-ring inline-flex items-center gap-2 bg-brand hover:bg-brand-dark transition-colors text-white text-sm font-medium px-4 py-2.5 rounded-md shadow-card"
              >
                <Plus size={16} />
                Novo caso
              </Link>
            </div>
          </div>

          <p className="text-xs text-muted -mt-3 mb-6">
            O caso demonstrativo contém dados fictícios/sintéticos e só será adicionado quando você escolher carregá-lo.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <MetricCard icon={FolderOpen} label="Casos" value={cases.length} tone="neutral" />
            <MetricCard icon={ListChecks} label="Achados" value={totalFindings} tone="neutral" />
            <MetricCard icon={ShieldCheck} label="Attested" value={attested} tone="success" />
            <MetricCard icon={AlertTriangle} label="Revisão pendente" value={pending} tone="amber" />
          </div>

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink">Casos recentes</h2>
            <span className="text-xs text-brand-dark">{cases.length} no total</span>
          </div>

          {cases.length === 0 ? (
            <div className="border border-dashed border-line rounded-lg py-16 text-center text-muted">
              Nenhum caso criado ainda.
            </div>
          ) : (
            <div className="border border-line rounded-lg overflow-hidden bg-panel shadow-card">
              <div className="grid grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr_0.7fr_1fr_auto] gap-3 px-5 py-2.5 bg-ink/[0.03] text-xs text-muted font-medium border-b border-line">
                <span>Caso</span>
                <span className="text-right">Docs.</span>
                <span className="text-right">Achados</span>
                <span className="text-right">Conflitos</span>
                <span className="text-right">Lacunas</span>
                <span className="text-right">Status</span>
                <span className="text-right">Ações</span>
              </div>
              {cases.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr_0.7fr_1fr_auto] gap-3 items-center px-5 py-4 border-b border-line last:border-b-0 hover:bg-brand-light/30 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-xs text-muted">{c.reference}</span>
                    <p className="text-sm text-ink font-medium truncate mt-0.5">{c.subjectLabel}</p>
                  </div>
                  <span className="text-right text-sm text-ink/80 flex items-center justify-end gap-1.5">
                    <FileText size={13} className="text-muted" />
                    {c.documents.length}
                  </span>
                  <span className="text-right text-sm text-ink/80">{c.findings.length}</span>
                  <span className="text-right text-sm text-ink/80">{c.conflicts.length}</span>
                  <span className="text-right text-sm text-ink/80">{c.gaps.length}</span>
                  <span className="flex justify-end">
                    <StatusPill status={c.status} />
                  </span>
                  <Link
                    href={`/cases/${c.id}/${STATUS_TARGET[c.status] ?? "upload"}`}
                    className="focus-ring text-right text-xs font-medium text-brand-dark hover:underline"
                  >
                    Abrir
                  </Link>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted mt-6">{totalDocs} documentos analisados nesta demonstração — todos fictícios.</p>
        </div>
      </main>
    </AppShell>
  );
}
