import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// Tipografia (docs/04-design/interface.md §4): IBM Plex Sans na interface e nos títulos; Plex Mono nos números de registro.
const sans = IBM_Plex_Sans({
  variable: "--dv-fonte-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const mono = IBM_Plex_Mono({
  variable: "--dv-fonte-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: { default: "DaVinci Qualidade", template: "%s · DaVinci Qualidade" },
  description: "Gestão da qualidade, saúde, segurança e meio ambiente",
  applicationName: "DaVinci Qualidade",
  // Instalado na tela de início (iOS/Android), abre em tela cheia, sem a interface do navegador.
  appleWebApp: {
    capable: true,
    title: "DaVinci Qualidade",
    statusBarStyle: "default",
  },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#172477",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable} h-full`}>
      <body className="flex min-h-full flex-col lg:h-full lg:overflow-hidden">
        {children}
      </body>
    </html>
  );
}
