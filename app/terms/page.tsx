export default function TermsPage() {
  return (
    <main className="min-h-screen bg-paper px-5 py-12">
      <section className="mx-auto max-w-3xl rounded-3xl border border-line bg-panel p-8 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Termo de uso do demonstrador</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">Termo de compartilhamento clínico</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          Este ambiente é uma demonstração MVP com dados fictícios. Não contém dados pessoais reais e não executa diagnóstico, prescrição ou recomendação de tratamento.
        </p>
        <div className="mt-8 space-y-5 text-sm leading-7 text-muted">
          <p>O paciente autoriza o compartilhamento dos documentos associados ao caso demonstrativo para organização, análise e revisão pelo profissional responsável.</p>
          <p>A avaliação permanece sob responsabilidade do profissional de saúde. Os documentos não serão armazenados diretamente em blockchain.</p>
          <p>A tecnologia blockchain poderá ser utilizada somente para registrar uma prova técnica de integridade do processo.</p>
          <p>A utilização deve observar a legislação aplicável, incluindo a LGPD.</p>
        </div>
      </section>
    </main>
  );
}
