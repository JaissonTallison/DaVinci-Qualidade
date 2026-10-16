import { ODS, type TemaEsg } from "@davinci/types";
import { painel } from "@/lib/estilos";

/*
 * Mapa dos ODS da Agenda ESG, com a mesma organização do material de domínio: educação na base (à esquerda, setas
 * subindo), o bloco do Estado Democrático de Direito, o da economia, o do meio ambiente e as parcerias (à direita,
 * setas descendo). Coordenadas no mesmo sistema da imagem original (1600 × 900). Cada caixa leva ao cartão do ODS.
 */

type Caixa = {
  n: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Linhas do rótulo, como no material. */
  linhas: string[];
  /** Canto do quadrado numerado: [x, y] do centro. */
  numero: [number, number];
  fonte?: number;
  /** Desce o rótulo quando o quadrado numerado fica por cima dele. */
  desce?: number;
};

const CAIXAS: Caixa[] = [
  {
    n: 4,
    x: 115,
    y: 386,
    w: 172,
    h: 174,
    linhas: ["Educação de", "Qualidade"],
    numero: [274, 384],
    fonte: 18,
  },
  {
    n: 3,
    x: 306,
    y: 283,
    w: 114,
    h: 110,
    linhas: ["Saúde e", "Bem-Estar"],
    numero: [305, 284],
  },
  {
    n: 2,
    x: 306,
    y: 419,
    w: 114,
    h: 108,
    linhas: ["Fome Zero"],
    numero: [313, 421],
  },
  {
    n: 6,
    x: 306,
    y: 555,
    w: 114,
    h: 108,
    linhas: ["Água", "potável e", "Saneamento"],
    numero: [420, 552],
    fonte: 15,
  },
  {
    n: 1,
    x: 443,
    y: 387,
    w: 145,
    h: 140,
    linhas: ["Erradicação", "da Pobreza"],
    numero: [588, 390],
    fonte: 18,
  },
  {
    n: 10,
    x: 496,
    y: 544,
    w: 115,
    h: 110,
    linhas: ["Redução", "das", "Desigualdades"],
    numero: [610, 543],
    fonte: 14,
  },
  {
    n: 5,
    x: 622,
    y: 578,
    w: 80,
    h: 74,
    linhas: ["Igualdade", "de Gênero"],
    numero: [692, 587],
    fonte: 12,
    desce: 9,
  },
  {
    n: 16,
    x: 642,
    y: 386,
    w: 170,
    h: 174,
    linhas: ["Paz, Justiça e", "Instituições", "Eficazes"],
    numero: [645, 389],
    fonte: 18,
  },
  {
    n: 2,
    x: 728,
    y: 280,
    w: 102,
    h: 84,
    linhas: ["Agricultura", "Sustentável"],
    numero: [826, 281],
    fonte: 14,
  },
  {
    n: 7,
    x: 975,
    y: 288,
    w: 114,
    h: 110,
    linhas: ["Energia", "Limpa e", "Acessível"],
    numero: [982, 288],
  },
  {
    n: 8,
    x: 842,
    y: 366,
    w: 114,
    h: 110,
    linhas: ["Trabalho", "Decente e", "Crescimento", "Econômico"],
    numero: [841, 393],
    fonte: 14,
  },
  {
    n: 11,
    x: 975,
    y: 420,
    w: 114,
    h: 110,
    linhas: ["Cidades e", "Comunidades", "Sustentáveis"],
    numero: [980, 423],
    fonte: 14,
  },
  {
    n: 9,
    x: 842,
    y: 498,
    w: 114,
    h: 110,
    linhas: ["Indústria,", "Inovação e", "Infraestrutura"],
    numero: [841, 514],
    fonte: 14,
  },
  {
    n: 12,
    x: 975,
    y: 553,
    w: 114,
    h: 110,
    linhas: ["Consumo e", "Produção", "Responsáveis"],
    numero: [980, 560],
    fonte: 14,
  },
  {
    n: 14,
    x: 1107,
    y: 353,
    w: 114,
    h: 110,
    linhas: ["Vida na", "Água"],
    numero: [1116, 347],
  },
  {
    n: 15,
    x: 1107,
    y: 488,
    w: 114,
    h: 110,
    linhas: ["Vida", "Terrestre"],
    numero: [1115, 494],
  },
  {
    n: 13,
    x: 1240,
    y: 420,
    w: 114,
    h: 110,
    linhas: ["Ação contra", "Mudança", "Global do", "Clima"],
    numero: [1250, 412],
    fonte: 14,
  },
  {
    n: 17,
    x: 1372,
    y: 420,
    w: 115,
    h: 110,
    linhas: ["Parcerias e", "Meio de", "Implementação"],
    numero: [1383, 413],
    fonte: 13,
  },
];

/** Textos soltos do material, nas mesmas posições (x = centro). */
const TEXTOS: {
  x: number;
  y: number;
  linhas: string[];
  tamanho?: number;
  negrito?: boolean;
}[] = [
  {
    x: 812,
    y: 221,
    linhas: [
      "I - Soberania; II - Cidadania; III - Dignidade da pessoa humana; IV - Valores sociais do trabalho e da Livre Iniciativa; V - Pluralismo político.",
    ],
    tamanho: 14,
  },
  {
    x: 574,
    y: 273,
    linhas: [
      "O Estado Democrático de direito é definido",
      "pelo respeito aos direitos humanos.",
      "É um Estado no qual os direitos individuais,",
      "coletivos, sociais e políticos são garantidos",
      "através do direito constitucional",
    ],
    tamanho: 14,
  },
  { x: 361, y: 683, linhas: ["Vida - Saúde e Bem Estar"], tamanho: 14 },
  { x: 599, y: 671, linhas: ["Sociedade Justa e Igualitária"], tamanho: 14 },
  {
    x: 899,
    y: 280,
    linhas: [
      "Economia que",
      "funciona para a",
      "Sociedade e",
      "para as Pessoas",
    ],
    tamanho: 14,
  },
  {
    x: 869,
    y: 623,
    linhas: [
      "Economia e Inovação em",
      "Ambiente Digital",
      "Sociedade Competitiva",
      "e Assertiva",
    ],
    tamanho: 14,
  },
  {
    x: 1286,
    y: 290,
    linhas: ["Pacto pelo Meio Ambiente", "Verdadeiramente Sustentável"],
    tamanho: 14,
  },
  {
    x: 812,
    y: 731,
    linhas: [
      "Educação, prática social que visa o desenvolvimento do ser humano, de suas potencialidades, habilidades, competências e emancipação.",
    ],
    tamanho: 14,
  },
  {
    x: 810,
    y: 777,
    linhas: [
      "- Economicamente viável, - Socialmente responsável, - Ambientalmente correta, - Culturalmente aceita/respeitada, - Eticamente necessária.",
    ],
    tamanho: 15,
    negrito: true,
  },
];

/** Molduras (linhas finas) e setas do material. */
const MOLDURAS = [
  { x: 173, y: 197, w: 1278, h: 560 },
  { x: 234, y: 245, w: 482, h: 461 },
  { x: 760, y: 248, w: 271, h: 460 },
  { x: 1161, y: 246, w: 252, h: 461 },
];
const SETAS: { x: number; y: number; para: "cima" | "baixo" }[] = [
  { x: 173, y: 245, para: "cima" },
  { x: 234, y: 318, para: "cima" },
  { x: 1414, y: 598, para: "baixo" },
  { x: 1451, y: 668, para: "baixo" },
];

export function MapaDosOds({ temas }: { temas: TemaEsg[] }) {
  return (
    <section
      className={`${painel} mt-6 p-2 sm:p-4`}
      aria-label="Mapa dos ODS da Agenda ESG"
    >
      <div className="relative overflow-x-auto">
        <svg
          viewBox="100 190 1400 610"
          className="h-auto w-full min-w-[56rem]"
          role="img"
          aria-label="Mapa dos 17 ODS: educação na base, Estado Democrático de Direito, economia, meio ambiente e parcerias como meio de implementação"
        >
          {MOLDURAS.map((m) => (
            <rect
              key={`${m.x}-${m.y}`}
              x={m.x}
              y={m.y}
              width={m.w}
              height={m.h}
              fill="none"
              stroke="var(--color-menu)"
              strokeWidth={2}
            />
          ))}
          {SETAS.map((s) => (
            <path
              key={`${s.x}-${s.y}`}
              d={
                s.para === "cima"
                  ? `M${s.x - 9} ${s.y + 22} L${s.x} ${s.y} L${s.x + 9} ${s.y + 22} Z`
                  : `M${s.x - 9} ${s.y - 22} L${s.x} ${s.y} L${s.x + 9} ${s.y - 22} Z`
              }
              fill="var(--color-menu)"
            />
          ))}
          {TEXTOS.map((t) => (
            <text
              key={`${t.x}-${t.y}`}
              x={t.x}
              y={t.y}
              textAnchor="middle"
              fontSize={t.tamanho ?? 14}
              fontWeight={t.negrito ? 600 : 400}
              fill="var(--color-texto)"
            >
              {t.linhas.map((l, i) => (
                <tspan
                  key={l}
                  x={t.x}
                  dy={i === 0 ? 0 : (t.tamanho ?? 14) * 1.43}
                >
                  {l}
                </tspan>
              ))}
            </text>
          ))}
          {CAIXAS.map((c) => {
            const ligados = temas.filter((t) => t.ods.includes(c.n));
            const materiais = ligados.filter((t) => t.material).length;
            const fonte = c.fonte ?? 16;
            const altura = fonte * 1.25;
            const topo =
              c.y +
              c.h / 2 -
              ((c.linhas.length - 1) * altura) / 2 +
              fonte * 0.35 +
              (c.desce ?? 0);
            return (
              <a key={`${c.n}-${c.x}`} href={`#ods-${c.n}`} className="group">
                <title>{`ODS ${c.n} · ${ODS[c.n]}: ${ligados.length} ${ligados.length === 1 ? "tema" : "temas"}${materiais ? `, ${materiais} material` : ""}`}</title>
                <rect
                  x={c.x}
                  y={c.y}
                  width={c.w}
                  height={c.h}
                  fill="var(--color-superficie)"
                  stroke="var(--color-borda-forte)"
                  strokeWidth={2}
                  className="group-hover:fill-[var(--color-superficie-2)]"
                />
                <text
                  textAnchor="middle"
                  fontSize={fonte}
                  fontWeight={600}
                  fill="var(--color-texto)"
                >
                  {c.linhas.map((l, i) => (
                    <tspan key={l} x={c.x + c.w / 2} y={topo + i * altura}>
                      {l}
                    </tspan>
                  ))}
                </text>
                <rect
                  x={c.numero[0] - 18}
                  y={c.numero[1] - 18}
                  width={36}
                  height={36}
                  rx={4}
                  style={{ fill: `var(--dv-ods-${c.n})` }}
                />
                <text
                  x={c.numero[0]}
                  y={c.numero[1] + 6.5}
                  textAnchor="middle"
                  fontSize={18}
                  fontWeight={700}
                  fill="var(--color-primaria-texto)"
                >
                  {c.n}
                </text>
              </a>
            );
          })}
        </svg>
      </div>
      <p className="mt-2 px-2 text-xs text-texto-2 sm:hidden">
        Arraste para o lado para ver o mapa inteiro.
      </p>
    </section>
  );
}
