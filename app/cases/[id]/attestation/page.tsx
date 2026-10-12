"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCaseStore } from "@/lib/store";
import AppShell from "@/components/AppShell";
import CaseHeader from "@/components/CaseHeader";
import { Card } from "@/components/ui";
import { CheckCircle2, Copy, ArrowRight, Fingerprint } from "lucide-react";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
}

function truncateMiddle(value: string, head = 6, tail = 4) {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-md border border-line bg-paper px-4 py-3">
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-ink truncate">{truncateMiddle(value, 8, 6)}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(value).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className="focus-ring shrink-0 text-muted hover:text-brand-dark p-1 rounded"
          aria-label={`Copiar ${label}`}
        >
          <Copy size={13} />
        </button>
        {copied && <span className="text-xs text-brand-dark shrink-0">copiado</span>}
      </div>
    </div>
  );
}

export default function AttestationPage() {
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

  if (!attestation) {
    return (
      <AppShell>
        <main className="flex-1 bg-paper flex flex-col">
          <CaseHeader clinicalCase={clinicalCase} subtitle="Conclusão da revisão" />
          <div className="max-w-xl mx-auto w-full px-6 py-16 text-center text-sm text-muted">
            Este caso ainda não possui uma atestação registrada.{" "}
            <Link href={`/cases/${clinicalCase.id}/professional-review`} className="text-brand-dark hover:underline">
              Concluir revisão profissional
            </Link>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex-1 bg-paper flex flex-col">
        <CaseHeader clinicalCase={clinicalCase} subtitle="Conclusão da revisão" />
        <div className="max-w-xl mx-auto w-full px-6 py-10">
          <Card className="px-8 py-8 text-center">
            <div className="h-14 w-14 rounded-full bg-success-light flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-success-dark" />
            </div>
            <h2 className="text-xl font-semibold text-ink">Revisão concluída</h2>
            <p className="text-sm text-muted mt-1.5 max-w-sm mx-auto">
              A análise foi revisada e confirmada com sucesso.
            </p>

            <div className="mt-6 space-y-2 text-left max-w-xs mx-auto">
              {[
                "Revisão profissional registrada",
                "Registro da revisão calculado neste navegador",
                "Nenhuma transação Solana foi enviada",
              ].map((line) => (
                <div key={line} className="flex items-center gap-2 text-sm text-ink/85">
                  {line.includes("Nenhuma") ? <Fingerprint size={15} className="text-muted shrink-0" /> : <CheckCircle2 size={15} className="text-success-dark shrink-0" />}
                  {line}
                </div>
              ))}
            </div>

            <div className="mt-7 space-y-2.5 text-left">
              <CopyField label="ID da atestação" value={attestation.attestationId} />
              <CopyField label="Hash do snapshot local" value={attestation.contentHash} />
            </div>

            <p className="text-xs text-muted mt-4">
              {attestation.reviewer} · concluída em {formatDateTime(attestation.completedAt)}
            </p>

            <div className="flex items-center justify-center gap-3 mt-7">
              <Link
                href={`/cases/${clinicalCase.id}/verify`}
                className="focus-ring inline-flex items-center gap-1.5 bg-brand hover:bg-brand-dark transition-colors text-white text-sm font-medium px-4 py-2.5 rounded-md shadow-card"
              >
                Verificar integridade <ArrowRight size={14} />
              </Link>
              <Link href="/dashboard" className="text-sm text-muted hover:text-ink transition-colors">
                Voltar ao painel médico
              </Link>
            </div>
          </Card>

          <p className="text-xs text-muted mt-6 leading-relaxed text-center">
            Este hash foi calculado neste navegador a partir do registro da revisão. Ele não foi publicado nem confirmado na Solana; a revisão e os documentos permanecem neste navegador.
          </p>

          <section className="mt-6 rounded-xl border border-teal/30 bg-navy-dark p-4 text-left text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-teal-light">Solana · Attestation Service (SAS)</h3>
              <span className="rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-medium text-success-light">Conexão ativa · modo demonstração</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-white/70">
              A conexão com Solana é simulada para demonstrar o fluxo previsto do MVP. Nenhuma assinatura, atestação SAS ou transação foi criada; o hash permanece local. PDFs e dados clínicos não são enviados à blockchain.
            </p>
            <a href="https://github.com/solana-foundation/solana-attestation-service" target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-medium text-teal-light underline underline-offset-2">
              Documentação oficial do SAS
            </a>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
