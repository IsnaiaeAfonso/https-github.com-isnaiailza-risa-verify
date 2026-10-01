"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCaseStore } from "@/lib/store";
import AppShell from "@/components/AppShell";
import CaseHeader from "@/components/CaseHeader";
import { Card } from "@/components/ui";
import { CheckCircle2, Copy, ArrowRight } from "lucide-react";

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
                "Revisão profissional confirmada",
                "Integridade da revisão calculada",
                "Attestation registrada na blockchain",
              ].map((line) => (
                <div key={line} className="flex items-center gap-2 text-sm text-ink/85">
                  <CheckCircle2 size={15} className="text-success-dark shrink-0" />
                  {line}
                </div>
              ))}
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 text-left">
              <div className="rounded-md border border-line bg-paper px-4 py-3">
                <div className="text-xs text-muted mb-1">Blockchain</div>
                <div className="text-sm text-ink font-medium">{attestation.network}</div>
              </div>
              <div className="rounded-md border border-line bg-paper px-4 py-3">
                <div className="text-xs text-muted mb-1">Transaction</div>
                <div className="text-sm text-ink font-mono truncate">{truncateMiddle(attestation.transactionId)}</div>
              </div>
            </div>

            <div className="mt-3 space-y-2.5 text-left">
              <CopyField label="ID da atestação" value={attestation.attestationId} />
              <CopyField label="Hash do conteúdo" value={attestation.contentHash} />
            </div>

            <p className="text-xs text-muted mt-4">
              {attestation.reviewer} · concluído em {formatDateTime(attestation.completedAt)}
            </p>

            <div className="flex items-center justify-center gap-3 mt-7">
              <Link
                href={`/cases/${clinicalCase.id}/verify`}
                className="focus-ring inline-flex items-center gap-1.5 bg-brand hover:bg-brand-dark transition-colors text-white text-sm font-medium px-4 py-2.5 rounded-md shadow-card"
              >
                Ver verificação <ArrowRight size={14} />
              </Link>
              <Link href="/dashboard" className="text-sm text-muted hover:text-ink transition-colors">
                Voltar ao dashboard
              </Link>
            </div>
          </Card>

          <p className="text-xs text-muted mt-6 leading-relaxed text-center">
            Transação simulada para fins de demonstração — nenhum valor foi enviado à rede Solana
            Devnet real. Em produção, este passo ancoraria um hash criptográfico do conteúdo
            revisado, sem publicar dados clínicos on-chain.
          </p>
        </div>
      </main>
    </AppShell>
  );
}
