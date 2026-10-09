"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  DEMO_POPULATION_RECORDS,
  loadPopulationRecords,
  PopulationRecord,
  PopulationSex,
  savePopulationRecords,
} from "@/lib/populationStore";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Database,
  Filter,
  HeartPulse,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const SEX_OPTIONS: PopulationSex[] = ["Feminino", "Masculino", "Não informado"];

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function PopulationDashboardPage() {
  const [records, setRecords] = useState<PopulationRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [sex, setSex] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newRecord, setNewRecord] = useState({
    age: "",
    sex: "Feminino" as PopulationSex,
    diagnosis: "",
    observedAt: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    setRecords(loadPopulationRecords());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) savePopulationRecords(records);
  }, [hydrated, records]);

  const diagnoses = useMemo(
    () => Array.from(new Set(records.map((record) => record.diagnosis))).sort(),
    [records],
  );

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        const recordDate = record.observedAt.slice(0, 10);
        const [recordYear, recordMonth, recordDay] = recordDate.split("-");
        const age = record.age;
        const ageMatches =
          (ageMin === "" || age >= Number(ageMin)) &&
          (ageMax === "" || age <= Number(ageMax));
        return (
          (year === "" || recordYear === year) &&
          (month === "" || recordMonth === month) &&
          (day === "" || recordDay === day) &&
          ageMatches &&
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

  const total = filteredRecords.length;
  const maxCount = Math.max(...diagnosisCounts.map((item) => item.count), 1);

  function addRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const age = Number(newRecord.age);
    if (!Number.isInteger(age) || age < 0 || age > 120 || !newRecord.diagnosis.trim()) return;

    const record: PopulationRecord = {
      age,
      sex: newRecord.sex,
      diagnosis: newRecord.diagnosis.trim(),
      observedAt: newRecord.observedAt,
    };
    setRecords((current) => [record, ...current]);
    setShowForm(false);
    setNewRecord({
      age: "",
      sex: "Feminino",
      diagnosis: "",
      observedAt: new Date().toISOString().slice(0, 10),
    });
  }

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
    <AppShell>
      <main className="flex-1 bg-paper">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-brand-dark">Estatísticas populacionais</p>
              <h1 className="text-[28px] font-semibold tracking-tight text-ink mt-1">Pessoas por diagnóstico</h1>
              <p className="text-sm text-muted mt-1">
                Apenas idade, sexo, diagnóstico e data de observação são armazenados.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm((value) => !value)}
              className="inline-flex items-center gap-2 bg-brand px-4 py-2.5 rounded-md text-sm font-medium text-white shadow-card hover:bg-brand-dark"
            >
              <Plus size={16} /> Adicionar dados
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-line bg-panel p-4 shadow-card">
              <div className="flex items-center gap-2 text-xs text-muted"><UserRound size={15} /> Pessoas</div>
              <div className="mt-2 text-2xl font-semibold text-ink">{total}</div>
            </div>
            <div className="rounded-2xl border border-line bg-panel p-4 shadow-card">
              <div className="flex items-center gap-2 text-xs text-muted"><Activity size={15} /> Diagnósticos</div>
              <div className="mt-2 text-2xl font-semibold text-ink">{diagnosisCounts.length}</div>
            </div>
            <div className="rounded-2xl border border-line bg-panel p-4 shadow-card">
              <div className="flex items-center gap-2 text-xs text-muted"><ShieldCheck size={15} /> Privacidade</div>
              <div className="mt-2 text-sm font-semibold text-success">Sem identificadores</div>
            </div>
            <div className="rounded-2xl border border-line bg-panel p-4 shadow-card">
              <div className="flex items-center gap-2 text-xs text-muted"><Database size={15} /> Fonte local</div>
              <div className="mt-2 text-sm font-semibold text-ink">{records.length} registros</div>
            </div>
          </div>

          {showForm && (
            <section className="mt-6 rounded-2xl border border-brand/20 bg-panel p-5 shadow-card">
              <div className="flex items-center gap-2">
                <HeartPulse size={17} className="text-brand" />
                <h2 className="text-sm font-semibold text-ink">Novo registro agregado</h2>
              </div>
              <p className="text-xs text-muted mt-1">Não informe nome, documento ou qualquer identificador pessoal.</p>
              <form onSubmit={addRecord} className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <label className="text-xs text-muted">
                  Idade
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={newRecord.age}
                    onChange={(event) => setNewRecord((current) => ({ ...current, age: event.target.value }))}
                    className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink"
                    required
                  />
                </label>
                <label className="text-xs text-muted">
                  Sexo
                  <select
                    value={newRecord.sex}
                    onChange={(event) => setNewRecord((current) => ({ ...current, sex: event.target.value as PopulationSex }))}
                    className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink"
                  >
                    {SEX_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label className="text-xs text-muted md:col-span-2">
                  Diagnóstico
                  <input
                    value={newRecord.diagnosis}
                    onChange={(event) => setNewRecord((current) => ({ ...current, diagnosis: event.target.value }))}
                    placeholder="Ex.: Hipertensão arterial"
                    className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink"
                    required
                  />
                </label>
                <label className="text-xs text-muted">
                  Data de observação
                  <input
                    type="date"
                    value={newRecord.observedAt}
                    onChange={(event) => setNewRecord((current) => ({ ...current, observedAt: event.target.value }))}
                    className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink"
                    required
                  />
                </label>
                <div className="flex gap-2 md:col-span-1">
                  <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 bg-brand px-4 py-2.5 rounded-md text-sm font-medium text-white"><Plus size={15} /> Salvar</button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 rounded-md border border-line bg-paper text-sm text-muted">Cancelar</button>
                </div>
              </form>
            </section>
          )}

          <section className="mt-6 rounded-2xl border border-line bg-panel p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">Filtros de análise</h2>
                <p className="text-xs text-muted mt-1">Consulte por data, idade, sexo e diagnóstico.</p>
              </div>
              <button type="button" onClick={resetFilters} className="text-xs font-medium text-brand hover:text-brand-dark">Limpar filtros</button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs text-muted">Ano<input type="number" min="1900" max="2100" value={year} onChange={(event) => setYear(event.target.value)} placeholder="2026" className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink" /></label>
              <label className="text-xs text-muted">Mês<input type="number" min="1" max="12" value={month} onChange={(event) => setMonth(event.target.value)} placeholder="1–12" className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink" /></label>
              <label className="text-xs text-muted">Dia<input type="number" min="1" max="31" value={day} onChange={(event) => setDay(event.target.value)} placeholder="1–31" className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink" /></label>
              <label className="text-xs text-muted">Sexo
                <select value={sex} onChange={(event) => setSex(event.target.value)} className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink"><option value="">Todos</option>{SEX_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select>
              </label>
              <label className="text-xs text-muted">Idade mínima<input type="number" min="0" max="120" value={ageMin} onChange={(event) => setAgeMin(event.target.value)} placeholder="0" className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink" /></label>
              <label className="text-xs text-muted">Idade máxima<input type="number" min="0" max="120" value={ageMax} onChange={(event) => setAgeMax(event.target.value)} placeholder="120" className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink" /></label>
              <label className="text-xs text-muted sm:col-span-2">Diagnóstico
                <select value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink"><option value="">Todos os diagnósticos</option>{diagnoses.map((item) => <option key={item}>{item}</option>)}</select>
              </label>
            </div>
          </section>

          <section className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-line bg-panel p-5 shadow-card">
              <div className="flex items-center gap-2"><BarChart3 size={17} className="text-brand" /><h2 className="text-sm font-semibold text-ink">Contagem por diagnóstico</h2></div>
              {diagnosisCounts.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-line bg-paper p-10 text-center text-sm text-muted">Nenhum registro corresponde aos filtros.</div>
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
            </div>

            <div className="rounded-2xl border border-line bg-panel p-5 shadow-card">
              <div className="flex items-center gap-2"><CalendarDays size={17} className="text-brand" /><h2 className="text-sm font-semibold text-ink">Registros filtrados</h2></div>
              <div className="mt-4 space-y-3">
                {filteredRecords.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-line bg-paper p-6 text-center text-xs text-muted">Sem registros para exibir.</div>
                ) : filteredRecords.slice(0, 6).map((record, index) => (
                  <div key={`${record.observedAt}-${index}`} className="rounded-lg border border-line bg-paper p-4">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-ink">{record.diagnosis}</p><p className="text-xs text-muted mt-1">{record.age} anos · {record.sex}</p></div><CheckCircle2 size={15} className="text-success" /></div>
                    <p className="text-xs text-muted mt-2">{formatDate(record.observedAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-brand/20 bg-brand-light/30 p-4 text-xs text-muted">
            <Filter size={16} className="text-brand shrink-0" />
            <p>Os filtros são aplicados somente aos campos permitidos: idade, sexo, diagnóstico e data de observação.</p>
            <Link href="/dashboard" className="inline-flex items-center gap-1 font-medium text-brand ml-auto">Voltar ao dashboard <ArrowRight size={13} /></Link>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
