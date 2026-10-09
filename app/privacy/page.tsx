export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-paper px-5 py-12">
      <section className="mx-auto max-w-3xl rounded-3xl border border-line bg-panel p-8 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Política de privacidade</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">Privacidade do ambiente demonstrativo</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          Neste MVP, apenas dados fictícios são utilizados. O ambiente não coleta nome, CPF, endereço, telefone, e-mail ou dados clínicos reais.
        </p>
        <div className="mt-8 space-y-5 text-sm leading-7 text-muted">
          <p>O consentimento é registrado no backend com um identificador único, caso, versão do termo, data e ação.</p>
          <p>Documentos enviados são mantidos apenas para o fluxoPaciente-profissional e podem ser armazenados no AWS conforme a configuração do ambiente.</p>
          <p>O paciente pode cancelar o compartilhamento antes de qualquer envio.</p>
        </div>
      </section>
    </main>
  );
}
