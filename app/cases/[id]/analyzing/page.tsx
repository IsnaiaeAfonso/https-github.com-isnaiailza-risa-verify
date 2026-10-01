"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCaseStore } from "@/lib/store";
import AppShell from "@/components/AppShell";
import CaseHeader from "@/components/CaseHeader";
import { Card } from "@/components/ui";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

const STAGES = [
  "Documentos corrigidos",
  "Informações extraídas",
  "Evidências identificadas",
  "Comparando informações",
  "Identificando possíveis conflitos",
  "Preparando revisão",
];

export default function AnalyzingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getCase, runAnalysis } = useCaseStore();
  const clinicalCase = getCase(params.id);
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!clinicalCase) return;
    if (clinicalCase.status !== "em_analise" && clinicalCase.status !== "revisao_pendente") {
      runAnalysis(clinicalCase.id);
    }
    const stageTimer = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, STAGES.length - 1));
    }, 550);
    const redirect = setTimeout(() => {
      router.push(`/cases/${clinicalCase.id}/review`);
    }, 3400);
    return () => {
      clearInterval(stageTimer);
      clearTimeout(redirect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicalCase?.id]);

  if (!clinicalCase) {
    return (
      <AppShell>
        <main className="flex-1 flex items-center justify-center text-muted text-sm">Caso não encontrado.</main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex-1 bg-paper flex flex-col">
        <CaseHeader clinicalCase={clinicalCase} subtitle="Simulação da análise de documentos" />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <Card className="w-full max-w-md px-6 py-6">
            <h2 className="text-base font-semibold text-ink mb-1">Analisando caso...</h2>
            <p className="text-sm text-muted mb-6">
              Estamos processando os seus documentos. Isso pode levar alguns segundos.
            </p>

            <div className="space-y-3.5">
              {STAGES.map((stage, i) => {
                const done = i < stageIndex;
                const active = i === stageIndex;
                return (
                  <div key={stage} className="flex items-center gap-2.5">
                    {done ? (
                      <CheckCircle2 size={17} className="text-success shrink-0" />
                    ) : active ? (
                      <Loader2 size={17} className="text-brand animate-spin shrink-0" />
                    ) : (
                      <Circle size={17} className="text-line shrink-0" />
                    )}
                    <span className={`text-sm ${done ? "text-ink" : active ? "text-ink" : "text-muted"}`}>{stage}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
