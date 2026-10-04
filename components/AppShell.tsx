"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, FilePlus2, FolderClock, Settings, Search, Bell, ShieldCheck } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, match: (p: string) => p === "/dashboard" },
  { href: "/cases/new", label: "Novo caso", icon: FilePlus2, match: (p: string) => p === "/cases/new" },
  { href: "/dashboard", label: "Meus casos", icon: FolderClock, match: (p: string) => p.startsWith("/cases/") && p !== "/cases/new" },
  { href: "/configuracoes", label: "Configurações", icon: Settings, match: (p: string) => p === "/configuracoes" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="w-60 shrink-0 bg-navy-dark text-white/90 flex flex-col">
        <div className="px-5 py-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-brand flex items-center justify-center">
              <ShieldCheck size={15} className="text-white" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-white">CliniVerify</span>
          </div>
          <p className="text-[11px] text-white/45 mt-1 leading-snug">Clinical Review</p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.match(pathname);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-navy-light text-white border-l-2 border-brand pl-[10px]"
                    : "text-white/55 hover:text-white hover:bg-navy-mid/60 border-l-2 border-transparent pl-[10px]"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/10 text-[11px] text-white/35 leading-relaxed">
          Não realiza diagnóstico, prescrição ou recomendação médica. Dados fictícios.
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 border-b border-line bg-panel flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-muted max-w-sm w-full">
            <Search size={15} />
            <input
              placeholder="Buscar caso, documento ou achado..."
              className="focus-ring bg-transparent text-sm text-ink placeholder:text-muted/60 w-full outline-none"
              readOnly
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="focus-ring text-muted hover:text-ink p-1.5 rounded-md" aria-label="Notificações">
              <Bell size={17} />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-brand-light text-brand-dark text-xs font-semibold flex items-center justify-center">
                D
              </div>
              <span className="text-sm text-ink/80">Dr. Demo</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-w-0">{children}</div>
      </div>
    </div>
  );
}
