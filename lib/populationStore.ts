export type PopulationSex = "Feminino" | "Masculino" | "Não informado";

export interface PopulationRecord {
  age: number;
  sex: PopulationSex;
  diagnosis: string;
  observedAt: string;
}

export const POPULATION_STORAGE_KEY = "iasx-population-records-v1";

export const DEMO_POPULATION_RECORDS: PopulationRecord[] = [
  { age: 58, sex: "Feminino", diagnosis: "Hipertensão arterial", observedAt: "2026-01-08" },
  { age: 64, sex: "Masculino", diagnosis: "Hipertensão arterial", observedAt: "2026-01-12" },
  { age: 42, sex: "Feminino", diagnosis: "Diabetes mellitus", observedAt: "2026-01-19" },
  { age: 31, sex: "Masculino", diagnosis: "Diabetes mellitus", observedAt: "2026-02-04" },
  { age: 73, sex: "Feminino", diagnosis: "Hipertensão arterial", observedAt: "2026-02-09" },
  { age: 49, sex: "Masculino", diagnosis: "Osteoartrite", observedAt: "2026-02-16" },
  { age: 55, sex: "Feminino", diagnosis: "Osteoartrite", observedAt: "2026-03-03" },
  { age: 37, sex: "Masculino", diagnosis: "Diabetes mellitus", observedAt: "2026-03-14" },
  { age: 68, sex: "Feminino", diagnosis: "Hipertensão arterial", observedAt: "2026-03-22" },
  { age: 46, sex: "Não informado", diagnosis: "Osteoartrite", observedAt: "2026-04-07" },
];

function isPopulationRecord(value: unknown): value is PopulationRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<PopulationRecord>;
  const age = record.age;
  return (
    typeof age === "number" &&
    Number.isFinite(age) &&
    age >= 0 &&
    age <= 120 &&
    ["Feminino", "Masculino", "Não informado"].includes(record.sex ?? "") &&
    typeof record.diagnosis === "string" &&
    record.diagnosis.trim().length > 0 &&
    typeof record.observedAt === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(record.observedAt)
  );
}

export function loadPopulationRecords(): PopulationRecord[] {
  if (typeof window === "undefined") return DEMO_POPULATION_RECORDS;

  try {
    const raw = window.localStorage.getItem(POPULATION_STORAGE_KEY);
    if (!raw) return DEMO_POPULATION_RECORDS;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEMO_POPULATION_RECORDS;
    return parsed.filter(isPopulationRecord);
  } catch {
    return DEMO_POPULATION_RECORDS;
  }
}

export function savePopulationRecords(records: PopulationRecord[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(POPULATION_STORAGE_KEY, JSON.stringify(records));
}
