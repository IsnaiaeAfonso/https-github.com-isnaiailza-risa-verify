"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, FileSearch2, Fingerprint, Lock, Eye, EyeOff } from "lucide-react";

const FEATURES = [
  { icon: FileSearch2, label: "Revisão estruturada com IA" },
  { icon: ShieldCheck, label: "Evidências rastreáveis" },
  { icon: Fingerprint, label: "Integridade e attestation" },
  { icon: Lock, label: "Segurança e privacidade" },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("risa");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          next: new URLSearchParams(window.location.search).get("next"),
        }),
      });
      const result = await response.json() as { error?: string; redirectTo?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível autenticar.");
      router.replace(result.redirectTo ?? "/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível autenticar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex">
      <section className="hidden lg:flex lg:w-[42%] bg-navy-dark text-white flex-col justify-between px-12 py-14">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-md bg-brand flex items-center justify-center">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <span className="text-lg font-semibold">RISA Verify</span>
          </div>
          <p className="text-sm text-white/50">Portal médico</p>

          <h1 className="text-2xl font-semibold leading-snug mt-14 max-w-sm">
            Inteligência, integridade e confiança na revisão de documentos clínicos.
          </h1>

          <div className="mt-12 space-y-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex items-center gap-3 text-sm text-white/70">
                  <div className="h-8 w-8 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                    <Icon size={15} />
                  </div>
                  {f.label}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-white/35 leading-relaxed max-w-sm">
          Ambiente de demonstração — use somente dados sintéticos. A ferramenta não realiza
          diagnóstico, prescrição ou recomendação médica.
        </p>
      </section>

      <section className="flex-1 flex items-center justify-center bg-paper px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-md bg-brand flex items-center justify-center">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <span className="text-lg font-semibold text-ink">RISA Verify</span>
          </div>

          <h2 className="text-xl font-semibold text-ink">Acesse sua conta</h2>
          <p className="text-xs text-muted mt-1 mb-7">Entre com as credenciais do portal médico.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-ink mb-1.5">
                Usuário
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="focus-ring w-full rounded-md border border-line bg-panel px-3.5 py-2.5 text-sm text-ink"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="focus-ring w-full rounded-md border border-line bg-panel px-3.5 py-2.5 pr-10 text-sm text-ink"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p role="alert" className="rounded-md border border-rust/30 bg-rust/10 px-3 py-2 text-sm text-rust">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="focus-ring w-full bg-brand hover:bg-brand-dark transition-colors text-white text-sm font-medium py-2.5 rounded-md shadow-card"
            >
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
