import type { CSSProperties } from "react";
import Image from "next/image";
import {
  Globe,
  HardHat,
  Leaf,
  ShieldCheck,
  Sprout,
  Users,
  type LucideIcon,
} from "lucide-react";
import { NORMAS } from "@davinci/types";

const AREAS: { icone: LucideIcon; cor: string; nome: string; texto: string }[] =
  [
    {
      icone: ShieldCheck,
      cor: "#3b82f6",
      nome: "Qualidade",
      texto: "Processos padronizados e melhores resultados.",
    },
    {
      icone: Users,
      cor: "#8b6cf6",
      nome: "Serviços",
      texto: "Atendimento e operação integrada e eficiente.",
    },
    {
      icone: HardHat,
      cor: "#f59331",
      nome: "Segurança",
      texto: "Ambientes mais seguros e pessoas protegidas.",
    },
    {
      icone: Leaf,
      cor: "#2fbf71",
      nome: "Meio Ambiente",
      texto: "Operações responsáveis com o planeta.",
    },
    {
      icone: Sprout,
      cor: "#22c3b0",
      nome: "Agenda ESG",
      texto: "Sustentabilidade que gera valor para o negócio.",
    },
  ];

/** Referenciais que o sistema audita, uma vez cada (as edições da mesma norma contam como uma). */
const REFERENCIAIS = [
  ...new Set(
    Object.values(NORMAS)
      .filter((n) => n !== NORMAS.sgi)
      .map((n) => n.split(":")[0] ?? n),
  ),
];
const NA_FAIXA = 4;
/** "ISO/IEC 27001" → ["ISO", "27001"]: sigla em cima, número embaixo. */
const partes = (n: string) => {
  const i = n.lastIndexOf(" ");
  return [n.slice(0, i).replace("/IEC", ""), n.slice(i + 1)];
};

/**
 * Telas de acesso (entrar, código do 2FA, senha). Foto de fundo com véu marinho e o cartão branco por cima;
 * no computador, o painel da marca à esquerda. Visual próprio, escopado em .dv-acesso (globals.css).
 */
export default function LayoutDeAcesso({ children }: LayoutProps<"/">) {
  return (
    <main
      id="conteudo"
      className="dv-acesso relative isolate flex flex-1 overflow-hidden bg-marinho"
    >
      <Image
        src="/acesso/fundo.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover object-[35%_center]"
      />
      <div aria-hidden className="dv-acesso-veu absolute inset-0 -z-10" />

      <div className="grid w-full lg:grid-cols-[minmax(0,1fr)_minmax(0,36rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,40rem)]">
        <aside className="hidden flex-col px-12 py-8 text-white lg:flex xl:px-20 *:shrink-0">
          <Image
            className="h-auto w-[210px]"
            src="/brand/logo-fundo-escuro.svg"
            alt="DaVinci Qualidade e Certificações"
            width={573}
            height={215}
            priority
          />
          <p className="dv-acesso-titulo mt-10 max-w-xl text-white">
            Conformidade hoje.
            <br />
            Um futuro mais
            <br />
            <em>seguro e sustentável.</em>
          </p>
          <p className="mt-4 max-w-md text-lg text-white/85">
            Qualidade, Serviços, Segurança, Meio Ambiente e Agenda ESG em um
            único sistema, com {REFERENCIAIS.length} normas auditáveis para a
            sua empresa.
          </p>
          <ul className="mt-7 mb-7 flex flex-col gap-3.5">
            {AREAS.map(({ icone: Icone, cor, nome, texto }) => (
              <li key={nome} className="flex items-center gap-5">
                <span
                  className="dv-acesso-icone"
                  style={{ "--cor": cor } as CSSProperties}
                >
                  <Icone aria-hidden size={26} strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-lg font-semibold text-white">{nome}</p>
                  <p className="max-w-80 text-base text-white/80">
                    {texto}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="dv-acesso-vidro mt-auto flex max-w-[45rem] flex-wrap items-center gap-x-6 gap-y-4 px-6 py-5">
            <div className="flex items-center gap-4">
              <Globe aria-hidden size={40} strokeWidth={1.5} />
              <p className="text-md text-white/90">
                <span className="font-semibold text-white">
                  {REFERENCIAIS.length} normas
                </span>{" "}
                ISO e IATF
                <br />
                em uma única plataforma.
              </p>
            </div>
            <ul className="flex flex-wrap gap-2.5" aria-label="Normas">
              {REFERENCIAIS.slice(0, NA_FAIXA).map((n) => {
                const [sigla, numero] = partes(n);
                return (
                  <li
                    key={n}
                    title={n}
                    className="dv-acesso-norma flex w-16 flex-col items-center py-1.5 text-base leading-tight text-white"
                  >
                    <span>{sigla}</span>
                    <span>{numero}</span>
                  </li>
                );
              })}
              {REFERENCIAIS.length > NA_FAIXA && (
                <li
                  title={REFERENCIAIS.slice(NA_FAIXA).join(", ")}
                  className="dv-acesso-norma flex w-16 flex-col items-center py-1.5 text-base leading-tight text-white"
                >
                  <span>+{REFERENCIAIS.length - NA_FAIXA}</span>
                  <span className="text-sm">normas</span>
                </li>
              )}
            </ul>
          </div>
          <p className="mt-5 text-sm tracking-[0.3em] text-white/55 uppercase">
            Pessoas · Processos · Conformidade · Sustentabilidade
          </p>
        </aside>

        <div className="flex items-center justify-center px-4 py-8 sm:px-8 lg:py-10 lg:pr-12 lg:pl-0 xl:pr-20">
          <div className="dv-acesso-cartao w-full max-w-[33rem] px-6 py-8 sm:px-12 sm:py-12">
            <Image
              className="h-auto w-[210px]"
              src="/brand/logo.svg"
              alt="DaVinci Qualidade e Certificações"
              width={573}
              height={215}
              priority
            />
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
