import type { Metadata } from "next";
import {
  Source_Code_Pro,
  Source_Sans_3,
  Source_Serif_4,
} from "next/font/google";
import "./globals.css";

// Tipografia (docs/04-design/interface.md §4): Sans na interface, Serif nos títulos, Code Pro nos números de registro.
const sans = Source_Sans_3({
  variable: "--dv-fonte-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});
const serif = Source_Serif_4({
  variable: "--dv-fonte-serif",
  subsets: ["latin"],
  weight: ["600"],
});
const mono = Source_Code_Pro({
  variable: "--dv-fonte-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: { default: "DaVinci Qualidade", template: "%s · DaVinci Qualidade" },
  description: "Gestão da qualidade, saúde, segurança e meio ambiente",
  applicationName: "DaVinci Qualidade",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${sans.variable} ${serif.variable} ${mono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
