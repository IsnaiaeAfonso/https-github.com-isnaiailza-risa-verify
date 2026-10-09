"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FolderClock,
  Settings,
  Search,
  Bell,
  ShieldCheck,
  FileCheck2,
  BookOpen,
  LockKeyhole,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

const NAV = [
  {
    href: "/dashboard",
    label: "Painel médico",
    icon: LayoutGrid,
    match: (p: string) => p === "/dashboard",
  },
  {
    href: "/cases",
    label: "Meus casos",
    icon: FolderClock,
    match: (p: string) => p === "/cases",
  },
  {
    href: "/dashboard/clinical",
    label: "Resumo documental",
    icon: FileCheck2,
    match: (p: string) => p.includes("final-summary"),
  },
  {
    href: "/wiki",
    label: "Wiki RISA",
    icon: BookOpen,
    match: (p: string) => p === "/wiki",
  },
  {
    href: "/security",
    label: "Segurança",
    icon: LockKeyhole,
    match: (p: string) => p === "/security",
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    icon: Settings,
    match: (p: string) => p === "/configuracoes",
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="w-14 md:w-60 shrink-0 bg-navy-dark text-white/90 flex flex-col">
        <div className="px-2 py-4 md:px-5 md:py-6">
          <div className="flex items-center gap-2">
            <div className="mx-auto md:mx-0 h-7 w-7 shrink-0 rounded-md bg-brand flex items-center justify-center">
              <ShieldCheck size={15} className="text-white" />
            </div>
            <span className="hidden md:inline text-sm font-semibold tracking-wide text-white">
              RISA
            </span>
          </div>
          <p className="hidden md:block text-[11px] text-white/45 mt-1 leading-snug">
            Verify
          </p>
        </div>

        <nav className="flex-1 px-1.5 md:px-3 space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.match(pathname);
            return (
              <Link
                key={item.label}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                className={`flex items-center justify-center md:justify-start gap-0 md:gap-2.5 rounded-md px-1.5 md:px-3 py-2.5 md:py-2 text-sm transition-colors ${
                  active
                    ? "bg-navy-light text-white border-l-2 border-brand pl-[10px]"
                    : "text-white/55 hover:text-white hover:bg-navy-mid/60 border-l-2 border-transparent pl-[10px]"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block px-5 py-4 border-t border-white/10 text-[11px] text-white/35 leading-relaxed">
          Não realiza diagnóstico, prescrição ou recomendação médica. Dados
          fictícios.
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 border-b border-line bg-panel flex items-center justify-between px-3 sm:px-6">
          <div className="hidden sm:flex items-center gap-2 text-muted max-w-sm w-full">
            <Search size={15} />
            <input
              placeholder="Buscar casos, documentos ou achados..."
              className="focus-ring bg-transparent text-sm text-ink placeholder:text-muted/60 w-full outline-none"
              readOnly
            />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div role="group" aria-label="Idioma / Language" className="inline-flex rounded-md border border-line bg-paper p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setLanguage("pt")}
                aria-pressed={language === "pt"}
                aria-label="Português"
                className={`rounded px-2 py-1 font-medium transition-colors ${language === "pt" ? "bg-brand text-white" : "text-muted hover:text-ink"}`}
              >
                PT
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                aria-pressed={language === "en"}
                aria-label="English"
                className={`rounded px-2 py-1 font-medium transition-colors ${language === "en" ? "bg-brand text-white" : "text-muted hover:text-ink"}`}
              >
                EN
              </button>
            </div>
            <button
              className="focus-ring text-muted hover:text-ink p-1.5 rounded-md"
              aria-label="Notificações"
            >
              <Bell size={17} />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-brand-light text-brand-dark text-xs font-semibold flex items-center justify-center">
                L
              </div>
              <span className="text-sm text-ink/80">Dra. Laura Santos</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-w-0">{children}</div>
      </div>
    </div>
  );
}
