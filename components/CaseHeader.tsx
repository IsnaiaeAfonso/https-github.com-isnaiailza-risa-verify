import Link from "next/link";
import { ClinicalCase } from "@/lib/types";
import { StatusPill } from "./ui";

export default function CaseHeader({
  clinicalCase,
  subtitle,
  action,
}: {
  clinicalCase: ClinicalCase;
  subtitle?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap px-6 pt-6 pb-4 border-b border-line bg-panel">
      <div>
        <Link href="/dashboard" className="text-xs text-muted hover:text-brand transition-colors">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-3 mt-1.5">
          <h1 className="text-lg font-semibold text-ink">{clinicalCase.reference}</h1>
          <StatusPill status={clinicalCase.status} />
        </div>
        {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="focus-ring inline-flex items-center gap-1.5 text-sm font-medium text-white bg-brand hover:bg-brand-dark transition-colors px-4 py-2 rounded-md shadow-card"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
