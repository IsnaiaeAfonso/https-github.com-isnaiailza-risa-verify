import { ClinicalCase, EvidenceRef } from "./types";
import { DEMO_CASE_ID, labTrend } from "./mockData";

export type CaseQuestionId =
  | "finding-reason"
  | "finding-documents"
  | "identified-conflicts"
  | "conflicting-documents"
  | "missing-information"
  | "professional-confirmation"
  | "results-over-time"
  | "identified-variation";

export interface CaseAssistantQuestion {
  id: CaseQuestionId;
  label: string;
}

export interface CaseAssistantSource {
  documentId?: string;
  documentName: string;
  page?: number;
  excerpt?: string;
}

export interface CaseAssistantResponse {
  answer: string;
  sources: CaseAssistantSource[];
  supported: boolean;
}

interface CaseMeasurement {
  date: string;
  value: number;
  metric: string;
  unit: string;
  documentId?: string;
  documentName?: string;
  page?: number;
  excerpt?: string;
}

const INSUFFICIENT_DATA = "Este caso ainda não possui informações suficientes para responder a esta pergunta.";
const INFORMATION_UNAVAILABLE = "Essa informação não está disponível nos dados analisados deste caso.";

function unsupported(answer = INSUFFICIENT_DATA): CaseAssistantResponse {
  return { answer, sources: [], supported: false };
}

function sourceFromEvidence(caseData: ClinicalCase, evidence: EvidenceRef): CaseAssistantSource | null {
  const document = caseData.documents.find((item) => item.id === evidence.docId);
  const documentName = document?.name || evidence.docName;
  if (!documentName) return null;

  return {
    documentId: evidence.docId || document?.id,
    documentName,
    ...(typeof evidence.page === "number" && Number.isFinite(evidence.page) ? { page: evidence.page } : {}),
    ...(typeof evidence.excerpt === "string" && evidence.excerpt.trim()
      ? { excerpt: evidence.excerpt }
      : {}),
  };
}

function uniqueSources(sources: Array<CaseAssistantSource | null>): CaseAssistantSource[] {
  const seen = new Set<string>();
  return sources.filter((source): source is CaseAssistantSource => {
    if (!source) return false;
    const key = `${source.documentId ?? ""}|${source.documentName}|${source.page ?? ""}|${source.excerpt ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function comparableMeasurementGroups(caseData: ClinicalCase) {
  const groups = new Map<string, CaseMeasurement[]>();
  for (const event of caseData.timeline) {
    if (
      typeof event.value !== "number" ||
      !Number.isFinite(event.value) ||
      !event.metric?.trim() ||
      !event.unit?.trim()
    ) continue;
    const key = `${event.metric.trim()}|${event.unit.trim()}`;
    groups.set(key, [...(groups.get(key) ?? []), {
      date: event.date,
      value: event.value,
      metric: event.metric.trim(),
      unit: event.unit.trim(),
      documentId: event.docId,
      documentName: event.docName,
      page: event.page,
      excerpt: event.excerpt,
    }]);
  }
  if (caseData.id === DEMO_CASE_ID && groups.size === 0) {
    const key = `${labTrend.metric}|${labTrend.unit}`;
    groups.set(key, labTrend.points.map((point) => ({
      ...point,
      metric: labTrend.metric,
      unit: labTrend.unit,
    })));
  }
  return [...groups.values()].filter((events) => events.length >= 2);
}

export function suggestedCaseQuestions(caseData: ClinicalCase): CaseAssistantQuestion[] {
  const questions: CaseAssistantQuestion[] = [];
  const findingsWithReason = caseData.findings.filter((finding) => finding.summary.trim());
  const hasFindingEvidence = caseData.findings.some((finding) => finding.evidence.length > 0);

  if (findingsWithReason.length > 0) {
    questions.push({ id: "finding-reason", label: "Por que estes achados foram sinalizados?" });
  }
  if (hasFindingEvidence) {
    questions.push({ id: "finding-documents", label: "Quais documentos sustentam os achados identificados?" });
  }

  if (caseData.conflicts.length > 0) {
    questions.push({ id: "identified-conflicts", label: "Quais conflitos foram identificados?" });
    if (caseData.conflicts.some((conflict) => conflict.sourceA.docName || conflict.sourceB.docName)) {
      questions.push({ id: "conflicting-documents", label: "Quais documentos apresentam informações diferentes?" });
    }
  }

  if (caseData.gaps.length > 0) {
    questions.push(
      { id: "missing-information", label: "Quais informações estão faltando?" },
      { id: "professional-confirmation", label: "O que precisa ser confirmado pelo profissional?" }
    );
  }

  const measurementGroups = comparableMeasurementGroups(caseData);
  if (measurementGroups.length > 0) {
    questions.push({ id: "results-over-time", label: "Como os resultados evoluíram no tempo?" });
  }

  if (measurementGroups.length > 0) {
    questions.push({ id: "identified-variation", label: "Qual foi a variação identificada?" });
  }

  return questions;
}

export function answerCaseQuestion(
  caseData: ClinicalCase,
  questionId: CaseQuestionId
): CaseAssistantResponse {
  const hasAnalyzedData = Boolean(
    caseData.findings.length ||
      caseData.conflicts.length ||
      caseData.gaps.length ||
      caseData.timeline.length
  );
  if (!hasAnalyzedData) return unsupported();

  switch (questionId) {
    case "finding-reason": {
      const findings = caseData.findings.filter((finding) => finding.summary.trim());
      if (findings.length === 0) return unsupported(INFORMATION_UNAVAILABLE);
      return {
        answer: findings.map((finding) => `${finding.title}: ${finding.summary}`).join(" "),
        sources: uniqueSources(findings.flatMap((finding) =>
          finding.evidence.map((evidence) => sourceFromEvidence(caseData, evidence))
        )),
        supported: true,
      };
    }
    case "finding-documents": {
      const evidence = caseData.findings.flatMap((finding) => finding.evidence);
      const sources = uniqueSources(evidence.map((item) => sourceFromEvidence(caseData, item)));
      if (sources.length === 0) return unsupported(INFORMATION_UNAVAILABLE);
      return {
        answer: `As evidências dos achados estão relacionadas aos documentos listados abaixo.`,
        sources,
        supported: true,
      };
    }
    case "identified-conflicts": {
      if (caseData.conflicts.length === 0) return unsupported(INFORMATION_UNAVAILABLE);
      const details = caseData.conflicts.map((conflict) => `${conflict.title}: ${conflict.description}`);
      const sources = uniqueSources(caseData.conflicts.flatMap((conflict) => [
        sourceFromEvidence(caseData, conflict.sourceA),
        sourceFromEvidence(caseData, conflict.sourceB),
      ]));
      return {
        answer: `Foram identificados ${caseData.conflicts.length} ${caseData.conflicts.length === 1 ? "conflito" : "conflitos"}: ${details.join("; ")}`,
        sources,
        supported: true,
      };
    }
    case "conflicting-documents": {
      if (caseData.conflicts.length === 0) return unsupported(INFORMATION_UNAVAILABLE);
      const sources = uniqueSources(caseData.conflicts.flatMap((conflict) => [
        sourceFromEvidence(caseData, conflict.sourceA),
        sourceFromEvidence(caseData, conflict.sourceB),
      ]));
      if (sources.length === 0) return unsupported(INFORMATION_UNAVAILABLE);
      return {
        answer: `Os conflitos registrados envolvem os documentos listados abaixo.`,
        sources,
        supported: true,
      };
    }
    case "missing-information":
    case "professional-confirmation": {
      if (caseData.gaps.length === 0) return unsupported(INFORMATION_UNAVAILABLE);
      return {
        answer: caseData.gaps.map((gap) => `${gap.title}: ${gap.description}`).join(" "),
        sources: [],
        supported: true,
      };
    }
    case "results-over-time": {
      const groups = comparableMeasurementGroups(caseData);
      if (groups.length === 0) return unsupported(INFORMATION_UNAVAILABLE);
      const orderedGroups = groups.map((group) => {
        if (group.every((event) => event.date)) {
          return [...group].sort((left, right) => left.date.localeCompare(right.date));
        }
        return [...group];
      });
      const events = orderedGroups.flat();
      return {
        answer: orderedGroups.map((ordered) => {
          const first = ordered[0];
          const hasDates = ordered.every((event) => event.date);
          const values = ordered.map((event) =>
            `${event.date ? `${event.date}: ` : ""}${event.value} ${event.unit}`
          );
          const dateNote = hasDates ? "" : " (as datas não foram informadas nos documentos)";
          return `${first.metric} (${first.unit}): ${values.join(hasDates ? " → " : "; ")}${dateNote}`;
        }).join("; "),
        sources: uniqueSources(events.map((event) => {
          const document = event.documentId
            ? caseData.documents.find((item) => item.id === event.documentId)
            : undefined;
          const documentName = document?.name || event.documentName;
          return documentName
            ? {
                documentId: event.documentId || document?.id,
                documentName,
                ...(event.page !== undefined ? { page: event.page } : {}),
                ...(event.excerpt ? { excerpt: event.excerpt } : {}),
              }
            : null;
        })),
        supported: true,
      };
    }
    case "identified-variation": {
      const groups = comparableMeasurementGroups(caseData);
      if (groups.length === 0) return unsupported(INFORMATION_UNAVAILABLE);
      const orderedGroups = groups.map((group) => {
        if (group.every((event) => event.date)) {
          return [...group].sort((left, right) => left.date.localeCompare(right.date));
        }
        return [...group];
      });
      const changes = orderedGroups.map((events) => {
        const first = events[0];
        const last = events[events.length - 1];
        if (!events.every((event) => event.date)) {
          const values = events.map((event) => event.value);
          const difference = Number((Math.max(...values) - Math.min(...values)).toPrecision(12));
          return `Foram registrados valores de ${first.metric} (${first.unit}) com diferença numérica de ${difference} ${first.unit}; as datas não foram informadas nos documentos.`;
        }
        const variation = Number(((last.value as number) - (first.value as number)).toPrecision(12));
        const change = variation > 0
          ? `aumento de ${variation} ${first.unit}`
          : variation < 0
            ? `redução de ${Math.abs(variation)} ${first.unit}`
            : "nenhuma variação numérica";
        return `${first.metric}: ${change} entre ${first.date} e ${last.date} (${first.value} para ${last.value})`;
      });
      const events = orderedGroups.flat();
      return {
        answer: changes.join("; "),
        sources: uniqueSources(events.map((event) => {
          const document = event.documentId
            ? caseData.documents.find((item) => item.id === event.documentId)
            : undefined;
          const documentName = document?.name || event.documentName;
          return documentName
            ? {
                documentId: event.documentId || document?.id,
                documentName,
                ...(event.page !== undefined ? { page: event.page } : {}),
                ...(event.excerpt ? { excerpt: event.excerpt } : {}),
              }
            : null;
        })),
        supported: true,
      };
    }
    default:
      return unsupported(INFORMATION_UNAVAILABLE);
  }
}