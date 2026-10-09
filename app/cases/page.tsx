"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useCaseStore } from "@/lib/store";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  FileText,
  FolderOpen,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

interface UploadedDocument {
  id: string;
  caseId: string;
  doctorName: string;
  fileName: string;
  size: number;
  sha256: string;
  storageProvider: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  aguardando_upload: "Aguardando upload",
  em_analise: "Em análise",
  revisao_pendente: "Revisão pendente",
  revisao_concluida: "Revisão concluída",
};

const STATUS_TARGET: Record<string, string> = {
  rascunho: "analyzing",
  aguardando_upload: "analyzing",
  em_analise: "analyzing",
  revisao_pendente: "review",
  revisao_concluida: "attestation",
};

export default function CasesPage() {
  const { cases } = useCaseStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("todos");
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [documentsError, setDocumentsError] = useState("");

  async function refreshUploadedDocuments() {
    try {
      const response = await fetch("/api/doctor-documents", { cache: "no-store" });
      if (!response.ok) throw new Error("Não foi possível consultar os PDFs enviados.");
      const payload = await response.json() as { documents?: UploadedDocument[] };
      setUploadedDocuments(payload.documents ?? []);
      setDocumentsError("");
    } catch (error) {
      setDocumentsError(error instanceof Error ? error.message : "Não foi possível consultar os PDFs enviados.");
    }
  }

  useEffect(() => {
    void refreshUploadedDocuments();
    const intervalId = window.setInterval(() => void refreshUploadedDocuments(), 10000);
    return () => window.clearInterval(intervalId);
  }, []);

  const filteredCases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return cases.filter((clinicalCase) => {
      const matchesStatus = status === "todos" || clinicalCase.status === status;
      const matchesQuery =
        !normalizedQuery ||
        clinicalCase.reference.toLowerCase().includes(normalizedQuery) ||
        clinicalCase.subjectLabel.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [cases, query, status]);

  return (
    <AppShell>
      <main className="flex-1 bg-paper">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-semibold tracking-tight text-ink">
                Meus casos
              </h1>
              <p className="text-sm text-muted mt-1">
                Lista de casos, documentos e etapas da revisão.
              </p>
            </div>
            <Link
              href="/cases/new"
              className="inline-flex items-center gap-2 bg-brand px-4 py-2.5 rounded-md text-sm font-medium text-white shadow-card hover:bg-brand-dark"
            >
              <FileCheck2 size={16} /> Novo caso
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-line bg-panel p-4 shadow-card">
              <div className="flex items-center gap-2 text-muted text-xs">
                <FolderOpen size={15} /> Casos
              </div>
              <div className="mt-2 text-2xl font-semibold text-ink">{cases.length}</div>
            </div>
            <div className="rounded-2xl border border-line bg-panel p-4 shadow-card">
              <div className="flex items-center gap-2 text-muted text-xs">
                <FileText size={15} /> Documentos
              </div>
              <div className="mt-2 text-2xl font-semibold text-ink">
                {cases.reduce((total, clinicalCase) => total + clinicalCase.documents.length, 0)}
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-panel p-4 shadow-card">
              <div className="flex items-center gap-2 text-muted text-xs">
                <AlertTriangle size={15} /> Conflitos
              </div>
              <div className="mt-2 text-2xl font-semibold text-ink">
                {cases.reduce((total, clinicalCase) => total + clinicalCase.conflicts.length, 0)}
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-panel p-4 shadow-card">
              <div className="flex items-center gap-2 text-muted text-xs">
                <ShieldCheck size={15} /> Revisões
              </div>
              <div className="mt-2 text-2xl font-semibold text-ink">
                {cases.filter((clinicalCase) => clinicalCase.status === "revisao_concluida").length}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-line bg-panel p-4 shadow-card md:flex-row md:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-paper px-3 py-2.5">
              <Search size={16} className="text-muted shrink-0" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar caso ou referência"
                className="focus-ring min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted/60"
              />
            </div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="focus-ring rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none"
            >
              <option value="todos">Todos os estágios</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="mt-6 space-y-3">
            {filteredCases.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-panel px-6 py-14 text-center">
                <FolderOpen className="mx-auto text-muted" size={26} />
                <h2 className="mt-3 text-sm font-semibold text-ink">
                  Nenhum caso corresponde à busca e aos filtros.
                </h2>
                <p className="text-sm text-muted mt-1">
                  Crie um novo caso ou ajuste os filtros acima.
                </p>
              </div>
            ) : (
              filteredCases.map((clinicalCase) => (
                <article
                  key={clinicalCase.id}
                  className="grid gap-4 rounded-2xl border border-line bg-panel p-5 shadow-card md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-brand">
                        {clinicalCase.reference}
                      </span>
                      <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] text-muted border border-line">
                        {STATUS_LABELS[clinicalCase.status] ?? clinicalCase.status}
                      </span>
                    </div>
                    <h2 className="mt-2 text-base font-semibold text-ink truncate">
                      {clinicalCase.subjectLabel}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <FileText size={13} /> {clinicalCase.documents.length} documentos
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 size={13} /> {clinicalCase.findings.length} achados
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle size={13} /> {clinicalCase.conflicts.length} conflitos
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/cases/${clinicalCase.id}/${STATUS_TARGET[clinicalCase.status] ?? "analyzing"}`}
                    className="inline-flex items-center justify-center gap-2 border border-line bg-paper px-4 py-2.5 rounded-md text-sm font-medium text-ink hover:border-brand/50 hover:text-brand"
                  >
                    Abrir caso <ArrowRight size={15} />
                  </Link>
                </article>
              ))
            )}
          </div>

          <section className="mt-10 border-t border-line pt-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">PDFs recebidos de pacientes</h2>
                <p className="mt-1 text-sm text-muted">Arquivos armazenados após o envio pelo paciente.</p>
              </div>
              <button
                type="button"
                onClick={() => void refreshUploadedDocuments()}
                className="inline-flex items-center gap-2 rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink hover:border-brand/50"
              >
                <RefreshCw size={15} /> Atualizar
              </button>
            </div>
            <p className="mt-3 rounded-md border border-amber/30 bg-amber/10 px-3 py-2 text-xs leading-5 text-amber">
              Ambiente de demonstração. Use apenas PDFs sintéticos; não envie documentos clínicos nem dados pessoais reais.
            </p>
            {documentsError ? (
              <p className="mt-4 text-sm text-rust">{documentsError}</p>
            ) : uploadedDocuments.length === 0 ? (
              <p className="mt-4 rounded-md border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                Nenhum PDF recebido ainda. Novos envios aparecem aqui automaticamente.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-line border-y border-line">
                {uploadedDocuments.map((document) => (
                  <article key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <FileText size={18} className="mt-0.5 shrink-0 text-brand-dark" />
                      <div className="min-w-0">
                        <h3 className="break-all text-sm font-medium text-ink">{document.fileName}</h3>
                        <p className="mt-1 text-xs text-muted">
                          Caso {document.caseId} · {document.doctorName} · {(document.size / (1024 * 1024)).toFixed(1)} MB · {new Date(document.createdAt).toLocaleString("pt-BR")}
                        </p>
                        <p className="mt-1 break-all font-mono text-[11px] text-muted">SHA-256: {document.sha256}</p>
                      </div>
                    </div>
                    <a
                      href={`/api/doctor-documents/${encodeURIComponent(document.id)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-2 rounded-md border border-line bg-paper px-3 py-2 text-sm font-medium text-ink hover:border-brand/50"
                    >
                      <FileText size={14} /> Abrir PDF
                    </a>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
