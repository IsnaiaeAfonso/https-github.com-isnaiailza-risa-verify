import type {
  ClinicalDocument,
  Conflict,
  EvidenceRef,
  Finding,
  Gap,
  LabResult,
  TimelineEvent,
} from "./types";

export interface ClinicalAnalysis {
  findings: Finding[];
  conflicts: Conflict[];
  gaps: Gap[];
  timeline: TimelineEvent[];
  labResults: LabResult[];
}

interface FactObservation {
  key: string;
  value: string;
  label: string;
  evidence: EvidenceRef;
}

function excerptAt(text: string, index: number, fallback: string) {
  const lineStart = text.lastIndexOf("\n", index) + 1;
  const lineEnd = text.indexOf("\n", index);
  const line = text.slice(lineStart, lineEnd < 0 ? text.length : lineEnd).trim();
  return line || fallback.trim();
}

function dateFromText(text: string) {
  const isoDate = text.match(/\b((?:19|20)\d{2})-(\d{2})-(\d{2})\b/);
  if (isoDate) return isoDate[0];

    const localDate = text.match(/\b(\d{1,2})[/.\\-](\d{1,2})[/.\\-]((?:19|20)\d{2})\b/);
  if (!localDate) return "";
  return `${localDate[3]}-${localDate[2].padStart(2, "0")}-${localDate[1].padStart(2, "0")}`;
}

function numericValue(value: string) {
  const parsed = Number(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

const LAB_TEST_PATTERN = /\b(hemoglobina\s+glicada|hemoglobina\s+glicosilada|hba1c|hemoglobina|hemat[oó]crito|leuc[oó]citos|neutr[oó]filos|linf[oó]citos|plaquetas|glicose|glicemia|creatinina|ureia|s[oó]dio|pot[aá]ssio|cloro|c[aá]lcio|magn[eé]sio|tgo|ast|tgp|alt|gama\s+glutamil\s+transferase|ggt|fosfatase\s+alcalina|bilirrubina\s+total|colesterol\s+total|hdl|ldl|triglicer[ií]deos|tsh|t4\s+livre|prote[ií]na\s+c\s+reativa|pcr|ferritina|ferro\s+s[eé]rico|vitamina\s+d|vitamina\s+b12|inr|tap|albumina)\b/gi;

function labReferenceRange(text: string) {
  const match = text.match(/(?:\b(?:VR|refer[eê]ncia|ref\.?)\s*:?\s*)?([<>≤≥]?\s*\d+(?:[.,]\d+)?)\s*(?:-|–|—|\ba\b|\bat[eé]\b|\bto\b)\s*([<>≤≥]?\s*\d+(?:[.,]\d+)?)/i);
  if (!match) return null;
  return {
    label: `${match[1].trim()} - ${match[2].trim()}`,
    lower: numericValue(match[1].replace(/[<>≤≥]/g, "")),
    upper: numericValue(match[2].replace(/[<>≤≥]/g, "")),
  };
}

function extractLabResults(document: ClinicalDocument, page: number, text: string): LabResult[] {
  const results: LabResult[] = [];
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    const tests = [...line.matchAll(LAB_TEST_PATTERN)];
    for (const [index, test] of tests.entries()) {
      const start = (test.index ?? 0) + test[0].length;
      const end = tests[index + 1]?.index ?? line.length;
      const resultText = line.slice(start, end).trim();
      const valueMatch = resultText.match(/^\s*[:=]?\s*([<>≤≥]?\s*\d+(?:[.,]\d+)?)/);
      if (!valueMatch) continue;

      const value = valueMatch[1].replace(/\s/g, "");
      const remainder = resultText.slice(valueMatch[0].length).trim();
      const unitMatch = remainder.match(/^([a-zA-Zµμ%][a-zA-Z0-9µμ/%^.-]*)/);
      const unit = unitMatch?.[1];
      const trailingText = unit ? remainder.slice(unit.length).trim() : remainder;
      const reference = labReferenceRange(trailingText);
      const numericResult = /^[<>≤≥]/.test(value) ? null : numericValue(value);
      const outsideReference = numericResult !== null && reference !== null && reference.lower !== null && reference.upper !== null
        ? numericResult < reference.lower || numericResult > reference.upper
        : false;
      const explicitlyFlagged = /(?:\b(?:alto|alta|baixo|baixa|alterado|alterada|high|low|abnormal)\b|(?:^|\s)[HL]\s*$|[↑↓]|\*)/i.test(trailingText);
      const status: LabResult["status"] = outsideReference
        ? "fora_da_referencia"
        : explicitlyFlagged
          ? "sinalizado_no_laudo"
          : reference
            ? "dentro_da_referencia"
            : "sem_referencia";
      const excerpt = line.slice(test.index ?? 0, end).trim();

      results.push({
        id: `${document.id}-lab-${page}-${results.length + 1}`,
        testName: test[0].trim(),
        result: value,
        unit,
        referenceRange: reference?.label,
        status,
        evidence: {
          docId: document.id,
          docName: document.name,
          page,
          excerpt,
        },
      });
    }
  }

  return results;
}

export function analyzeClinicalDocuments(documents: ClinicalDocument[]): ClinicalAnalysis {
  const findings: Finding[] = [];
  const conflicts: Conflict[] = [];
  const gaps: Gap[] = [];
  const timeline: TimelineEvent[] = [];
  const labResults: LabResult[] = [];
  const observations: FactObservation[] = [];
  const comparisonCueDocs = new Map<string, { document: ClinicalDocument; page: number; excerpt: string }>();

  function addFinding(
    document: ClinicalDocument,
    page: number,
    title: string,
    category: string,
    excerpt: string,
    confidence: Finding["confidence"] = "media"
  ) {
    const evidence: EvidenceRef = {
      docId: document.id,
      docName: document.name,
      page,
      excerpt,
    };
    findings.push({
      id: `${document.id}-finding-${findings.length + 1}`,
      title,
      category,
      summary: `Trecho identificado no documento: “${excerpt}”`,
      confidence,
      evidence: [evidence],
    });
    return evidence;
  }

  function addTimeline(
    document: ClinicalDocument,
    page: number,
    date: string,
    label: string,
    fields: Pick<TimelineEvent, "metric" | "value" | "unit"> = {},
    excerpt?: string
  ) {
    timeline.push({
      id: `${document.id}-timeline-${timeline.length + 1}`,
      date,
      label,
      docId: document.id,
      docName: document.name,
      page,
      excerpt,
      ...fields,
    });
  }

  for (const document of documents) {
    for (const [pageIndex, pageText] of (document.extractedPages ?? []).entries()) {
      if (!pageText.trim()) continue;
      const pageNumber = pageIndex + 1;
      labResults.push(...extractLabResults(document, pageNumber, pageText));

      const creatininePattern = /\bcreatinina(?:\s+s[eé]rica)?\s*[:=\-]?\s*(\d+(?:[,.]\d+)?)\s*(mg\s*\/\s*dL)?/gi;
      for (const match of pageText.matchAll(creatininePattern)) {
        const rawValue = match[1];
        const value = numericValue(rawValue);
        if (value === null) continue;
        const excerpt = match[0].trim();
        const unit = match[2] ? "mg/dL" : "";
        const evidence = addFinding(
          document,
          pageNumber,
          `Creatinina registrada: ${rawValue}${unit ? ` ${unit}` : ""}`,
          "Resultado laboratorial",
          excerpt
        );

        observations.push({
          key: `creatinina|${unit || "unidade não informada"}`,
          value: String(value),
          label: `Creatinina ${value}${unit ? ` ${unit}` : ""}`,
          evidence,
        });
        if (unit) {
          addTimeline(
            document,
            pageNumber,
            dateFromText(excerptAt(pageText, match.index ?? 0, excerpt)),
            excerpt,
            { metric: "Creatinina", value, unit },
            excerpt
          );
        }
      }

      const bloodPressurePattern = /\b(press[aã]o arterial|PA)\s*[:=\-]?\s*(\d{2,3})\s*\/\s*(\d{2,3})(?:\s*(mm\s*hg))?/gi;
      for (const match of pageText.matchAll(bloodPressurePattern)) {
        const excerpt = match[0].trim();
        const systolic = Number(match[2]);
        const diastolic = Number(match[3]);
        const unit = match[4] ? "mmHg" : "";
        const evidence = addFinding(
          document,
          pageNumber,
          `Pressão arterial registrada: ${match[2]}/${match[3]}${unit ? ` ${unit}` : ""}`,
          "Sinal vital",
          excerpt
        );
        observations.push({
          key: `pressao-arterial|${unit || "unidade não informada"}`,
          value: `${systolic}/${diastolic}`,
          label: `Pressão arterial ${systolic}/${diastolic}${unit ? ` ${unit}` : ""}`,
          evidence,
        });
        if (unit) {
          const date = dateFromText(excerptAt(pageText, match.index ?? 0, excerpt));
          addTimeline(document, pageNumber, date, excerpt, {
            metric: "Pressão arterial sistólica",
            value: systolic,
            unit,
          }, excerpt);
          addTimeline(document, pageNumber, date, excerpt, {
            metric: "Pressão arterial diastólica",
            value: diastolic,
            unit,
          }, excerpt);
        }
      }

      const hypertensionPattern = /\b(?:hipertens[aã]o(?:\s+arterial)?|HAS)\b[^\n.;!?]*/gi;
      for (const match of pageText.matchAll(hypertensionPattern)) {
        const excerpt = match[0].trim();
        const year = excerpt.match(/\b(?:19|20)\d{2}\b/);
        const isDiagnosis = /diagnosticad[ao]|diagn[oó]stic[ao]/i.test(excerpt);
        const evidence = addFinding(
          document,
          pageNumber,
          year && isDiagnosis ? `Hipertensão diagnosticada em ${year[0]}` : "Menção a hipertensão no documento",
          "Histórico clínico",
          excerpt
        );
        if (year && isDiagnosis) {
          observations.push({
            key: "hipertensao-diagnostico-ano",
            value: year[0],
            label: `Hipertensão diagnosticada em ${year[0]}`,
            evidence,
          });
          addTimeline(document, pageNumber, year[0], excerpt, {}, excerpt);
        }
      }

      const diabetesPattern = /\bdiabetes(?:\s+mellitus)?\b[^\n.;!?]*/gi;
      for (const match of pageText.matchAll(diabetesPattern)) {
        addFinding(document, pageNumber, "Menção a diabetes no documento", "Histórico clínico", match[0].trim());
      }

      const allergyPattern = /\b(?:alergia(?:\s+(?:a|ao|à|aos|às))?|al[eé]rgic[oa])\s+[^,.;\n!?]+/gi;
      for (const match of pageText.matchAll(allergyPattern)) {
        addFinding(document, pageNumber, "Menção a alergia no documento", "Histórico clínico", match[0].trim());
      }

      const medicationPattern = /\b(?:medicamentos?|medica[cç][aã]o|prescri[cç][aã]o|uso\s+cont[ií]nuo)\b[^.!?\n]{0,120}/gi;
      for (const match of pageText.matchAll(medicationPattern)) {
        addFinding(document, pageNumber, "Informação sobre medicamento registrada", "Medicação", match[0].trim());
      }

      const explicitComparison = /\bcompar(?:ar|a[cç][aã]o)\b[^.!?\n]{0,60}\b(?:exame|resultado)\s+anterior\b/gi;
      for (const match of pageText.matchAll(explicitComparison)) {
        comparisonCueDocs.set(document.id, {
          document,
          page: pageNumber,
          excerpt: match[0].trim(),
        });
      }

      const fullDatePattern = /\b(?:(?:19|20)\d{2}-\d{2}-\d{2}|\d{1,2}[/.\-]\d{1,2}[/.\-](?:19|20)\d{2})\b/g;
      for (const match of pageText.matchAll(fullDatePattern)) {
        const excerpt = excerptAt(pageText, match.index ?? 0, match[0]);
        const date = dateFromText(match[0]);
        const alreadyRecorded = timeline.some(
          (event) => event.docId === document.id && event.page === pageNumber && event.date === date
        );
        if (!alreadyRecorded) addTimeline(document, pageNumber, date, excerpt, {}, excerpt);
      }
    }
  }

  const observationsByFact = new Map<string, FactObservation[]>();
  for (const observation of observations) {
    observationsByFact.set(observation.key, [...(observationsByFact.get(observation.key) ?? []), observation]);
  }

  for (const [key, facts] of observationsByFact) {
    for (let firstIndex = 0; firstIndex < facts.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < facts.length; secondIndex += 1) {
        const first = facts[firstIndex];
        const second = facts[secondIndex];
        if (first.evidence.docId === second.evidence.docId || first.value === second.value) continue;

        conflicts.push({
          id: `conflict-${conflicts.length + 1}`,
          title: `${first.label.split(" ")[0]} divergente entre documentos`,
          description: `Os documentos registram ${first.label} e ${second.label}, respectivamente.`,
          severity: "media",
          sourceA: first.evidence,
          sourceB: second.evidence,
        });
      }
    }
    void key;
  }

  const creatinineMeasurements = observations.filter((observation) => observation.key.startsWith("creatinina|"));
  for (const cue of comparisonCueDocs.values()) {
    const documentMeasurements = creatinineMeasurements.filter(
      (observation) => observation.evidence.docId === cue.document.id
    );
    const anotherDocumentHasMeasurement = creatinineMeasurements.some(
      (observation) => observation.evidence.docId !== cue.document.id
    );
    if (anotherDocumentHasMeasurement || documentMeasurements.length >= 2) continue;

      gaps.push({
        id: `${cue.document.id}-gap-comparison`,
        title: "Comparação com exame anterior solicitada no documento",
        description: `O documento menciona “${cue.excerpt}”, mas não há outra medição de creatinina nos documentos enviados.`,
      });
  }

  return { findings, conflicts, gaps, timeline, labResults };
}