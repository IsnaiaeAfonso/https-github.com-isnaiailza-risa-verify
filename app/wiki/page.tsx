import AppShell from "@/components/AppShell";
import {
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileCheck2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

const sections = [
  {
    title: "Arquitetura da inteligência artificial",
    icon: BrainCircuit,
    items: [
      "Extração de texto",
      "Comparação documental",
      "Detecção de conflitos",
      "Geração de resumo",
      "Revisão humana",
    ],
  },
  {
    title: "Segurança e privacidade",
    icon: LockKeyhole,
    items: [
      "Dados minimizados",
      "Criptografia no armazenamento",
      "Controle de acesso",
      "Registro de auditoria",
      "Limite de tamanho dos arquivos",
    ],
  },
  {
    title: "Operação e governança",
    icon: Database,
    items: [
      "AWS S3 e KMS",
      "Variáveis de ambiente",
      "Logs estruturados",
      "Modelos reconfiguráveis",
      "Avaliação de riscos",
    ],
  },
];

export default function WikiPage() {
  return (
    <AppShell>
      <main className="flex-1 bg-paper">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-brand-light text-brand flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-ink">Wiki do RISA Verify</h1>
              <p className="text-sm text-muted">
                Arquitetura, segurança e decisões do produto
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-brand/20 bg-brand-light/30 p-5">
            <h2 className="text-sm font-semibold text-ink">
              Princípio central
            </h2>
            <p className="text-sm leading-6 text-muted mt-2">
              O RISA Verify organiza evidências e sinaliza pontos de atenção. A IA não
              diagnostica, prescreve, recomenda tratamento ou substitui a
              avaliação profissional.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {sections.map(({ title, icon: Icon, items }) => (
              <section
                key={title}
                className="rounded-2xl border border-line bg-panel p-5 shadow-card"
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-brand" />
                  <h2 className="text-sm font-semibold text-ink">{title}</h2>
                </div>
                <ul className="mt-4 space-y-3">
                  {items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-muted">
                      <CheckCircle2
                        size={14}
                        className="text-success shrink-0 mt-0.5"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <section className="mt-8 rounded-2xl border border-line bg-panel p-5 shadow-card">
            <h2 className="text-base font-semibold text-ink">
              Fluxo de produção recomendado
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-paper p-4">
                <FileCheck2 size={16} className="text-brand" />
                <p className="mt-3 text-sm font-medium text-ink">Envio de documentos</p>
                <p className="text-xs leading-5 text-muted mt-1">
                  Validar o tipo, o tamanho, os metadados e o hash; isolar arquivos não reconhecidos.
                </p>
              </div>
              <div className="rounded-lg bg-paper p-4">
                <BrainCircuit size={16} className="text-brand" />
                <p className="mt-3 text-sm font-medium text-ink">Análise</p>
                <p className="text-xs leading-5 text-muted mt-1">
                  Extrair texto, preservar referências e produzir evidências,
                  não conclusões absolutas.
                </p>
              </div>
              <div className="rounded-lg bg-paper p-4">
                <ShieldCheck size={16} className="text-brand" />
                <p className="mt-3 text-sm font-medium text-ink">Revisão</p>
                <p className="text-xs leading-5 text-muted mt-1">
                  Apresentar achados, conflitos, lacunas e pedir confirmação
                  humana.
                </p>
              </div>
              <div className="rounded-lg bg-paper p-4">
                <Database size={16} className="text-brand" />
                <p className="mt-3 text-sm font-medium text-ink">Atestação</p>
                <p className="text-xs leading-5 text-muted mt-1">
                  Hash do conteúdo, assinatura, auditoria e identificador do
                  serviço.
                </p>
              </div>
            </div>
          </section>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/security"
              className="inline-flex items-center gap-2 bg-brand px-4 py-2.5 rounded-md text-sm font-medium text-white"
            >
              Segurança e configuração
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 border border-line bg-panel px-4 py-2.5 rounded-md text-sm text-ink"
            >
              Voltar ao painel médico
            </Link>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
