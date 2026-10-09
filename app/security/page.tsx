import AppShell from "@/components/AppShell";
import {
  CheckCircle2,
  Cloud,
  Database,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

const controls = [
  {
    title: "Armazenamento",
    detail:
      "S3 com criptografia no servidor. O cliente nunca recebe credenciais da AWS.",
    icon: Cloud,
  },
  {
    title: "Chaves",
    detail:
      "Use KMS e chaves geradas para cada ambiente. Nunca inclua chaves privadas no código.",
    icon: KeyRound,
  },
  {
    title: "Integridade",
    detail: "Calcula o SHA-256 no servidor e armazena o hash junto ao arquivo.",
    icon: Fingerprint,
  },
  {
    title: "Acesso",
    detail: "Use permissões mínimas no IAM, políticas para o bucket e registros de acesso.",
    icon: ShieldCheck,
  },
  {
    title: "Dados",
    detail:
      "Os arquivos são identificados por um código interno e não são publicados diretamente.",
    icon: LockKeyhole,
  },
  {
    title: "Auditoria",
    detail:
      "Registre quem realizou a ação, quando, o que foi feito, o hash e o resultado em logs estruturados.",
    icon: Database,
  },
];

export default function SecurityPage() {
  return (
    <AppShell>
      <main className="flex-1 bg-paper">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-brand-light text-brand flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-ink">
                Segurança e arquitetura
              </h1>
              <p className="text-sm text-muted">
                Padrões para armazenamento, criptografia e auditoria
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-brand/20 bg-brand-light/30 p-5">
            <h2 className="text-sm font-semibold text-ink">
              Modelo de confiança
            </h2>
            <p className="text-sm leading-6 text-muted mt-2">
              O cliente envia bytes para a API. A API valida, calcula o hash,
              aplica o tratamento de criptografia e grava no S3. A aplicação
              nunca contém credenciais públicas ou privadas da AWS.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {controls.map(({ title, detail, icon: Icon }) => (
              <section
                key={title}
                className="rounded-2xl border border-line bg-panel p-5 shadow-card"
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-brand" />
                  <h2 className="text-sm font-semibold text-ink">{title}</h2>
                </div>
                <p className="text-xs leading-5 text-muted mt-3">{detail}</p>
              </section>
            ))}
          </div>

          <section className="mt-8 rounded-2xl border border-line bg-panel p-5 shadow-card">
            <h2 className="text-base font-semibold text-ink">
              Configuração principal
            </h2>
            <div className="mt-4 grid gap-3 font-mono text-xs text-muted sm:grid-cols-2">
              <div className="rounded-lg bg-paper p-3">
                AWS_REGION=us-east-1
              </div>
              <div className="rounded-lg bg-paper p-3">
                AWS_S3_BUCKET=seu-bucket
              </div>
              <div className="rounded-lg bg-paper p-3">AWS_S3_PREFIX=iasx</div>
              <div className="rounded-lg bg-paper p-3">
                AWS_KMS_KEY_ID=alias/iasx-data
              </div>
            </div>
            <p className="text-xs leading-5 text-muted mt-4">
              Sem AWS_S3_BUCKET, os arquivos permanecem no armazenamento local e não são enviados para um serviço externo. Não exponha chaves no frontend.
            </p>
          </section>

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber/25 bg-amber-light p-4 text-xs leading-5 text-muted">
            <CheckCircle2 size={17} className="text-amber shrink-0" />
            <p>
              <strong className="text-ink">Limite de produção:</strong> o POC
              atual é local e fictício. Não use o fluxo em ambiente clínico sem
              autenticação, controle de acesso, retenção, políticas de
              privacidade, auditoria e validação regulatória.
            </p>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
