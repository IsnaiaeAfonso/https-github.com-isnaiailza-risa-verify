"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CircleAlert, FileText, Mic, Pause, Play, RotateCcw, Square, Volume2 } from "lucide-react";
import type { ClinicalCase } from "@/lib/types";
import { useDoctorPreferences } from "@/lib/doctorPreferences";
import { findRisaCaseEvidence, RISA_DEMO_INSIGHTS, RISA_DEMO_UTTERANCES, structureRisaUtterances, type RisaInsight, type RisaUtterance } from "@/lib/risaDemo";
import { RISA_CONFIG } from "@/lib/risaConfig";

type SessionState = "ready" | "confirming" | "active" | "paused" | "ended" | "discarded" | "unavailable";
type SpeechAlternativeLike = { transcript: string; confidence?: number };
type SpeechResultLike = { isFinal: boolean; 0: SpeechAlternativeLike };
type SpeechResultEventLike = { resultIndex: number; results: ArrayLike<SpeechResultLike> };
type SpeechErrorEventLike = { error: string };
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechResultEventLike) => void) | null;
  onerror: ((event: SpeechErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechWindow = Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `00:${minutes}:${seconds}`;
}

export default function RisaClinicalListening({ clinicalCase }: { clinicalCase: ClinicalCase }) {
  const [sessionState, setSessionState] = useState<SessionState>("ready");
  const [consentAcknowledged, setConsentAcknowledged] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [utterances, setUtterances] = useState<RisaUtterance[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [sessionMode, setSessionMode] = useState<"browser-speech" | "synthetic" | null>(null);
  const [speechError, setSpeechError] = useState("");
  const [editedSummary, setEditedSummary] = useState("");
  const [summaryConfirmed, setSummaryConfirmed] = useState(false);
  const preferences = useDoctorPreferences();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const sessionStartedAtRef = useRef<number | null>(null);
  const shouldListenRef = useRef(false);

  useEffect(() => {
    if (sessionState !== "active") return;
    const timer = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [sessionState]);

  const insights = useMemo(() => {
    if (sessionMode === "synthetic") return RISA_DEMO_INSIGHTS;
    if (sessionMode === "browser-speech") return structureRisaUtterances(utterances);
    return [];
  }, [sessionMode, utterances]);
  const transcriptById = useMemo(() => new Map(utterances.map((utterance) => [utterance.id, utterance])), [utterances]);
  const summaryTemplate = useMemo(() => insights.map((insight) => `- ${insight.title}: ${insight.detail}`).join("\n"), [insights]);
  const syntheticSummaryTemplate = useMemo(() => RISA_DEMO_INSIGHTS.map((insight) => `- ${insight.title}: ${insight.detail}`).join("\n"), []);

  function stopRecognition() {
    shouldListenRef.current = false;
    if (!recognitionRef.current) return;
    recognitionRef.current.onresult = null;
    recognitionRef.current.onerror = null;
    recognitionRef.current.onend = null;
    try { recognitionRef.current.stop(); } catch { /* already stopped */ }
    recognitionRef.current = null;
  }

  useEffect(() => () => stopRecognition(), []);

  function createSpeechRecognition(): SpeechRecognitionLike | null {
    const speechWindow = window as SpeechWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const recognition = new SpeechRecognition();
    recognition.lang = RISA_CONFIG.speechLanguage;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const additions: RisaUtterance[] = [];
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const alternative = result[0];
        if (!result.isFinal || !alternative?.transcript.trim()) continue;
        const confidence = alternative.confidence;
        additions.push({
          id: `risa-live-${Date.now()}-${index}`,
          speaker: "Falante não identificado",
          timestamp: formatElapsed(Math.max(0, Math.floor((Date.now() - (sessionStartedAtRef.current ?? Date.now())) / 1000))),
          text: alternative.transcript.trim(),
          source: "browser-speech",
          confidence: typeof confidence !== "number" ? "Não avaliada" : confidence >= 0.85 ? "Alta" : confidence >= 0.65 ? "Média" : "Baixa",
        });
      }
      if (additions.length) setUtterances((current) => [...current, ...additions].slice(-RISA_CONFIG.maximumTranscriptUtterances));
    };
    recognition.onerror = (event) => {
      shouldListenRef.current = false;
      try { recognition.stop(); } catch { /* browser may already have stopped */ }
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      const messages: Record<string, string> = {
        "not-allowed": "Permissão de microfone negada. Habilite o microfone no navegador e tente novamente.",
        "service-not-allowed": "O navegador não autorizou o serviço de reconhecimento de fala.",
        "audio-capture": "Nenhum microfone disponível foi encontrado.",
        network: "O serviço de fala do navegador não está disponível pela rede.",
      };
      setSpeechError(messages[event.error] ?? `O reconhecimento de fala parou (${event.error}).`);
      setSessionState("paused");
    };
    recognition.onend = () => {
      if (shouldListenRef.current && recognitionRef.current === recognition) {
        try { recognition.start(); } catch { setSessionState("paused"); }
      }
    };
    return recognition;
  }

  function startBrowserSpeech() {
    if (!preferences.enableRisaAudio) {
      setSpeechError("O áudio da RISA está desativado nas configurações do médico.");
      setSessionState("unavailable");
      return;
    }

    const recognition = createSpeechRecognition();
    if (!recognition) {
      setSpeechError("Este navegador não oferece reconhecimento de fala compatível. Você pode usar a demonstração sintética ou abrir em um navegador compatível.");
      setSessionState("unavailable");
      return;
    }
    setSpeechError("");
    setUtterances([]);
    setSessionMode("browser-speech");
    setElapsedSeconds(0);
    setEditedSummary("");
    setSummaryConfirmed(false);
    sessionStartedAtRef.current = Date.now();
    recognitionRef.current = recognition;
    shouldListenRef.current = true;
    try {
      recognition.start();
      setSessionState("active");
    } catch {
      stopRecognition();
      setSpeechError("Não foi possível iniciar o microfone. Confira a permissão e tente novamente.");
      setSessionState("unavailable");
    }
  }

  function startDemo() {
    if (!consentAcknowledged) return;
    if (!preferences.enableRisaAudio) {
      setSpeechError("O áudio da RISA está desativado nas configurações do médico.");
      setSessionState("unavailable");
      return;
    }
    stopRecognition();
    setUtterances(RISA_DEMO_UTTERANCES);
    setSessionMode("synthetic");
    setElapsedSeconds(0);
    setEditedSummary(syntheticSummaryTemplate);
    setSummaryConfirmed(false);
    sessionStartedAtRef.current = Date.now();
    setSessionState("active");
  }

  function endSession() {
    stopRecognition();
    setSessionState("ended");
    const fallbackSummary = sessionMode === "synthetic"
      ? syntheticSummaryTemplate
      : summaryTemplate || "Nenhuma informação estruturada foi identificada. Revise a transcrição manualmente.";
    setEditedSummary((current) => current || fallbackSummary);
  }

  function discardSession() {
    stopRecognition();
    setSessionState("discarded");
    setUtterances([]);
    setSessionMode(null);
    setEditedSummary("");
    setSummaryConfirmed(false);
    setElapsedSeconds(0);
  }

  function pauseSession() {
    stopRecognition();
    setSessionState("paused");
  }

  function resumeSession() {
    if (sessionMode === "browser-speech") {
      const recognition = createSpeechRecognition();
      if (!recognition) {
        setSpeechError("O reconhecimento de fala não está disponível neste navegador.");
        return;
      }
      recognitionRef.current = recognition;
      shouldListenRef.current = true;
      try {
        recognition.start();
        setSpeechError("");
        setSessionState("active");
      } catch {
        shouldListenRef.current = false;
        setSpeechError("Não foi possível retomar o microfone. Confira a permissão do navegador.");
      }
      return;
    }
    setSessionState("active");
  }

  function openConsent(mode: "browser-speech" | "synthetic") {
    setSessionMode(mode);
    setConsentAcknowledged(false);
    setSpeechError("");
    setSessionState("confirming");
  }

  function startSession() {
    if (!consentAcknowledged) return;
    if (sessionMode === "browser-speech") startBrowserSpeech();
    else startDemo();
  }

  if (!preferences.showRisaSection) {
    return null;
  }

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-line bg-panel shadow-card" aria-labelledby="risa-title">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-dark">Assistente do médico</p>
          <h2 id="risa-title" className="mt-1 text-xl font-semibold text-ink">RISA — Escuta Clínica</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Ative a escuta para transcrever no navegador, organizar o que foi dito e relacionar trechos às evidências do caso para sua revisão.</p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${sessionState === "active" && sessionMode === "browser-speech" ? "border-rust/30 bg-rust-light text-rust" : "border-amber/30 bg-amber-light/60 text-amber"}`}>
          <span className={`h-2 w-2 rounded-full ${sessionState === "active" && sessionMode === "browser-speech" ? "bg-rust animate-pulse" : "bg-amber"}`} />
          {sessionState === "active" && sessionMode === "browser-speech" ? "ESCUTA ATIVA" : sessionMode === "synthetic" ? "Demonstração sintética" : "Áudio processado pelo navegador"}
        </span>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-paper px-4 py-3">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-full ${sessionState === "active" ? "bg-rust-light text-rust" : "bg-brand-light text-brand-dark"}`}>
              <Mic size={19} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">
                {sessionState === "active" ? (sessionMode === "synthetic" ? "SIMULAÇÃO ATIVA" : "ESCUTA ATIVA") : sessionState === "paused" ? "ESCUTA PAUSADA" : sessionState === "ended" ? "ESCUTA ENCERRADA" : "Escuta não iniciada"}
              </p>
              <p className="text-xs text-muted">{sessionState === "active" ? (sessionMode === "synthetic" ? "A RISA está exibindo uma conversa sintética." : "A RISA está transcrevendo a fala com o recurso do navegador.") : sessionMode === "synthetic" ? "A demonstração sintética não acessa o microfone." : "O microfone só será ativado após o consentimento e a autorização no navegador."}</p>
            </div>
          </div>
          <span className="font-mono text-base tabular-nums text-ink">{formatElapsed(elapsedSeconds)}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {(sessionState === "ready" || sessionState === "discarded" || sessionState === "unavailable") && (
            <>
              <button type="button" onClick={() => openConsent("browser-speech")} className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
                <Mic size={16} /> INICIAR ESCUTA
              </button>
              <button type="button" onClick={() => openConsent("synthetic")} className="inline-flex items-center gap-2 rounded-md border border-line bg-panel px-4 py-2.5 text-sm font-semibold text-ink hover:bg-paper">
                USAR DEMONSTRAÇÃO SINTÉTICA
              </button>
            </>
          )}
          {sessionState === "active" && (
            <>
              <button type="button" onClick={pauseSession} className="inline-flex items-center gap-2 rounded-md border border-line bg-panel px-4 py-2.5 text-sm font-semibold text-ink hover:bg-paper">
                <Pause size={16} /> PAUSAR
              </button>
              <button type="button" onClick={endSession} className="inline-flex items-center gap-2 rounded-md bg-rust px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                <Square size={14} /> ENCERRAR ESCUTA
              </button>
            </>
          )}
          {sessionState === "paused" && (
            <>
              <button type="button" onClick={resumeSession} className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
                <Play size={16} /> RETOMAR
              </button>
              <button type="button" onClick={endSession} className="inline-flex items-center gap-2 rounded-md bg-rust px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                <Square size={14} /> ENCERRAR ESCUTA
              </button>
            </>
          )}
          {sessionState === "ended" && !summaryConfirmed && (
            <button type="button" onClick={discardSession} className="inline-flex items-center gap-2 rounded-md border border-line bg-panel px-4 py-2.5 text-sm font-semibold text-ink hover:bg-paper">
              <RotateCcw size={15} /> DESCARTAR SESSÃO
            </button>
          )}
        </div>

        <div className="rounded-lg border border-brand/20 bg-brand-light/30 px-4 py-3 text-xs leading-5 text-muted">
          <strong className="text-brand-dark">Privacidade:</strong> {RISA_CONFIG.audioRetentionPolicy} {RISA_CONFIG.transcriptRetentionPolicy} A transcrição pode ser processada pelo navegador ou pelo fornecedor do serviço de fala e não é enviada ao servidor do RISA Verify nesta versão. Não use dados reais sem aprovação institucional.
        </div>

        {speechError && <p role="alert" className="rounded-md border border-rust/30 bg-rust-light px-3 py-2.5 text-sm text-rust">{speechError}</p>}

        {(sessionState === "active" || sessionState === "paused" || sessionState === "ended") && (
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">Transcrição {sessionMode === "synthetic" ? "sintética" : "da consulta"}</h3>
                <span className="text-xs text-muted">{sessionMode === "synthetic" ? "Fonte: fixture de demonstração" : "Fonte: reconhecimento de fala do navegador"}</span>
              </div>
              <div className="max-h-[25rem] space-y-2 overflow-y-auto rounded-lg border border-line bg-paper p-3" aria-live="polite">
                {utterances.map((utterance) => (
                  <article key={utterance.id} className="rounded-md border border-line bg-panel px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-brand-dark">{utterance.speaker}</span>
                      <span className="font-mono text-xs text-muted">{utterance.timestamp}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-5 text-ink">“{utterance.text}”</p>
                    <p className="mt-1 text-[11px] text-muted">Confiança da transcrição: {utterance.confidence === "Não avaliada" ? "não avaliada (texto sintético)" : utterance.confidence} · falante não verificado automaticamente</p>
                  </article>
                ))}
                {utterances.length === 0 && <p className="px-2 py-5 text-sm text-muted">Aguardando fala. O reconhecimento de fala pode retornar trechos conforme o navegador processa o áudio.</p>}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">Informações para revisão</h3>
                <div className="mt-3 space-y-2.5">
                  {insights.map((insight) => {
                    const sourceUtterances = insight.utteranceIds.map((id) => transcriptById.get(id)).filter((item) => item !== undefined);
                    const caseReferences = findRisaCaseEvidence(clinicalCase, insight);
                    return (
                      <article key={insight.id} className="rounded-lg border border-line bg-panel px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          {insight.kind === "Ponto para revisão" ? <CircleAlert className="mt-0.5 shrink-0 text-amber" size={16} /> : <FileText className="mt-0.5 shrink-0 text-brand-dark" size={16} />}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-ink">{insight.title}</p>
                            <span className="mt-1 inline-flex rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] text-muted">{insight.kind}</span>
                            <p className="mt-2 text-xs leading-5 text-muted">{insight.detail}</p>
                            <div className="mt-3 border-t border-line pt-2.5">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Evidência da {sessionMode === "synthetic" ? "conversa sintética" : "transcrição do navegador"}</p>
                              {sourceUtterances.map((utterance) => (
                                <div key={utterance.id} className="mt-2 rounded-md bg-paper px-2.5 py-2">
                                  <p className="font-mono text-[11px] text-brand-dark">{utterance.speaker} · {utterance.timestamp}</p>
                                  <p className="mt-1 text-xs leading-5 text-ink">“{utterance.text}”</p>
                                </div>
                              ))}
                            </div>
                            {caseReferences.length > 0 && (
                              <div className="mt-3 border-t border-line pt-2.5">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Correspondência literal no caso — verificar equivalência</p>
                                {caseReferences.map((reference, index) => (
                                  <div key={`${reference.docName}-${reference.page}-${index}`} className="mt-2 rounded-md border border-line bg-panel px-2.5 py-2">
                                    <p className="text-[11px] font-medium text-brand-dark">{reference.docName} · página {reference.page}</p>
                                    <p className="mt-1 text-xs leading-5 text-ink">“{reference.excerpt}”</p>
                                    <p className="mt-1 text-[10px] text-muted">Correspondência de texto não significa equivalência clínica nem causalidade.</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted"><Volume2 size={13} /> Não é possível reproduzir este trecho: o áudio não é armazenado pelo RISA Verify.</div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {sessionState === "ended" && (
          <section className="rounded-lg border border-line bg-paper p-4" aria-labelledby="risa-summary-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 id="risa-summary-title" className="text-sm font-semibold text-ink">Resumo demonstrativo para revisão</h3>
                <p className="mt-1 text-xs text-muted">Tempo {sessionMode === "synthetic" ? "demonstrativo" : "da sessão no navegador"}: {formatElapsed(elapsedSeconds)} · {insights.length} pontos estruturados</p>
              </div>
              {summaryConfirmed && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success-dark"><Check size={14} /> Revisado neste navegador</span>}
            </div>
            {summaryConfirmed ? (
              <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-ink">{editedSummary}</pre>
            ) : (
              <>
                <textarea value={editedSummary || summaryTemplate} onChange={(event) => setEditedSummary(event.target.value)} rows={6} className="focus-ring mt-3 w-full resize-y rounded-md border border-line bg-panel px-3 py-2.5 text-sm leading-6 text-ink" aria-label="Editar resumo demonstrativo" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setSummaryConfirmed(true)} className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"><Check size={15} /> CONFIRMAR RESUMO</button>
                  <button type="button" onClick={() => { setEditedSummary(""); setSessionState("discarded"); }} className="rounded-md border border-line bg-panel px-4 py-2.5 text-sm font-semibold text-ink">DESCARTAR</button>
                </div>
              </>
            )}
          </section>
        )}
      </div>

      {sessionState === "confirming" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="risa-confirm-title">
          <button type="button" aria-label="Fechar confirmação" onClick={() => setSessionState("ready")} className="absolute inset-0 bg-ink/50" />
          <section className="relative w-full max-w-lg rounded-xl border border-line bg-panel p-6 shadow-xl">
            <h3 id="risa-confirm-title" className="text-lg font-semibold text-ink">Escuta clínica</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{sessionMode === "synthetic" ? "A RISA exibirá uma conversa sintética para demonstrar organização e referências." : "A RISA pedirá acesso ao microfone e usará o reconhecimento de fala integrado ao navegador."}</p>
            <p className="mt-3 text-sm leading-6 text-muted">Certifique-se de que o paciente foi informado e autorizou conforme os procedimentos e políticas aplicáveis. A permissão do navegador é uma etapa adicional e não substitui o consentimento do paciente.</p>
            <div className="mt-4 rounded-md border border-amber/30 bg-amber-light/50 p-3 text-xs leading-5 text-amber">
              {sessionMode === "synthetic" ? "Nenhum áudio real será capturado nesta demonstração." : RISA_CONFIG.browserProviderNotice}
            </div>
            <div className="mt-3 grid gap-2 text-xs text-muted">
              <p><strong>Áudio:</strong> {RISA_CONFIG.audioRetentionPolicy}</p>
              <p><strong>Transcrição:</strong> {RISA_CONFIG.transcriptRetentionPolicy}</p>
              <p>Não há envio para treinamento de modelos. Não são carregadas fontes externas nem regras de alerta crítico neste modo.</p>
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-md border border-line bg-paper p-3 text-sm leading-5 text-ink">
              <input type="checkbox" checked={consentAcknowledged} onChange={(event) => setConsentAcknowledged(event.target.checked)} className="mt-0.5 h-4 w-4 accent-brand" />
              <span>Confirmo que o paciente foi informado e autorizou esta sessão conforme as políticas aplicáveis.</span>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setSessionState("ready")} className="rounded-md border border-line bg-panel px-4 py-2.5 text-sm font-semibold text-ink">CANCELAR</button>
              <button type="button" onClick={startSession} disabled={!consentAcknowledged} className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{sessionMode === "synthetic" ? "INICIAR DEMONSTRAÇÃO" : "INICIAR ESCUTA"}</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
