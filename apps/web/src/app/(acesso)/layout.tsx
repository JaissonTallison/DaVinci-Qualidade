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
} from "@/components/icones";

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
      nome: "Segurança do Trabalho",
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

/**
 * Normas internacionais que a plataforma endereça — vitrine informativa do login (exceção de marketing,
 * decidida com o dono do produto). É independente do enum `NORMAS` (as que o módulo de auditoria opera):
 * aqui é o leque de certificações que o sistema cobre, para informação de quem entra.
 */
const REFERENCIAIS = [
  "ISO 9001",
  "ISO 14001",
  "ISO 45001",
  "ISO 27001",
  "ISO 22000",
  "ISO 50001",
  "ISO 27701",
  "ISO 22301",
  "ISO 37001",
  "ISO 37301",
  "ISO 37000",
  "ISO 39001",
  "ISO 41001",
  "ISO 55001",
  "ISO 21001",
  "ISO 28000",
  "ISO 29001",
  "ISO 42001",
  "SOC 1/2/3",
  "HACCP",
];
const NA_FAIXA = 6;
/** "ISO 27001" → ["ISO", "27001"]: sigla em cima, número embaixo; nome sem número (HACCP) numa linha só. */
const partes = (n: string) => {
  const i = n.lastIndexOf(" ");
  if (i < 0) return [n, ""];
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

      <div className="grid w-full lg:grid-cols-[minmax(0,1fr)_minmax(0,31rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,36rem)]">
        <aside className="dv-acesso-escala hidden flex-col px-12 py-8 text-white lg:flex xl:px-20 *:shrink-0">
          <Image
            className="h-auto w-[200px]"
            src="/brand/logo-fundo-escuro.svg"
            alt="DaVinci Qualidade e Certificações"
            width={573}
            height={215}
            priority
          />
          <p className="dv-acesso-titulo mt-10 max-w-xl text-white tela-baixa:mt-6">
            Conformidade hoje.
            <br />
            Um futuro mais
            <br />
            <em>seguro e sustentável.</em>
          </p>
          <p className="mt-4 max-w-md text-lg text-white/85">
            Qualidade, Serviços, Segurança do Trabalho, Meio Ambiente e Agenda
            ESG em um único sistema, com {REFERENCIAIS.length} normas
            internacionais de referência.
          </p>
          <ul className="my-7 flex flex-col gap-3.5 tela-baixa:my-5 tela-baixa:grid tela-baixa:max-w-3xl tela-baixa:grid-cols-2 tela-baixa:gap-x-8 tela-baixa:gap-y-4">
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
                  <p className="max-w-80 text-base text-white/80">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="dv-acesso-vidro mt-auto flex max-w-[45rem] flex-wrap items-center gap-x-6 gap-y-3 px-6 py-5 tela-baixa:gap-x-4 tela-baixa:px-5 tela-baixa:py-4">
            <div className="flex items-center gap-4">
              <Globe aria-hidden size={28} strokeWidth={1.5} />
              <p className="text-md text-white/90">
                <span className="font-semibold text-white">
                  {REFERENCIAIS.length} normas
                </span>{" "}
                internacionais
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
                    className="dv-acesso-norma flex w-16 flex-col tela-baixa:w-14 items-center py-1.5 text-base leading-tight text-white"
                  >
                    <span>{sigla}</span>
                    <span>{numero}</span>
                  </li>
                );
              })}
              {REFERENCIAIS.length > NA_FAIXA && (
                <li
                  title={REFERENCIAIS.slice(NA_FAIXA).join(", ")}
                  className="dv-acesso-norma flex w-16 flex-col tela-baixa:w-14 items-center py-1.5 text-base leading-tight text-white"
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

        <div className="flex items-center justify-center px-4 py-6 sm:px-8 lg:pr-12 lg:pl-0 xl:pr-20">
          <div className="dv-acesso-cartao dv-acesso-escala w-full max-w-[26rem] px-6 py-7 sm:px-9 sm:py-8">
            <Image
              className="mx-auto h-auto w-[160px]"
              src="/brand/logo.svg"
              alt="DaVinci Qualidade e Certificações"
              width={573}
              height={215}
              priority
            />
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
