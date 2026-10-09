"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCaseStore } from "@/lib/store";
import AppShell from "@/components/AppShell";
import CaseHeader from "@/components/CaseHeader";
import { Card } from "@/components/ui";
import { AlertCircle, CheckCircle2, Clipboard, Download, FileText, Fingerprint, ScanSearch, ShieldCheck, UserCheck2 } from "lucide-react";
import { verifyReviewSnapshot } from "@/lib/reviewSnapshot";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-md border border-line bg-paper px-4 py-3">
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="flex items-start gap-2">
        <span className="min-w-0 break-all text-xs font-mono text-ink">{value}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(value).catch(() => {});
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
          className="focus-ring shrink-0 text-muted hover:text-brand-dark p-1 rounded"
          aria-label={`Copiar ${label}`}
        >
          <Clipboard size={14} />
        </button>
        {copied && <span className="text-xs text-brand-dark shrink-0">copiado</span>}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const params = useParams<{ id: string }>();
  const { getCase } = useCaseStore();
  const clinicalCase = getCase(params.id);
  const [snapshotValid, setSnapshotValid] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!clinicalCase?.reviewSnapshot) {
      setSnapshotValid(false);
      return () => { cancelled = true; };
    }
    verifyReviewSnapshot(clinicalCase).then((valid) => {
      if (!cancelled) setSnapshotValid(valid);
    }).catch(() => {
      if (!cancelled) setSnapshotValid(false);
    });
    return () => { cancelled = true; };
  }, [clinicalCase]);

  if (!clinicalCase) {
    return <AppShell><main className="flex-1 flex items-center justify-center text-muted text-sm">Caso não encontrado.</main></AppShell>;
  }

  const snapshot = clinicalCase.reviewSnapshot;
  const documentStored = clinicalCase.documents.length > 0
    && clinicalCase.documents.every((document) => document.fileStored === true);
  const checks = [
    { icon: FileText, label: "Documentos incluídos", value: snapshot ? `${snapshot.documentHashes.length} arquivos no registro` : "Sem registro", ok: Boolean(snapshot) },
    { icon: ScanSearch, label: "Análise documental", value: snapshot ? `Hash ${snapshot.analysisHash.slice(0, 12)}…` : "Sem registro", ok: Boolean(snapshot) },
    { icon: UserCheck2, label: "Decisões profissionais", value: clinicalCase.reviewDecisions?.length ? `${clinicalCase.reviewDecisions.length} decisões registradas` : "Nenhuma decisão", ok: Boolean(clinicalCase.reviewDecisions?.length) },
    { icon: Fingerprint, label: "Integridade local", value: snapshotValid === null ? "Verificando…" : snapshotValid ? "Integridade confirmada" : "Não foi possível confirmar", ok: snapshotValid === true },
  ];

  return (
    <AppShell>
      <main className="flex-1 bg-paper flex flex-col">
        <CaseHeader clinicalCase={clinicalCase} subtitle="Conferência local da revisão" />
        {!clinicalCase.attestation || !snapshot ? (
          <div className="max-w-xl mx-auto w-full px-6 py-16 text-center text-sm text-muted">
            Esta revisão ainda não tem snapshot reproduzível. {" "}
            <Link href={`/cases/${clinicalCase.id}/professional-review`} className="text-brand-dark hover:underline">Concluir revisão profissional</Link>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-brand-dark" />
                <span className="text-sm font-semibold tracking-wide text-ink">RISA VERIFY · REGISTRO LOCAL</span>
              </div>
              <button type="button" onClick={() => window.print()} className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-ink/5">
                <Download size={13} /> Salvar comprovante (PDF)
              </button>
            </div>

            <Card className={`mb-5 px-5 py-5 ${snapshotValid ? "border-success/25 bg-success-light/40" : "border-amber/30 bg-amber-light/40"}`}>
              <div className="flex items-start gap-3">
                {snapshotValid ? <CheckCircle2 size={21} className="mt-0.5 shrink-0 text-success-dark" /> : <AlertCircle size={21} className="mt-0.5 shrink-0 text-amber" />}
                <div>
                    <h2 className={`text-base font-semibold ${snapshotValid ? "text-success-dark" : "text-amber"}`}>
                    {snapshotValid === null ? "Conferindo o registro" : snapshotValid ? "Integridade local confirmada" : "Registro divergente ou incompleto"}
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-ink/80">Hash recalculado neste navegador com base nos documentos, na análise e nas decisões salvas.</p>
                </div>
              </div>
            </Card>

            <Card className="mb-5 divide-y divide-line">
              {checks.map((check) => {
                const Icon = check.icon;
                return (
                  <div key={check.label} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div className="flex items-center gap-2.5"><Icon size={15} className="text-muted" /><span className="text-sm text-ink">{check.label}</span></div>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${check.ok ? "text-success-dark" : "text-muted"}`}>{check.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}{check.value}</span>
                  </div>
                );
              })}
            </Card>

            {!documentStored && <p className="mb-4 text-xs text-muted">Nem todos os PDFs originais estão no armazenamento atual. Para documentos sem hash do arquivo original, o registro usa o texto extraído e os metadados; confira o escopo abaixo.</p>}

            <Card className="space-y-3 px-4 py-4 sm:px-5">
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div><div className="text-xs text-muted mb-0.5">Versão do registro</div><div className="font-mono text-ink">{snapshot.version}</div></div>
                <div><div className="text-xs text-muted mb-0.5">Revisor</div><div className="text-ink">{snapshot.reviewer}</div></div>
                <div className="sm:col-span-2"><div className="text-xs text-muted mb-0.5">Criado em</div><div className="text-ink">{formatDateTime(snapshot.createdAt)}</div></div>
              </div>
              <CopyField label="Hash do registro local" value={snapshot.contentHash} />
              <CopyField label="Hash da análise" value={snapshot.analysisHash} />
              <CopyField label="Hash das decisões" value={snapshot.decisionsHash} />
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Escopo dos documentos</p>
                <div className="space-y-2">
                  {snapshot.documentHashes.map((document) => (
                    <div key={document.documentId} className="flex flex-wrap items-baseline justify-between gap-2 rounded-md bg-paper px-3 py-2 text-xs">
                      <span className="min-w-0 break-all text-ink">{document.documentName}</span>
                      <span className="shrink-0 text-muted">{document.hashScope === "original-pdf" ? "PDF original" : "Texto extraído e metadados"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <p className="mt-5 text-center text-xs leading-5 text-muted">Registro armazenado neste navegador. Não é uma assinatura digital independente nem uma transação Solana. Outros dispositivos não conseguem verificar este registro até que exista um servidor compartilhado.</p>
          </div>
        )}
      </main>
    </AppShell>
  );
}
