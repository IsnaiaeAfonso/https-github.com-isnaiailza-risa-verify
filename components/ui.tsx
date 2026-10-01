import { CaseStatus } from "@/lib/types";
import type { LucideIcon } from "lucide-react";

type Level = "alta" | "media" | "baixa";

const levelStyles: Record<Level, string> = {
  alta: "bg-rust-light text-rust border-rust/20",
  media: "bg-amber-light text-amber border-amber/20",
  baixa: "bg-success-light text-success-dark border-success/20",
};

const levelLabel: Record<Level, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export function LevelPill({ level, label }: { level: Level; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${levelStyles[level]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? levelLabel[level]}
    </span>
  );
}

const statusMeta: Record<CaseStatus, { label: string; className: string }> = {
  rascunho: { label: "Rascunho", className: "bg-ink/5 text-muted border-ink/10" },
  aguardando_upload: { label: "Aguardando documentos", className: "bg-ink/5 text-muted border-ink/10" },
  em_analise: { label: "Em análise", className: "bg-amber-light text-amber border-amber/20" },
  revisao_pendente: { label: "Revisão pendente", className: "bg-amber-light text-amber border-amber/20" },
  revisao_concluida: { label: "Attested", className: "bg-success-light text-success-dark border-success/20" },
};

export function StatusPill({ status }: { status: CaseStatus }) {
  const meta = statusMeta[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-panel border border-line rounded-lg shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function StatBlock({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-3xl font-semibold text-ink tabular-nums">{value}</span>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </div>
  );
}

const metricTone = {
  neutral: "bg-brand-light text-brand-dark",
  success: "bg-success-light text-success-dark",
  amber: "bg-amber-light text-amber",
  rust: "bg-rust-light text-rust",
};

export function MetricCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: keyof typeof metricTone;
}) {
  return (
    <Card className="px-5 py-4 flex items-center gap-3.5">
      <div className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 ${metricTone[tone]}`}>
        <Icon size={17} />
      </div>
      <div>
        <div className="text-2xl font-semibold text-ink leading-none tabular-nums">{value}</div>
        <div className="text-xs text-muted mt-1">{label}</div>
      </div>
    </Card>
  );
}

export function EvidenceQuote({
  docName,
  page,
  excerpt,
}: {
  docName: string;
  page: number;
  excerpt: string;
}) {
  return (
    <div className="rounded-md border border-line bg-paper px-3 py-2.5">
      <div className="flex items-center justify-between text-xs text-muted mb-1.5 font-mono">
        <span className="truncate pr-2">{docName}</span>
        <span className="shrink-0">pág. {page}</span>
      </div>
      <p className="text-sm text-ink/90 leading-relaxed">&ldquo;{excerpt}&rdquo;</p>
    </div>
  );
}
