import Image from "next/image";
import {
  HardHat,
  Leaf,
  ShieldCheck,
  Sprout,
  Users,
  type LucideIcon,
} from "@/components/icones";
import { NORMAS } from "@davinci/types";
import { sobretitulo } from "@/lib/estilos";

const AREAS: { icone: LucideIcon; nome: string; texto: string }[] = [
  {
    icone: ShieldCheck,
    nome: "Qualidade",
    texto: "Processos padronizados e melhores resultados.",
  },
  {
    icone: Users,
    nome: "Serviços",
    texto: "Atendimento e operação integrada e eficiente.",
  },
  {
    icone: HardHat,
    nome: "Segurança do Trabalho",
    texto: "Ambientes mais seguros e pessoas protegidas.",
  },
  {
    icone: Leaf,
    nome: "Meio Ambiente",
    texto: "Operações responsáveis com o planeta.",
  },
  {
    icone: Sprout,
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
 * Telas de acesso (entrar, código do 2FA, senha): no computador, o painel da marca em azul sólido à esquerda
 * (a mesma cor do menu lateral); à direita, o cartão branco do design system sobre o fundo da página.
 */
export default function LayoutDeAcesso({ children }: LayoutProps<"/">) {
  return (
    <main id="conteudo" className="dv-acesso flex flex-1 bg-fundo">
      <div className="grid w-full lg:grid-cols-[minmax(0,1fr)_minmax(0,31rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,36rem)]">
        <aside className="dv-acesso-escala hidden flex-col bg-menu px-12 py-10 text-primaria-texto lg:flex xl:px-20 *:shrink-0">
          <Image
            className="h-auto w-[180px]"
            src="/brand/logo-fundo-escuro.svg"
            alt="DaVinci Qualidade e Certificações"
            width={573}
            height={215}
            priority
          />
          <h2 className="mt-12 max-w-xl text-2xl font-semibold tela-baixa:mt-8">
            Gestão integrada da qualidade, segurança, meio ambiente e ESG
          </h2>
          <p className="mt-3 max-w-md text-base text-primaria-texto/75">
            Um único sistema para registrar, tratar e provar a conformidade, com{" "}
            {REFERENCIAIS.length} normas auditáveis.
          </p>
          <ul className="mt-10 flex max-w-xl flex-col divide-y divide-primaria-texto/10 border-y border-primaria-texto/10 tela-baixa:mt-6">
            {AREAS.map(({ icone: Icone, nome, texto }) => (
              <li key={nome} className="flex items-start gap-3 py-3.5">
                <Icone
                  aria-hidden
                  size={18}
                  strokeWidth={1.75}
                  className="mt-0.5 shrink-0 text-ouro-claro"
                />
                <div>
                  <p className="text-base font-medium">{nome}</p>
                  <p className="text-sm text-primaria-texto/70">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-8">
            <p className={`${sobretitulo} text-primaria-texto/60`}>
              Normas auditáveis
            </p>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Normas">
              {REFERENCIAIS.slice(0, NA_FAIXA).map((n) => {
                const [sigla, numero] = partes(n);
                return (
                  <li
                    key={n}
                    title={n}
                    className="inline-flex h-6 items-center rounded-xs border border-primaria-texto/25 px-2 text-xs font-medium"
                  >
                    {sigla} {numero}
                  </li>
                );
              })}
              {REFERENCIAIS.length > NA_FAIXA && (
                <li
                  title={REFERENCIAIS.slice(NA_FAIXA).join(", ")}
                  className="inline-flex h-6 items-center rounded-xs border border-primaria-texto/25 px-2 text-xs font-medium"
                >
                  +{REFERENCIAIS.length - NA_FAIXA} normas
                </li>
              )}
            </ul>
          </div>
        </aside>

        <div className="flex items-center justify-center px-4 py-8 sm:px-8">
          <div className="dv-acesso-cartao dv-acesso-escala w-full max-w-[26rem] px-6 py-7 sm:px-8 sm:py-8">
            <Image
              className="mx-auto h-auto w-[150px]"
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
