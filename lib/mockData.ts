import {
  ClinicalCase,
  ClinicalDocument,
  Finding,
  Conflict,
  Gap,
  TimelineEvent,
  JevItem,
} from "./types";

// Todos os dados abaixo são fictícios, criados apenas para fins de demonstração.
// O IASX Clinical Review não realiza diagnóstico, prescrição ou recomendação médica.

const documents: ClinicalDocument[] = [
  {
    id: "doc-1",
    name: "Resumo de alta - Hospital Vale Verde.pdf",
    type: "Resumo de alta",
    pages: 4,
    sizeLabel: "1.2 MB",
  },
  {
    id: "doc-2",
    name: "Laudo laboratorial - Painel metabólico.pdf",
    type: "Laudo laboratorial",
    pages: 2,
    sizeLabel: "480 KB",
  },
  {
    id: "doc-3",
    name: "Evolução ambulatorial - Clínica Serrano.pdf",
    type: "Evolução clínica",
    pages: 6,
    sizeLabel: "2.1 MB",
  },
];

const findings: Finding[] = [
  {
    id: "f-1",
    title: "Diagnóstico registrado de hipertensão arterial estágio 1",
    category: "Histórico clínico",
    summary:
      "Registrado como diagnóstico ativo em duas fontes independentes, com data de início divergente entre os documentos.",
    confidence: "alta",
    evidence: [
      {
        docId: "doc-1",
        docName: "Resumo de alta - Hospital Vale Verde.pdf",
        page: 1,
        excerpt:
          "Paciente com HAS estágio 1, diagnosticada em 03/2023, em acompanhamento ambulatorial.",
      },
      {
        docId: "doc-3",
        docName: "Evolução ambulatorial - Clínica Serrano.pdf",
        page: 2,
        excerpt:
          "HAS de longa data, referida pela paciente desde 2021, sem registro de exames prévios anexados.",
      },
    ],
  },
  {
    id: "f-2",
    title: "Alteração leve em função renal (creatinina)",
    category: "Resultado laboratorial",
    summary:
      "Valor de creatinina discretamente acima da referência no laudo mais recente, sem exame anterior no conjunto para comparação.",
    confidence: "media",
    evidence: [
      {
        docId: "doc-2",
        docName: "Laudo laboratorial - Painel metabólico.pdf",
        page: 1,
        excerpt:
          "Creatinina sérica: 1.3 mg/dL (VR: 0.6 - 1.2 mg/dL).",
      },
    ],
  },
  {
    id: "f-3",
    title: "Alergia a dipirona referida",
    category: "Histórico clínico",
    summary:
      "Citada no resumo de alta como relato verbal, sem confirmação formal no conjunto de documentos analisado.",
    confidence: "baixa",
    evidence: [
      {
        docId: "doc-1",
        docName: "Resumo de alta - Hospital Vale Verde.pdf",
        page: 3,
        excerpt:
          "Paciente refere reação alérgica prévia à dipirona (relato verbal, não documentado em teste).",
      },
    ],
  },
];

const conflicts: Conflict[] = [
  {
    id: "c-1",
    title: "Data de início da hipertensão diverge entre fontes",
    description:
      "O resumo de alta indica início do quadro em março de 2023, enquanto a evolução ambulatorial registra relato da paciente de início em 2021. As duas fontes não referenciam entre si.",
    severity: "media",
    sourceA: {
      docId: "doc-1",
      docName: "Resumo de alta - Hospital Vale Verde.pdf",
      page: 1,
      excerpt:
        "Paciente com HAS estágio 1, diagnosticada em 03/2023, em acompanhamento ambulatorial.",
    },
    sourceB: {
      docId: "doc-3",
      docName: "Evolução ambulatorial - Clínica Serrano.pdf",
      page: 2,
      excerpt:
        "HAS de longa data, referida pela paciente desde 2021, sem registro de exames prévios anexados.",
    },
  },
];

const gaps: Gap[] = [
  {
    id: "g-1",
    title: "Ausência de exame de função renal anterior para comparação",
    description:
      "Não há laudo laboratorial anterior no conjunto de documentos que permita comparar a evolução da creatinina ao longo do tempo.",
  },
];

const timeline: TimelineEvent[] = [
  {
    id: "t-1",
    date: "2023-03-14",
    label: "Diagnóstico de HAS estágio 1 registrado",
    docId: "doc-1",
    docName: "Resumo de alta - Hospital Vale Verde.pdf",
  },
  {
    id: "t-2",
    date: "2023-05-02",
    label: "Registro de evolução ambulatorial",
    docId: "doc-3",
    docName: "Evolução ambulatorial - Clínica Serrano.pdf",
  },
  {
    id: "t-3",
    date: "2025-09-03",
    label: "Painel metabólico com creatinina alterada",
    docId: "doc-2",
    docName: "Laudo laboratorial - Painel metabólico.pdf",
  },
];

const jevItems: JevItem[] = [
  {
    id: "j-1",
    relatedTitle: "Dosagem de losartana descrita de forma diferente",
    relatedType: "conflict",
    humanReviewRequired: true,
    priority: "alta",
    clarity: "baixa",
    reason: "Divergência posológica direta entre dois documentos da mesma fonte ambulatorial, sem justificativa registrada.",
  },
  {
    id: "j-2",
    relatedTitle: "Data de início da hipertensão diverge entre fontes",
    relatedType: "conflict",
    humanReviewRequired: true,
    priority: "media",
    clarity: "media",
    reason: "Divergência de datas entre relato verbal e registro hospitalar, com impacto limitado na conduta atual.",
  },
  {
    id: "j-3",
    relatedTitle: "Alergia a dipirona referida",
    relatedType: "finding",
    humanReviewRequired: true,
    priority: "media",
    clarity: "baixa",
    reason: "Informação de segurança relevante mencionada em fonte única, sem confirmação cruzada.",
  },
  {
    id: "j-4",
    relatedTitle: "Achado incidental em ressonância lombar",
    relatedType: "finding",
    humanReviewRequired: false,
    priority: "baixa",
    clarity: "alta",
    reason: "Achado descrito de forma clara e única fonte, sem conflito com demais documentos.",
  },
  {
    id: "j-5",
    relatedTitle: "Intervalo de 14 meses sem registro de evolução",
    relatedType: "gap",
    humanReviewRequired: true,
    priority: "baixa",
    clarity: "media",
    reason: "Lacuna temporal que pode ou não refletir ausência real de atendimento no período.",
  },
];

export interface LabTrendPoint {
  date: string;
  value: number;
}

export const labTrend: { metric: string; unit: string; points: LabTrendPoint[] } = {
  metric: "Creatinina sérica",
  unit: "mg/dL",
  points: [
    { date: "2024-11-02", value: 0.9 },
    { date: "2025-02-14", value: 1.0 },
    { date: "2025-06-01", value: 1.1 },
    { date: "2025-09-03", value: 1.3 },
  ],
};

export const DEMO_CASE_ID = "case-001";

export function buildDemoCase(): ClinicalCase {
  return {
    id: DEMO_CASE_ID,
    reference: "IASX-2025-000142",
    subjectLabel: "Sujeito de revisão #142 (dados fictícios)",
    createdAt: "2025-09-20T09:12:00Z",
    status: "revisao_pendente",
    documents,
    findings,
    conflicts,
    gaps,
    timeline,
  };
}

export const jevItemsForDemo = jevItems;

export const seedCases: ClinicalCase[] = [
  buildDemoCase(),
  {
    id: "case-002",
    reference: "IASX-2025-000139",
    subjectLabel: "Sujeito de revisão #139 (dados fictícios)",
    createdAt: "2025-09-17T14:03:00Z",
    status: "em_analise",
    documents: documents.slice(0, 3),
    findings: [],
    conflicts: [],
    gaps: [],
    timeline: [],
  },
  {
    id: "case-003",
    reference: "IASX-2025-000131",
    subjectLabel: "Sujeito de revisão #131 (dados fictícios)",
    createdAt: "2025-09-11T08:47:00Z",
    status: "revisao_concluida",
    documents: documents.slice(0, 4),
    findings: findings.slice(0, 3),
    conflicts: conflicts.slice(0, 1),
    gaps: gaps.slice(0, 1),
    timeline: timeline.slice(0, 3),
    attestation: {
      attestationId: "ATT-000131-A",
      reviewer: "Dra. Marina Kobayashi, CRM fictício",
      completedAt: "2025-09-12T16:30:00Z",
      network: "Solana Devnet",
      transactionId: "5uJv2m9pQzRk3sT7bVn1XyC8fW6dLh4NqMoA2eYgKzPx",
      contentHash: "b7f0c1e3a9d2f6481c0e9a7b3d5f8210ac44e9b7f1d3a6c8e0b2f4a6c8e0b2f4",
      status: "confirmado",
    },
  },
];
