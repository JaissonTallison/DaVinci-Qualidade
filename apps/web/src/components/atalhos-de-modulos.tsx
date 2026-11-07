import Link from "next/link";
import { ArrowRight } from "@/components/icones";

interface AtalhoDeModulo {
  numero: string;
  rotulo: string;
  descricao: string;
  href: string;
  /** Cor cheia do card. */
  cor: string;
  /** Chave da ilustração 3D de fundo (ver SILHUETAS). */
  motivo: keyof typeof SILHUETAS;
  permissao: string;
}

/** Os 5 módulos de navegação, cada um com sua cor, ícone e ilustração 3D própria. Ordem fixa. */
const MODULOS: AtalhoDeModulo[] = [
  {
    numero: "01",
    rotulo: "Qualidade",
    descricao: "Não conformidades, planos de ação, inspeções e melhoria contínua",
    href: "/qualidade/nao-conformidades",
    cor: "#2684e8",
    motivo: "qualidade",
    permissao: "qualidade.ver",
  },
  {
    numero: "02",
    rotulo: "Serviços",
    descricao: "Ordens de serviço, contratos, reclamações e satisfação",
    href: "/servicos/ordens",
    cor: "#7a56ec",
    motivo: "servicos",
    permissao: "servicos.ver",
  },
  {
    numero: "03",
    rotulo: "Segurança do Trabalho",
    descricao: "SST, riscos ocupacionais, EPIs, acidentes e treinamentos",
    href: "/seguranca/acidentes",
    cor: "#ee7f3c",
    motivo: "seguranca",
    permissao: "seguranca.ver",
  },
  {
    numero: "04",
    rotulo: "Meio Ambiente",
    descricao: "Licenças, resíduos, aspectos ambientais e monitoramentos",
    href: "/ambiental/licencas",
    cor: "#2aa15c",
    motivo: "ambiente",
    permissao: "ambiental.ver",
  },
  {
    numero: "05",
    rotulo: "Agenda ESG",
    descricao: "Indicadores, metas e relatórios de sustentabilidade",
    href: "/esg/painel",
    cor: "#149a8b",
    motivo: "esg",
    permissao: "esg.ver",
  },
];

// ── Ilustração 3D de fundo (tom-sobre-tom da cor do card, decisão de design do Início) ──────────────
// Cada motivo é a própria silhueta do tema (traços do Lucide: chave, folha, escudo…), em viewBox 24.
// A profundidade vem da extrusão: várias cópias deslocadas (face escura) + a face de cima (clara).
const SILHUETAS = {
  qualidade: [
    "M6 4h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    "M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z",
  ],
  servicos: [
    "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  ],
  seguranca: [
    "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
  ],
  ambiente: [
    "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z",
  ],
  esg: ["M3.5 21h3V11h-3z", "M10.5 21h3V6h-3z", "M17.5 21h3V13h-3z"],
} as const;

/** Mistura uma cor hex com branco ou preto (0..1), para as faces clara/escura. */
function mistura(hex: string, alvo: "branco" | "preto", qtd: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const canais = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const destino = alvo === "branco" ? 255 : 0;
  const bytes = canais.map((c) =>
    Math.round(c + (destino - c) * qtd)
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${bytes.join("")}`;
}

/** Ilustração de fundo do card (decorativa): a silhueta do tema em contorno fino, discreta no canto. */
function Ilustracao({
  cor,
  motivo,
}: {
  cor: string;
  motivo: keyof typeof SILHUETAS;
}) {
  const traco = mistura(cor, "branco", 0.5);
  const paths = SILHUETAS[motivo];
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke={traco}
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute -right-2.5 -bottom-3.5 -z-10 size-28 opacity-50"
    >
      {paths.map((d, j) => (
        <path key={j} d={d} />
      ))}
    </svg>
  );
}

/** Grade de atalhos por módulo no Início: card de cor cheia com ilustração 3D do tema ao fundo. */
export function AtalhosDeModulos({ permissoes }: { permissoes: string[] }) {
  const visiveis = MODULOS.filter((m) => permissoes.includes(m.permissao));
  if (visiveis.length === 0) return null;
  return (
    <section aria-label="Ir para um módulo">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {visiveis.map((m) => (
          <li key={m.rotulo}>
            <Link
              href={m.href}
              className="group relative isolate flex h-full flex-col overflow-hidden rounded-md p-5 text-primaria-texto shadow-cartao transition hover:brightness-110"
              style={{
                backgroundImage: `linear-gradient(140deg, ${mistura(m.cor, "branco", 0.16)} 0%, ${m.cor} 50%, ${mistura(m.cor, "preto", 0.2)} 100%)`,
              }}
            >
              <Ilustracao cor={m.cor} motivo={m.motivo} />
              <span className="text-sm font-semibold text-primaria-texto/55">
                {m.numero}
              </span>
              <span className="mt-2 text-xl font-semibold leading-tight">
                {m.rotulo}
              </span>
              <span className="mt-1.5 flex-1 text-sm text-primaria-texto/85">
                {m.descricao}
              </span>
              <span className="mt-4 inline-flex h-9 w-fit items-center gap-2 rounded-campo bg-primaria-texto/15 px-4 text-base font-semibold text-primaria-texto transition-colors group-hover:bg-primaria-texto/25">
                Acessar
                <ArrowRight
                  aria-hidden
                  size={16}
                  strokeWidth={2}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
