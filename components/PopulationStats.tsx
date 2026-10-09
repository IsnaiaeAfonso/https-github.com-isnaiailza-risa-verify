"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadPopulationRecords,
  PopulationRecord,
  PopulationSex,
  savePopulationRecords,
} from "@/lib/populationStore";
import { Activity, BarChart3, CalendarDays, Filter, UserRound } from "lucide-react";

const SEX_OPTIONS: PopulationSex[] = ["Feminino", "Masculino", "Não informado"];

export default function PopulationStats() {
  const [records, setRecords] = useState<PopulationRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [sex, setSex] = useState("");
  const [diagnosis, setDiagnosis] = useState("");

  useEffect(() => {
    setRecords(loadPopulationRecords());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) savePopulationRecords(records);
  }, [hydrated, records]);

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        const [recordYear, recordMonth, recordDay] = record.observedAt.slice(0, 10).split("-");
        const age = record.age;
        return (
          (year === "" || recordYear === year) &&
          (month === "" || recordMonth === month) &&
          (day === "" || recordDay === day) &&
          (ageMin === "" || age >= Number(ageMin)) &&
          (ageMax === "" || age <= Number(ageMax)) &&
          (sex === "" || record.sex === sex) &&
          (diagnosis === "" || record.diagnosis === diagnosis)
        );
      }),
    [ageMax, ageMin, day, diagnosis, month, records, sex, year],
  );

  const diagnosisCounts = useMemo(() => {
    const counts = new Map<string, number>();
    filteredRecords.forEach((record) => {
      counts.set(record.diagnosis, (counts.get(record.diagnosis) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRecords]);

  const maxCount = Math.max(...diagnosisCounts.map((item) => item.count), 1);

  function resetFilters() {
    setYear("");
    setMonth("");
    setDay("");
    setAgeMin("");
    setAgeMax("");
    setSex("");
    setDiagnosis("");
  }

  return (
    <section className="mt-8 rounded-2xl border border-line bg-panel shadow-card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity size={17} className="text-brand" />
              <h2 className="text-sm font-semibold text-ink">Estatísticas populacionais</h2>
            </div>
            <p className="text-xs text-muted mt-1">Contagem de pessoas por diagnóstico, com filtros de data, idade e sexo.</p>
          </div>
          <span className="rounded-full bg-brand-light/50 px-3 py-1 text-xs font-medium text-brand-dark">
            {filteredRecords.length} registros
          </span>
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div>
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-brand" />
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Filtros</h3>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-xs text-muted">Ano<input type="number" min="1900" max="2100" value={year} onChange={(event) => setYear(event.target.value)} placeholder="2026" className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink" /></label>
            <label className="text-xs text-muted">Mês<input type="number" min="1" max="12" value={month} onChange={(event) => setMonth(event.target.value)} placeholder="1–12" className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink" /></label>
            <label className="text-xs text-muted">Dia<input type="number" min="1" max="31" value={day} onChange={(event) => setDay(event.target.value)} placeholder="1–31" className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink" /></label>
            <label className="text-xs text-muted">Sexo<select value={sex} onChange={(event) => setSex(event.target.value)} className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink"><option value="">Todos</option>{SEX_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label className="text-xs text-muted">Idade mínima<input type="number" min="0" max="120" value={ageMin} onChange={(event) => setAgeMin(event.target.value)} placeholder="0" className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink" /></label>
            <label className="text-xs text-muted">Idade máxima<input type="number" min="0" max="120" value={ageMax} onChange={(event) => setAgeMax(event.target.value)} placeholder="120" className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink" /></label>
            <label className="text-xs text-muted col-span-2">Diagnóstico<select value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink"><option value="">Todos os diagnósticos</option>{Array.from(new Set(records.map((record) => record.diagnosis))).sort().map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <button type="button" onClick={resetFilters} className="mt-4 text-xs font-medium text-brand hover:text-brand-dark">Limpar filtros</button>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={15} className="text-brand" />
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Contagem por diagnóstico</h3>
          </div>
          {diagnosisCounts.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-line bg-paper p-9 text-center text-xs text-muted">Nenhum registro corresponde aos filtros selecionados.</div>
          ) : (
            <div className="mt-5 space-y-4">
              {diagnosisCounts.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between gap-3 text-xs"><span className="truncate text-ink/80">{item.label}</span><strong className="text-ink">{item.count}</strong></div>
                  <div className="mt-2 h-2.5 rounded-full bg-line overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-brand to-success" style={{ width: `${(item.count / maxCount) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-paper p-3">
              <div className="flex items-center gap-2 text-[11px] text-muted"><UserRound size={13} /> Pessoas</div>
              <div className="mt-1 text-xl font-semibold text-ink">{filteredRecords.length}</div>
            </div>
            <div className="rounded-xl border border-line bg-paper p-3">
              <div className="flex items-center gap-2 text-[11px] text-muted"><CalendarDays size={13} /> Período</div>
              <div className="mt-1 text-sm font-semibold text-ink">{year || "Todos"}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
