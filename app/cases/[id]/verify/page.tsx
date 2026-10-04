"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCaseStore } from "@/lib/store";
import AppShell from "@/components/AppShell";
import CaseHeader from "@/components/CaseHeader";
import { Card } from "@/components/ui";
import { ShieldCheck, CheckCircle2, FileText, ScanSearch, UserCheck2, Fingerprint, Download, AlertCircle } from "lucide-react";
import { DEMO_CASE_ID } from "@/lib/mockData";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
}

function truncateMiddle(value: string, head = 8, tail = 6) {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export default function VerifyPage() {
  const params = useParams<{ id: string }>();
  const { getCase } = useCaseStore();
  const clinicalCase = getCase(params.id);

  if (!clinicalCase) {
    return (
      <AppShell>
        <main className="flex-1 flex items-center justify-center text-muted text-sm">Caso não encontrado.</main>
      </AppShell>
    );
  }

  const attestation = clinicalCase.attestation;
  const documentStored = clinicalCase.id === DEMO_CASE_ID || (
    clinicalCase.documents.length > 0 && clinicalCase.documents.every((document) => document.fileStored === true)
  );

  const checks = [
    { icon: FileText, label: "Documento", status: documentStored ? "VERIFIED" : "NOT STORED", verified: documentStored },
    { icon: ScanSearch, label: "Análise", status: "VERIFIED", verified: true },
    { icon: UserCheck2, label: "Revisão profissional", status: "CONFIRMED", verified: true },
    { icon: Fingerprint, label: "Integridade", status: "VERIFIED", verified: true },
  ];

  return (
    <AppShell>
      <main className="flex-1 bg-paper flex flex-col">
        <CaseHeader clinicalCase={clinicalCase} subtitle="Validação do registro" />

        {!attestation ? (
          <div className="max-w-xl mx-auto w-full px-6 py-16 text-center text-sm text-muted">
            Este caso ainda não possui atestação registrada.{" "}
            <Link href={`/cases/${clinicalCase.id}/professional-review`} className="text-brand-dark hover:underline">
              Concluir revisão profissional
            </Link>
          </div>
        ) : (
          <div className="max-w-xl mx-auto w-full px-6 py-8">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-brand-dark" />
                <span className="text-sm font-semibold text-ink tracking-wide">CliniVerify VERIFICATION</span>
              </div>
              <button
                onClick={() => window.print()}
                className="focus-ring inline-flex items-center gap-1.5 text-xs font-medium text-ink border border-line px-3 py-1.5 rounded-md hover:bg-ink/5 transition-colors"
              >
                <Download size={13} />
                Salvar comprovante (PDF)
              </button>
            </div>

            <Card className="px-6 py-6 border-success/25 bg-success-light/40 mb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-success text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="text-base font-semibold text-success-dark">ATTESTED</div>
                  <p className="text-sm text-ink/80">
                     Esta revisão foi registrada e sua integridade foi atestada on-chain.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="divide-y divide-line mb-5">
              {checks.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} className="text-muted" />
                      <span className="text-sm text-ink">{c.label}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${c.verified ? "text-success-dark" : "text-muted"}`}>
                      {c.verified ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                      {c.status}
                    </span>
                  </div>
                );
              })}
            </Card>

            {!documentStored && (
              <p className="text-xs text-muted mt-3">
                O arquivo original enviado pelo usuário não está armazenado; a visualização do documento não está disponível.
              </p>
            )}

            <Card className="px-5 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted mb-0.5">Blockchain</div>
                  <div className="text-ink font-medium">{attestation.network}</div>
                </div>
                <div>
                  <div className="text-xs text-muted mb-0.5">Transaction</div>
                  <div className="text-ink font-mono">{truncateMiddle(attestation.transactionId)}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted mb-0.5">Concluído em</div>
                  <div className="text-ink">{formatDateTime(attestation.completedAt)}</div>
                </div>
              </div>
            </Card>

            <p className="text-xs text-muted mt-6 leading-relaxed text-center">
              Verificação simulada para fins de demonstração — não consulta a rede Solana real.
            </p>
          </div>
        )}
      </main>
    </AppShell>
  );
}
