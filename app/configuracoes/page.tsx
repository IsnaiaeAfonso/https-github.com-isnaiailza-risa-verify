"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  DEFAULT_DOCTOR_PREFERENCES,
  getDoctorPreferences,
  saveDoctorPreferences,
  resetDoctorPreferences,
  type DoctorPreferences,
} from "@/lib/doctorPreferences";
import { Mic, ShieldCheck, Stethoscope, FileText, Activity, RotateCcw, Sparkles, Check } from "lucide-react";

type ToggleConfig = {
  key: keyof DoctorPreferences;
  label: string;
  description: string;
  icon: typeof Mic;
};

const TOGGLE_CONFIGS: ToggleConfig[] = [
  {
    key: "showRisaSection",
    label: "Exibir aba RISA",
    description: "Mostra a seção de escuta clínica na revisão do caso.",
    icon: Stethoscope,
  },
  {
    key: "enableRisaAudio",
    label: "Ativar áudio da RISA",
    description: "Permite iniciar a escuta por microfone ou reprodução sintética.",
    icon: Mic,
  },
  {
    key: "showClinicalSummary",
    label: "Resumo documental",
    description: "Exibe o bloco de resumo clínico em telas de apoio ao médico.",
    icon: FileText,
  },
  {
    key: "showRiskCards",
    label: "Indicadores de risco",
    description: "Mostra indicadores de risco e triagem na visão do profissional.",
    icon: ShieldCheck,
  },
  {
    key: "showTimeline",
    label: "Linha do tempo",
    description: "Exibe a sequência de eventos durante a revisão do caso.",
    icon: Activity,
  },
];

export default function ConfiguracoesPage() {
  const [preferences, setPreferences] = useState<DoctorPreferences>(DEFAULT_DOCTOR_PREFERENCES);
  const [saved, setSaved] = useState(false);
  const [patientLink, setPatientLink] = useState("https://risa-verify.vercel.app/patient-upload/CV-DEMO-00123");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPreferences(getDoctorPreferences());
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      setPatientLink(`${origin}/patient-upload/CV-DEMO-00123`);
    }
  }, []);

  useEffect(() => {
    if (!saved) return;
    const timeout = window.setTimeout(() => setSaved(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [saved]);

  const updatePreference = (key: keyof DoctorPreferences, value: boolean) => {
    setPreferences((current) => {
      const next = { ...current, [key]: value };
      saveDoctorPreferences(next);
      return next;
    });
    setSaved(true);
  };

  const resetPreferences = () => {
    const next = resetDoctorPreferences();
    setPreferences(next);
    setSaved(true);
  };

  return (
    <AppShell>
      <main className="flex-1 bg-paper">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark">Personalização</p>
              <h1 className="mt-2 text-2xl font-semibold text-ink">Configurações da clínica</h1>
            </div>
            <button
              type="button"
              onClick={resetPreferences}
              className="inline-flex items-center gap-2 rounded-md border border-line bg-panel px-3 py-2 text-sm font-medium text-ink hover:bg-paper"
            >
              <RotateCcw size={15} />
              Restaurar padrão
            </button>
          </div>

          <div className="mb-6 rounded-xl border border-brand/20 bg-brand-light/40 p-4 text-sm text-brand-dark">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles size={16} />
              Personalize o que é exibido para cada médico e para cada revisão.
            </div>
          </div>

          <div className="space-y-4">
            {TOGGLE_CONFIGS.map(({ key, label, description, icon: Icon }) => {
              const enabled = Boolean(preferences[key]);

              return (
                <div key={key} className="rounded-xl border border-line bg-panel p-4 shadow-card">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                        <Icon size={18} />
                      </span>
                      <div>
                        <h2 className="text-base font-semibold text-ink">{label}</h2>
                        <p className="mt-1 text-sm text-muted">{description}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => updatePreference(key, !enabled)}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${enabled ? "bg-brand" : "bg-muted/20"}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-7" : "translate-x-1"}`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-line bg-panel p-4 shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark">Link do paciente</p>
                <h2 className="mt-2 text-lg font-semibold text-ink">Compartilhamento do upload</h2>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(patientLink);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1800);
                  } catch {
                    setCopied(false);
                  }
                }}
                className="inline-flex items-center justify-center rounded-md border border-line bg-paper px-3 py-2 text-sm font-medium text-ink hover:border-brand/50"
              >
                {copied ? "Copiado" : "Copiar link"}
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-line bg-paper px-3 py-3 text-xs text-muted break-all">
              {patientLink}
            </div>
            <p className="mt-3 text-sm text-muted">
              Use este link para o paciente enviar o documento em segurança dentro do fluxo do RISA Verify.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl border border-line bg-paper p-4">
            <div className="text-sm text-muted">
              {saved ? "Preferências salvas neste navegador." : "As alterações são aplicadas a este perfil médico."}
            </div>
            {saved && <Check size={16} className="text-success-dark" />}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
