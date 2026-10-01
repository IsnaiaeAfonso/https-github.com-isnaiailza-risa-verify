import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { CaseStoreProvider } from "@/lib/store";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IASX Clinical Review",
  description: "Revisão clínica assistida de documentos, com evidência rastreável e atestação em Solana Devnet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <CaseStoreProvider>
          <div className="flex-1 flex flex-col">{children}</div>
          <footer className="border-t border-line bg-panel">
            <div className="max-w-6xl mx-auto px-6 py-3 text-xs text-muted leading-relaxed">
              O IASX Clinical Review organiza, cruza e sinaliza informações contidas em documentos
              enviados pelo usuário. A ferramenta não realiza diagnóstico, prescrição ou
              recomendação médica, e não substitui o julgamento de um profissional de saúde
              habilitado. Todos os dados exibidos nesta demonstração são fictícios.
            </div>
          </footer>
        </CaseStoreProvider>
      </body>
    </html>
  );
}
