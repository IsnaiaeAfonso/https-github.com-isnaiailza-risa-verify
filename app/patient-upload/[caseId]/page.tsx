"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Clipboard,
  FileText,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function LegacyPatientUploadPage() {
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const [file, setFile] = useState<File | null>(null);
  const [patientCpf, setPatientCpf] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [consent, setConsent] = useState(false);
  const [doctors, setDoctors] = useState<string[]>([]);
  const [uploadToken, setUploadToken] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";
  const uploadUrl = `${appUrl}/patient-upload/${caseId}${uploadToken ? `?token=${encodeURIComponent(uploadToken)}` : ""}`;

  useEffect(() => {
    fetch(`/api/patient-upload?caseId=${encodeURIComponent(caseId)}`)
      .then(async (response) => {
        const payload = (await response.json()) as { doctors?: string[]; uploadToken?: string };
        if (response.ok) {
          setDoctors(payload.doctors ?? []);
          setUploadToken(payload.uploadToken ?? "");
        }
      })
      .catch(() => setDoctors([]));
  }, [caseId]);

  const whatsappUrl = useMemo(() => {
    if (!whatsappNumber) return "";
    const text = encodeURIComponent(`Olá, envie o exame PDF deste caso pelo RISA Verify: ${uploadUrl}`);
    return `https://wa.me/${whatsappNumber}?text=${text}`;
  }, [caseId, uploadUrl, whatsappNumber]);

  async function uploadFile() {
    const cpfDigits = patientCpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11 || !/^\d+$/.test(cpfDigits)) {
      setStatus("error");
      setMessage("Informe um CPF válido com 11 dígitos.");
      return;
    }
    if (!file || file.type !== "application/pdf") {
      setStatus("error");
      setMessage("Selecione um arquivo PDF válido.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setStatus("error");
      setMessage("O PDF deve ser menor que 25 MB.");
      return;
    }
    if (!doctorName) {
      setStatus("error");
      setMessage("Selecione o médico responsável pela revisão.");
      return;
    }
    if (!consent) {
      setStatus("error");
      setMessage("Você deve confirmar o consentimento para enviar o exame.");
      return;
    }

    setStatus("sending");
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("caseId", caseId);
    formData.append("patientCpf", cpfDigits);
    formData.append("doctorName", doctorName);
    formData.append("consent", String(consent));
    formData.append("source", "patient-whatsapp-link");
    formData.append("token", uploadToken);

    try {
      const response = await fetch("/api/patient-upload", { method: "POST", body: formData });
      const payload = (await response.json()) as { error?: string; sha256?: string };
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível enviar o exame.");
      setStatus("sent");
      setMessage(`PDF enviado com sucesso. Hash SHA-256: ${payload.sha256}`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar o exame.");
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(uploadUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-12">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-line bg-panel shadow-card">
        <div className="bg-navy-dark px-6 py-8 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/50">RISA Verify</p>
              <h1 className="text-xl font-semibold">Envio seguro do exame</h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Caso: <strong>{caseId}</strong>. O arquivo é validado, associado ao paciente e enviado para a revisão.
          </p>
        </div>

        <div className="space-y-6 p-6">
          <div className="space-y-4 rounded-2xl border border-line bg-paper p-4">
            <div className="flex items-center gap-3">
              <UserRound className="shrink-0 text-brand-dark" size={22} />
              <div>
                <p className="text-sm font-medium text-ink">Identificação do paciente</p>
                <p className="text-xs text-muted">O CPF é convertido em hash no servidor e nunca é armazenado como texto.</p>
              </div>
            </div>
            <label className="block text-xs font-medium text-ink" htmlFor="patient-cpf">CPF do paciente</label>
            <input
              id="patient-cpf"
              inputMode="numeric"
              autoComplete="off"
              maxLength={14}
              value={patientCpf}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
                setPatientCpf(digits.length > 9
                  ? `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
                  : digits);
              }}
              placeholder="000.000.000-00"
              className="focus-ring w-full rounded-md border border-line bg-panel px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70"
              required
            />

            <label className="block text-xs font-medium text-ink" htmlFor="doctor-name">Médico responsável</label>
            {doctors.length > 0 ? (
              <select
                id="doctor-name"
                value={doctorName}
                onChange={(event) => setDoctorName(event.target.value)}
                className="focus-ring w-full rounded-md border border-line bg-panel px-3.5 py-2.5 text-sm text-ink"
                required
              >
                <option value="">Selecione o médico</option>
                {doctors.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            ) : (
              <div className="rounded-md border border-amber/40 bg-amber/10 px-3 py-2.5 text-xs text-amber">
                <Stethoscope className="mr-1 inline" size={14} />
                Configure PATIENT_UPLOAD_DOCTOR_NAMES para disponibilizar o médico.
              </div>
            )}

            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-panel p-3 text-xs leading-relaxed text-muted">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 accent-brand" required />
              <span>Confirmo que o paciente autorizou o envio do exame ao médico selecionado para revisão clínica.</span>
            </label>
          </div>

          <div className="rounded-2xl border border-line bg-paper p-4">
            <div className="flex items-center gap-3">
              <FileText className="shrink-0 text-brand-dark" size={22} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">Anexe o exame PDF</p>
                <p className="text-xs text-muted">Até 25 MB · somente arquivos PDF</p>
              </div>
            </div>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-panel px-5 py-8 text-center transition hover:border-brand/60">
              <ShieldCheck className="text-brand-dark" size={27} />
              <span className="mt-3 text-sm font-medium text-ink">Selecione o PDF</span>
              <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setStatus("idle");
                setMessage("");
              }} />
            </label>
            {file && (
              <div className="mt-3 flex items-center gap-3 rounded-lg bg-panel px-3 py-2.5">
                <FileText size={16} className="shrink-0 text-brand-dark" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{file.name}</p>
                  <p className="text-xs text-muted">{formatSize(file.size)}</p>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={uploadFile}
            disabled={!file || !patientCpf || !doctorName || !consent || status === "sending"}
            className="w-full rounded-md bg-brand px-4 py-3 text-sm font-medium text-white shadow-card hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "sending" ? "Enviando…" : "Enviar exame ao RISA"}
          </button>

          {message && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${status === "sent" ? "border-success/40 bg-success/10 text-success" : "border-rust/40 bg-rust/10 text-rust"}`}>
              {status === "sent" && <CheckCircle2 className="mr-2 inline" size={16} />}
              {message}
            </div>
          )}

          <div className="rounded-2xl border border-line bg-paper p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-ink">
              <MessageCircle className="text-brand-dark" size={18} />
              Enviar pelo WhatsApp
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">O paciente pode abrir este link pelo WhatsApp, identificar-se no formulário e enviar o exame.</p>
            {whatsappNumber ? (
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-4 block rounded-md bg-[#25D366] px-4 py-2.5 text-center text-sm font-semibold text-white">Abrir conversa no WhatsApp</a>
            ) : (
              <p className="mt-4 rounded-md bg-amber/10 px-3 py-2 text-xs text-amber">Configure NEXT_PUBLIC_WHATSAPP_NUMBER para ativar o botão do WhatsApp.</p>
            )}
          </div>

          <div className="rounded-xl border border-line bg-paper p-4">
            <p className="text-xs font-medium text-ink">Link do envio público</p>
            <p className="mt-1 break-all text-xs text-muted">{uploadUrl}</p>
            <button type="button" onClick={copyLink} className="mt-3 inline-flex items-center gap-2 rounded-md border border-line bg-panel px-3 py-2 text-xs font-medium text-ink hover:border-brand/50">
              <Clipboard size={14} /> {copied ? "Copiado" : "Copiar link"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function PatientUploadPage() {
  const [consentState, setConsentState] = useState<"pending" | "accepted" | "cancelled" | "error">("pending");
  const [consentId, setConsentId] = useState("");
  const [patientCpf, setPatientCpf] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctors, setDoctors] = useState<string[]>([]);
  const [publicOrigin, setPublicOrigin] = useState(process.env.NEXT_PUBLIC_APP_URL ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const patientCpfDigits = patientCpf.replace(/\D/g, "");
  const patientCpfValid = patientCpfDigits.length === 11 && /^\d+$/.test(patientCpfDigits);
  const uploadUrl = `${publicOrigin || "https://seu-dominio-publico"}/patient-upload/CV-DEMO-00123`;

  function selectPdf(selectedFile: File | undefined) {
    if (!selectedFile) return;
    const isPdf = selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFile(null);
      setStatus("error");
      setMessage("Selecione um arquivo PDF.");
      return;
    }
    if (selectedFile.size > 25 * 1024 * 1024) {
      setFile(null);
      setStatus("error");
      setMessage("O PDF deve ter no máximo 25 MB.");
      return;
    }
    setFile(selectedFile);
    setStatus("idle");
    setMessage("");
  }

  function formatFileSize(bytes: number) {
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  useEffect(() => {
    setPublicOrigin(window.location.origin);
    fetch("/api/patient-upload")
      .then(async (response) => {
        const payload = await response.json() as { doctors?: string[] };
        if (response.ok) setDoctors(payload.doctors ?? []);
      })
      .catch(() => setDoctors([]));
    const stored = window.localStorage.getItem("iasx-demo-consent");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { consentId?: string; status?: string; doctorName?: string };
      if (parsed.doctorName) setDoctorName(parsed.doctorName);
      if (parsed.status === "accepted" && parsed.consentId) {
        setConsentId(parsed.consentId);
        setConsentState("accepted");
      }
      if (parsed.status === "cancelled") setConsentState("cancelled");
    } catch {
      window.localStorage.removeItem("iasx-demo-consent");
    }
  }, []);

  async function registerConsent(action: "ACCEPTED" | "CANCELLED") {
    if (!patientCpfValid && action === "ACCEPTED") {
      setConsentState("error");
      setMessage("Informe um CPF fictício válido com 11 dígitos para identificar o paciente.");
      return;
    }
    if (!doctorName && action === "ACCEPTED") {
      setConsentState("error");
      setMessage("Selecione o médico responsável antes de continuar.");
      return;
    }

    try {
      const response = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: "CV-DEMO-00123", action }),
      });
      const payload = await response.json() as { consentId?: string; error?: string };
      if (!response.ok || !payload.consentId) throw new Error(payload.error ?? "Não foi possível registrar o consentimento.");
      window.localStorage.setItem("iasx-demo-consent", JSON.stringify({ consentId: payload.consentId, status: action === "ACCEPTED" ? "accepted" : "cancelled", doctorName }));
      setConsentId(payload.consentId);
      setConsentState(action === "ACCEPTED" ? "accepted" : "cancelled");
    } catch (error) {
      setConsentState("error");
      setMessage(error instanceof Error ? error.message : "Não foi possível registrar o consentimento.");
    }
  }

  async function uploadFile() {
    if (!file || !consentId || consentState !== "accepted" || !doctorName) {
      setStatus("error");
      setMessage("Selecione o médico responsável antes de enviar o PDF.");
      return;
    }
    setStatus("sending");
    const data = new FormData();
    data.append("file", file);
    data.append("caseId", "CV-DEMO-00123");
    data.append("consentId", consentId);
    data.append("termsVersion", "MVP-DEMO-2026-10");
    data.append("source", "patient-demo-link");
    data.append("doctorName", doctorName);
    try {
      const response = await fetch("/api/patient-upload", { method: "POST", body: data });
      const payload = await response.json() as { error?: string; queueStatus?: string };
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível enviar o documento.");
      if (payload.queueStatus && payload.queueStatus !== "stored") {
        throw new Error("O PDF não foi armazenado. Tente novamente.");
      }
      setStatus("sent");
      setMessage(`${file.name} enviado ao IASX com sucesso.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar o documento.");
    }
  }

  if (consentState === "cancelled") {
    return (
      <main className="min-h-screen bg-paper px-4 py-12">
        <section className="mx-auto max-w-2xl rounded-3xl border border-line bg-panel p-8 shadow-card">
          <h1 className="text-2xl font-semibold text-ink">Compartilhamento cancelado</h1>
          <p className="mt-3 text-sm leading-6 text-muted">Nenhum documento foi enviado. Você pode fechar esta janela.</p>
          <button type="button" onClick={() => window.close()} className="mt-6 rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white">FECHAR</button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-8 sm:px-6">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-line bg-panel shadow-card">
        <div className="bg-navy-dark px-7 py-9 text-white sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">RISA Verify</p>
          <h1 className="mt-2 text-2xl font-semibold">Compartilhamento de documentos clínicos</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">Caso fictício: CV-DEMO-00123. Esta experiência usa apenas dados de demonstração.</p>
        </div>
        <div className="p-6 sm:p-8">
          {consentState === "accepted" ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-success/30 bg-success/10 p-5">
                <h2 className="text-lg font-semibold text-ink">Autorização registrada</h2>
                <p className="mt-2 text-sm text-muted">Médico responsável: {doctorName || "não selecionado"}. Consentimento: {consentId}.</p>
              </div>
              <label className="block text-sm font-medium text-ink" htmlFor="upload-doctor-name">
                Médico responsável
                <select
                  id="upload-doctor-name"
                  value={doctorName}
                  onChange={(event) => {
                    setDoctorName(event.target.value);
                    const stored = window.localStorage.getItem("iasx-demo-consent");
                    if (stored) {
                      const parsed = JSON.parse(stored) as { consentId?: string; status?: string };
                      window.localStorage.setItem("iasx-demo-consent", JSON.stringify({ ...parsed, doctorName: event.target.value }));
                    }
                    setMessage("");
                  }}
                  className="focus-ring mt-2 w-full rounded-md border border-line bg-panel px-3.5 py-2.5 text-sm text-ink"
                  required
                >
                  <option value="">Selecione o médico</option>
                  {doctors.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
              <div>
                <p className="block text-sm font-medium text-ink">Anexe o PDF</p>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="mt-2 block w-full cursor-pointer rounded-md border border-line bg-panel px-3 py-3 text-sm text-ink file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                  onChange={(event) => selectPdf(event.target.files?.[0])}
                />
                {file && (
                  <div className="mt-2 flex items-center gap-3 rounded-md border border-line bg-panel px-3 py-2.5">
                    <FileText className="shrink-0 text-brand-dark" size={18} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">{file.name}</p>
                      <p className="text-xs text-muted">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Remover PDF selecionado"
                      onClick={() => {
                        setFile(null);
                        setStatus("idle");
                        setMessage("");
                        const input = document.querySelector<HTMLInputElement>('input[type="file"]');
                        if (input) input.value = "";
                      }}
                      className="rounded-md px-2 py-1 text-sm text-muted hover:bg-paper hover:text-ink"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>
              <button type="button" onClick={uploadFile} disabled={!file || !doctorName || status === "sending"} className="rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">ENVIAR DOCUMENTOS</button>
              {message && <p className="rounded-xl bg-brand-light/50 px-4 py-3 text-sm text-ink">{message}</p>}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border border-line bg-paper p-5">
                <p className="text-sm font-semibold text-ink">Identificação do paciente</p>
                <label className="mt-4 block text-xs font-medium text-ink" htmlFor="patient-cpf">CPF do paciente</label>
                <input
                  id="patient-cpf"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={14}
                  value={patientCpf}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
                    setPatientCpf(digits.length > 9
                      ? `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
                      : digits);
                    setMessage("");
                  }}
                  placeholder="000.000.000-00"
                  className="focus-ring mt-2 w-full rounded-md border border-line bg-panel px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70"
                  required
                />
                <p className="mt-2 text-xs leading-relaxed text-muted">Use apenas um CPF fictício de demonstração. O valor permanece no navegador e não é enviado ao servidor.</p>
                {patientCpfDigits.length === 11 && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-line bg-panel p-4"><p className="text-xs text-muted">Paciente</p><p className="mt-1 text-sm font-semibold">Paciente Demonstrativo</p></div>
                    <div className="rounded-lg border border-line bg-panel p-4"><p className="text-xs text-muted">Profissional</p><p className="mt-1 text-sm font-semibold">{doctorName || "Selecione abaixo"}</p></div>
                  </div>
                )}
                <label className="mt-4 block text-xs font-medium text-ink" htmlFor="doctor-name">Médico responsável</label>
                <select
                  id="doctor-name"
                  value={doctorName}
                  onChange={(event) => {
                    setDoctorName(event.target.value);
                    setMessage("");
                  }}
                  className="focus-ring mt-2 w-full rounded-md border border-line bg-panel px-3.5 py-2.5 text-sm text-ink"
                  required
                >
                  <option value="">{doctors.length ? "Selecione o médico" : "Lista de médicos indisponível"}</option>
                  {doctors.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div className="rounded-2xl border border-brand/30 bg-brand-light/40 p-5">
                <p className="text-sm font-semibold text-ink">É necessário apenas o aceite explícito</p>
                <p className="mt-2 text-sm leading-6 text-muted">Esta experiência não coleta CPF, endereço, telefone, e-mail ou qualquer dado pessoal. Os dados apresentados são fictícios.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href="/terms" className="text-sm font-semibold text-brand underline">Termos</a>
                  <a href="/privacy" className="text-sm font-semibold text-brand underline">Privacidade</a>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => registerConsent("ACCEPTED")} className="rounded-md bg-brand px-5 py-3.5 text-sm font-semibold text-white">ACEITAR E CONTINUAR</button>
                <button type="button" onClick={() => registerConsent("CANCELLED")} className="rounded-md border border-line bg-panel px-5 py-3.5 text-sm font-semibold text-ink">CANCELAR</button>
              </div>
              {message && <p className="rounded-xl border border-rust/40 bg-rust/10 px-4 py-3 text-sm text-rust">{message}</p>}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
