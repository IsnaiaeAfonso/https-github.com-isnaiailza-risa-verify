"use client";

import { Conflict } from "@/lib/types";
import { LevelPill } from "./ui";
import { X, AlertTriangle, Info } from "lucide-react";
import Link from "next/link";

export default function ConflictModal({
  conflict,
  onClose,
  reviewHref,
}: {
  conflict: Conflict | null;
  onClose: () => void;
  reviewHref: string;
}) {
  if (!conflict) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Fechar painel de conflito"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]"
      />
      <div className="relative w-full max-w-2xl bg-panel border border-line rounded-xl shadow-xl">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-line">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-amber shrink-0 mt-0.5" />
            <div>
              <span className="text-xs uppercase tracking-wide text-muted">Conflito detectado</span>
              <h2 className="text-base font-semibold text-ink mt-0.5 leading-snug">{conflict.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="focus-ring rounded-md p-1.5 text-muted hover:text-ink hover:bg-ink/5 transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid md:grid-cols-[1fr_auto_1fr] items-stretch gap-3">
            <div className="rounded-md border border-brand/30 bg-brand-light/30 px-4 py-4">
              <div className="text-xs font-semibold tracking-wide text-muted mb-2">FONTE A</div>
              <div className="text-sm font-medium text-ink break-words">{conflict.sourceA.docName}</div>
              <div className="text-xs text-muted mt-1 mb-3">Página {conflict.sourceA.page}</div>
              <p className="text-sm text-ink leading-relaxed">“{conflict.sourceA.excerpt}”</p>
            </div>
            <div className="flex items-center justify-center text-xs font-bold tracking-widest text-rust">VS</div>
            <div className="rounded-md border border-rust/30 bg-rust-light/40 px-4 py-4">
              <div className="text-xs font-semibold tracking-wide text-muted mb-2">FONTE B</div>
              <div className="text-sm font-medium text-ink break-words">{conflict.sourceB.docName}</div>
              <div className="text-xs text-muted mt-1 mb-3">Página {conflict.sourceB.page}</div>
              <p className="text-sm text-ink leading-relaxed">“{conflict.sourceB.excerpt}”</p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-md bg-ink/[0.03] px-3.5 py-3">
            <Info size={14} className="text-muted shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-medium text-ink">Observações</span>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">{conflict.description}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <LevelPill level={conflict.severity} label={`Severidade ${conflict.severity === "alta" ? "alta" : conflict.severity === "media" ? "média" : "baixa"}`} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-line flex justify-end gap-2">
          <Link href={reviewHref} className="focus-ring text-sm font-medium text-white bg-brand hover:bg-brand-dark px-4 py-2 rounded-md">Revisar conflito</Link>
          <button
            onClick={onClose}
            className="focus-ring text-sm font-medium text-ink border border-line px-4 py-2 rounded-md hover:bg-ink/5 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
