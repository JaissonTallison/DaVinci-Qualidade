import Image from "next/image";
import {
  HardHat,
  Headset,
  Leaf,
  ShieldCheck,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import { NORMAS } from "@davinci/types";

const AREAS: { icone: LucideIcon; nome: string; texto: string }[] = [
  {
    icone: ShieldCheck,
    nome: "Qualidade",
    texto: "Não conformidades, auditorias, inspeções e calibração.",
  },
  {
    icone: Headset,
    nome: "Serviços",
    texto: "Ordens de serviço, contratos, reclamações e satisfação.",
  },
  {
    icone: HardHat,
    nome: "Segurança",
    texto: "PGR, permissões de trabalho, EPIs, ASO e eSocial SST.",
  },
  {
    icone: Leaf,
    nome: "Meio Ambiente",
    texto: "Aspectos, licenças, resíduos e obrigações legais.",
  },
  {
    icone: Sprout,
    nome: "Agenda ESG",
    texto: "Indicadores, inventário de emissões e ODS.",
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
const NA_FAIXA = 5;

/**
 * Telas de acesso (entrar, código do 2FA, senha). No computador, o painel da marca à esquerda;
 * no tablet e no celular, só o formulário com a logo.
 */
export default function LayoutDeAcesso({ children }: LayoutProps<"/">) {
  return (
    <main id="conteudo" className="flex flex-1 bg-fundo">
      <aside className="hidden flex-col bg-marinho px-10 py-10 text-white lg:flex lg:w-[54%] xl:px-14 xl:py-8">
        <Image
          className="h-auto w-[200px]"
          src="/brand/logo-fundo-escuro.svg"
          alt="DaVinci Qualidade e Certificações"
          width={573}
          height={215}
          priority
        />
        <div className="mt-10 grid flex-1 content-start gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,17rem)]">
          <div>
            <p className="font-serif text-3xl text-white">
              Conformidade hoje.
              <br />
              Um futuro mais{" "}
              <span className="text-ouro-claro">seguro e sustentável.</span>
            </p>
            <p className="mt-4 max-w-md text-md text-white/75">
              Qualidade, Serviços, Segurança, Meio Ambiente e Agenda ESG em um
              único sistema.
            </p>
            <ul className="mt-8 flex flex-col gap-5">
              {AREAS.map(({ icone: Icone, nome, texto }) => (
                <li key={nome} className="flex gap-3">
                  <Icone
                    aria-hidden
                    size={18}
                    strokeWidth={1.75}
                    className="mt-0.5 shrink-0 text-ouro-claro"
                  />
                  <div>
                    <p className="text-md font-semibold text-white">{nome}</p>
                    <p className="text-base text-white/70">{texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden flex-col gap-3 xl:flex">
            <Image
              src="/acesso/tecnico.webp"
              alt=""
              width={366}
              height={280}
              className="h-auto w-full rounded-sm"
              priority
            />
            <div className="grid grid-cols-2 gap-3">
              <Image
                src="/acesso/folha.webp"
                alt=""
                width={192}
                height={112}
                className="aspect-[4/3] h-auto w-full rounded-sm object-cover"
              />
              <Image
                src="/acesso/cidade.webp"
                alt=""
                width={256}
                height={116}
                className="aspect-[4/3] h-auto w-full rounded-sm object-cover"
              />
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/15 pt-6">
          <p className="text-base text-white/80">
            <span className="font-semibold text-white">
              {REFERENCIAIS.length} normas
            </span>{" "}
            auditáveis em uma única plataforma
          </p>
          <ul className="flex flex-wrap gap-2" aria-label="Normas">
            {REFERENCIAIS.slice(0, NA_FAIXA).map((n) => (
              <li
                key={n}
                title={n}
                className="rounded-sm border border-white/25 px-2.5 py-1 text-sm text-white/90"
              >
                {n}
              </li>
            ))}
            {REFERENCIAIS.length > NA_FAIXA && (
              <li
                title={REFERENCIAIS.slice(NA_FAIXA).join(", ")}
                className="rounded-sm border border-white/25 px-2.5 py-1 text-sm text-white/90"
              >
                +{REFERENCIAIS.length - NA_FAIXA}
              </li>
            )}
          </ul>
        </div>
        <p className="mt-5 text-xs tracking-[0.2em] text-white/50 uppercase">
          Pessoas · Processos · Conformidade · Sustentabilidade
        </p>
      </aside>

      <div className="flex flex-1 flex-col items-center px-4 py-10 sm:justify-center sm:px-8">
        <div className="w-full max-w-[26rem] rounded-md border border-borda bg-superficie p-6 sm:p-8">
          <Image
            className="h-auto w-[180px]"
            src="/brand/logo.svg"
            alt="DaVinci Qualidade e Certificações"
            width={573}
            height={215}
            priority
          />
          <div className="mt-8">{children}</div>
        </div>
        <p className="mt-6 max-w-[26rem] text-center text-sm text-texto-3 lg:hidden">
          Qualidade, Serviços, Segurança, Meio Ambiente e Agenda ESG ·{" "}
          {REFERENCIAIS.slice(0, 3).join(", ")} e mais {REFERENCIAIS.length - 3}
        </p>
      </div>
    </main>
  );
}
