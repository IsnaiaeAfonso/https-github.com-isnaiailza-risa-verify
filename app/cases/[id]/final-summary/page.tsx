"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCaseStore } from "@/lib/store";
import AppShell from "@/components/AppShell";
import CaseHeader from "@/components/CaseHeader";
import { Card, EvidenceQuote, LevelPill } from "@/components/ui";
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  FileText,
  Fingerprint,
  Info,
  ShieldCheck,
} from "lucide-react";

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof FileText;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-md bg-brand-light flex items-center justify-center text-brand">
        <Icon size={15} />
      </div>
      <div>
        <div className="text-lg font-semibold text-ink">{value}</div>
        <div className="text-[11px] text-muted">{label}</div>
      </div>
    </div>
  );
}

export default function FinalSummaryPage() {
  const params = useParams<{ id: string }>();
  const { getCase } = useCaseStore();
  const clinicalCase = getCase(params.id);

  if (!clinicalCase) {
    return (
      <AppShell>
        <main className="flex-1 flex items-center justify-center text-muted text-sm">
          Caso não encontrado.
        </main>
      </AppShell>
    );
  }

  const findings = clinicalCase.findings;
  const conflicts = clinicalCase.conflicts;
  const gaps = clinicalCase.gaps;
  const evidenceCount =
    findings.reduce((total, finding) => total + finding.evidence.length, 0) +
    conflicts.length * 2;

  return (
    <AppShell>
      <main className="flex-1 bg-paper flex flex-col">
        <CaseHeader
          clinicalCase={clinicalCase}
          subtitle="Resumo documental — sem substituição da decisão profissional"
        />
        <div className="max-w-5xl mx-auto w-full px-6 py-8 flex-1">
          <Card className="border-brand/20 bg-brand-light/30 px-5 py-5">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-brand-dark shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Resumo final para revisão humana
                </h2>
                <p className="text-sm leading-6 text-muted mt-1">
                  Este resumo organiza achados, evidências, conflitos e lacunas.
                  Ele não conclui o caso, não diagnostica, não prescreve e não
                  substitui o julgamento clínico do profissional.
                </p>
              </div>
            </div>
          </Card>

          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="px-4 py-4">
              <Stat label="Achados" value={findings.length} icon={FileText} />
            </Card>
            <Card className="px-4 py-4">
              <Stat
                label="Conflitos"
                value={conflicts.length}
                icon={AlertTriangle}
              />
            </Card>
            <Card className="px-4 py-4">
              <Stat label="Lacunas" value={gaps.length} icon={FileCheck2} />
            </Card>
            <Card className="px-4 py-4">
              <Stat
                label="Evidências"
                value={evidenceCount}
                icon={Fingerprint}
              />
            </Card>
          </div>

          <section className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-brand-dark" />
              <h2 className="text-base font-semibold text-ink">
                Resultado documentado
              </h2>
            </div>
            <Card className="p-5">
              <p className="text-sm leading-7 text-ink">
                {findings.length > 0
                  ? `O conjunto analisado contém ${findings.length} achado${findings.length === 1 ? "" : "s"} e ${evidenceCount} evidência${evidenceCount === 1 ? "" : "s"} vinculada${evidenceCount === 1 ? "" : "s"} aos documentos enviados. ${conflicts.length > 0 ? `Foram identificados ${conflicts.length} conflito${conflicts.length === 1 ? "" : "s"} entre as fontes.` : "Nenhum conflito foi identificado entre as fontes."} ${gaps.length > 0 ? "Lacunas relevantes foram registradas para avaliação profissional." : "Nenhuma lacuna relevante foi registrada."}`
                  : "Nenhum achado clínico foi identificado no conjunto de documentos enviado. O resultado permanece pendente de revisão documental adicional."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {findings.map((finding) => (
                  <LevelPill
                    key={finding.id}
                    level={finding.confidence}
                    meaning="confidence"
                    label={finding.title}
                  />
                ))}
              </div>
            </Card>
          </section>

          <section className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-brand-dark" />
              <h2 className="text-base font-semibold text-ink">
                Achados e evidências
              </h2>
            </div>
            <div className="space-y-3">
              {findings.map((finding) => (
                <Card key={finding.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-ink">
                        {finding.title}
                      </h3>
                      <p className="text-xs text-muted mt-1">
                        {finding.category}
                      </p>
                    </div>
                    <LevelPill level={finding.confidence} meaning="confidence" />
                  </div>
                  <p className="text-sm leading-6 text-muted mt-3">
                    {finding.summary}
                  </p>
                  <div className="mt-4 space-y-2">
                    {finding.evidence.map((evidence, index) => (
                      <EvidenceQuote
                        key={evidence.docId + "-" + index}
                        docName={evidence.docName}
                        page={evidence.page}
                        excerpt={evidence.excerpt}
                      />
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-rust" />
              <h2 className="text-base font-semibold text-ink">
                Conflitos e lacunas
              </h2>
            </div>
            <div className="space-y-3">
              {conflicts.map((conflict) => (
                <Card key={conflict.id} className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      size={15}
                      className="text-rust shrink-0 mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-ink">
                        {conflict.title}
                      </h3>
                      <p className="text-sm leading-6 text-muted mt-2">
                        {conflict.description}
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-md bg-paper border border-line px-3 py-2 text-xs text-ink">
                          <strong className="text-muted">Fonte A:</strong>{" "}
                          {conflict.sourceA.docName} · p.{" "}
                          {conflict.sourceA.page}
                        </div>
                        <div className="rounded-md bg-paper border border-line px-3 py-2 text-xs text-ink">
                          <strong className="text-muted">Fonte B:</strong>{" "}
                          {conflict.sourceB.docName} · p.{" "}
                          {conflict.sourceB.page}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {gaps.map((gap) => (
                <Card key={gap.id} className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      size={15}
                      className="text-amber shrink-0 mt-0.5"
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-ink">
                        {gap.title}
                      </h3>
                      <p className="text-sm leading-6 text-muted mt-2">
                        {gap.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <Card className="mt-6 p-5 border-success/20 bg-success-light/40">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={18}
                className="text-success-dark shrink-0 mt-0.5"
              />
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Responsabilidade profissional
                </h2>
                <p className="text-sm leading-6 text-muted mt-2">
                  A decisão sobre interpretação, continuidade do cuidado,
                  reprodução de exames, encaminhamento ou mudança de conduta
                  deve ser feita pelo médico com base no conjunto completo de
                  documentos, no contexto do paciente e nos critérios clínicos
                  aplicáveis. Este sistema organiza e rastreia, mas não
                  substitui o julgamento clínico.
                </p>
              </div>
            </div>
          </Card>

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Link
              href={`/cases/${clinicalCase.id}/review`}
              className="text-sm text-muted hover:text-ink"
            >
              Voltar para revisão
            </Link>
            <Link
              href={`/cases/${clinicalCase.id}/verify`}
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark px-4 py-2.5 rounded-md text-sm font-medium text-white"
            >
              Verificar integridade <Fingerprint size={14} />
            </Link>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
