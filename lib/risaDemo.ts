import type { ClinicalCase } from "@/lib/types";

export interface RisaUtterance {
  id: string;
  speaker: "Paciente" | "Médico" | "Falante não identificado";
  timestamp: string;
  text: string;
  source: "browser-speech" | "demo-fixture";
  confidence: "Alta" | "Média" | "Baixa" | "Não avaliada";
}

export interface RisaInsight {
  id: string;
  title: string;
  detail: string;
  kind: "Ponto para revisão" | "Informação incompleta";
  utteranceIds: string[];
  documentTerms: string[];
}

export interface RisaCaseEvidence {
  docName: string;
  page: number;
  excerpt: string;
}

export const RISA_DEMO_UTTERANCES: RisaUtterance[] = [
  {
    id: "risa-demo-1",
    speaker: "Paciente",
    timestamp: "00:00:15",
    text: "Tenho sentido meu coração bater mais rápido quando subo escadas.",
    source: "demo-fixture",
    confidence: "Não avaliada",
  },
  {
    id: "risa-demo-2",
    speaker: "Paciente",
    timestamp: "00:00:22",
    text: "Isso começou há umas duas semanas.",
    source: "demo-fixture",
    confidence: "Não avaliada",
  },
  {
    id: "risa-demo-3",
    speaker: "Paciente",
    timestamp: "00:00:30",
    text: "Às vezes também fico um pouco tonta.",
    source: "demo-fixture",
    confidence: "Não avaliada",
  },
  {
    id: "risa-demo-4",
    speaker: "Médico",
    timestamp: "00:00:38",
    text: "Você lembra o nome do medicamento novo?",
    source: "demo-fixture",
    confidence: "Não avaliada",
  },
  {
    id: "risa-demo-5",
    speaker: "Paciente",
    timestamp: "00:00:45",
    text: "Comecei um medicamento novo há aproximadamente dois meses, mas não lembro o nome.",
    source: "demo-fixture",
    confidence: "Não avaliada",
  },
];

export function structureRisaUtterances(utterances: RisaUtterance[]): RisaInsight[] {
  const allText = utterances.map((utterance) => utterance.text.toLocaleLowerCase("pt-BR")).join(" ");
  const containsAny = (...terms: string[]) => terms.some((term) => allText.includes(term));
  const findIds = (...terms: string[]) => utterances
    .filter((utterance) => terms.some((term) => utterance.text.toLocaleLowerCase("pt-BR").includes(term)))
    .map((utterance) => utterance.id);
  const insights: RisaInsight[] = [];

  if (containsAny("palpitação", "palpitacao", "coração bater mais rápido", "coração acelerado")) {
    insights.push({
      id: "risa-live-palpitacao",
      title: "Palpitação mencionada",
      detail: "Informação extraída literalmente da fala; confirme o contexto com o paciente.",
      kind: "Ponto para revisão",
      utteranceIds: findIds("palpitação", "palpitacao", "coração bater mais rápido", "coração acelerado"),
      documentTerms: ["palpita", "coração", "esforço"],
    });
  }
  if (containsAny("tontura", "tonto", "tonta", "vertigem")) {
    insights.push({
      id: "risa-live-tontura",
      title: "Tontura mencionada",
      detail: "A conversa capturada não determina causa nem gravidade; esclareça frequência e duração.",
      kind: "Ponto para revisão",
      utteranceIds: findIds("tontura", "tonto", "tonta", "vertigem"),
      documentTerms: ["tontura", "tonto", "vertigem"],
    });
  }
  if (containsAny("medicamento", "remédio", "remedio")) {
    const unidentified = containsAny("não lembro o nome", "nao lembro o nome", "não sei o nome", "nao sei o nome");
    insights.push({
      id: "risa-live-medicamento",
      title: unidentified ? "Medicamento mencionado; nome não identificado" : "Medicamento mencionado na conversa",
      detail: "Confirme o nome e os detalhes diretamente com o paciente; a transcrição pode conter erros.",
      kind: unidentified ? "Informação incompleta" : "Ponto para revisão",
      utteranceIds: findIds("medicamento", "remédio", "remedio"),
      documentTerms: ["medicamento"],
    });
  }
  if (containsAny("duas semanas", "2 semanas", "uma semana", "um mês", "um mes", "há ", "ha ")) {
    insights.push({
      id: "risa-live-tempo",
      title: "Referência temporal mencionada",
      detail: "Trecho temporal literal identificado; confirme início e duração com o paciente.",
      kind: "Ponto para revisão",
      utteranceIds: findIds("semana", "mês", "mes", "há ", "ha "),
      documentTerms: ["semanas", "mês", "mes"],
    });
  }

  return insights;
}

export const RISA_DEMO_INSIGHTS: RisaInsight[] = [
  {
    id: "risa-insight-palpitacao",
    title: "Palpitação mencionada durante esforço",
    detail: "O relato associa a sensação a subir escadas.",
    kind: "Ponto para revisão",
    utteranceIds: ["risa-demo-1"],
    documentTerms: ["palpita", "coração", "esforço"],
  },
  {
    id: "risa-insight-tontura",
    title: "Tontura mencionada",
    detail: "O relato não detalha frequência nem duração dos episódios.",
    kind: "Ponto para revisão",
    utteranceIds: ["risa-demo-3"],
    documentTerms: ["tontura", "tonto", "vertigem"],
  },
  {
    id: "risa-insight-duracao",
    title: "Início aproximado há duas semanas",
    detail: "Duração relatada; requer confirmação profissional.",
    kind: "Ponto para revisão",
    utteranceIds: ["risa-demo-2"],
    documentTerms: ["duas semanas", "2 semanas"],
  },
  {
    id: "risa-insight-medicamento",
    title: "Medicamento novo não identificado",
    detail: "O nome do medicamento não foi informado no relato sintético.",
    kind: "Informação incompleta",
    utteranceIds: ["risa-demo-4", "risa-demo-5"],
    documentTerms: ["medicamento"],
  },
];

export function findRisaCaseEvidence(clinicalCase: ClinicalCase, insight: RisaInsight): RisaCaseEvidence[] {
  const terms = insight.documentTerms.map((term) => term.toLocaleLowerCase("pt-BR"));
  const evidence = clinicalCase.findings.flatMap((finding) => finding.evidence);
  const matched = evidence.filter((item) => {
    const sourceText = `${item.docName} ${item.excerpt}`.toLocaleLowerCase("pt-BR");
    return terms.some((term) => sourceText.includes(term));
  });

  return matched.slice(0, 3).map((item) => ({
    docName: item.docName,
    page: item.page,
    excerpt: item.excerpt,
  }));
}
