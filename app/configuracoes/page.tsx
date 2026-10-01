import AppShell from "@/components/AppShell";
import { Settings } from "lucide-react";

export default function ConfiguracoesPage() {
  return (
    <AppShell>
      <main className="flex-1 bg-paper">
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <div className="h-11 w-11 rounded-lg bg-brand-light text-brand-dark flex items-center justify-center mx-auto mb-4">
            <Settings size={20} />
          </div>
          <h1 className="text-lg font-semibold text-ink">Configurações</h1>
          <p className="text-sm text-muted mt-2">
            Preferências de conta, integrações e permissões de equipe chegarão em uma próxima
            versão. Nesta demonstração, o foco é o fluxo de revisão clínica.
          </p>
        </div>
      </main>
    </AppShell>
  );
}
