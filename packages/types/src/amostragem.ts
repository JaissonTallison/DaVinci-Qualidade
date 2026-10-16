/**
 * Plano de amostragem simples, inspeção normal, por atributos: NBR 5426 (equivalente à ISO 2859-1),
 * tabelas 1 (letra-código) e 2-A (amostragem simples normal). docs/05-modulos/inspecoes.md
 */

export const NIVEIS_DE_INSPECAO = {
  I: 'Nível I (menos rigoroso)',
  II: 'Nível II (usual)',
  III: 'Nível III (mais rigoroso)',
} as const;
export type NivelDeInspecao = keyof typeof NIVEIS_DE_INSPECAO;

/** NQA (nível de qualidade aceitável) em % de defeituosos: a faixa usada em inspeção de recebimento e produto. */
export const NQAS = {
  '0.065': '0,065%',
  '0.10': '0,10%',
  '0.15': '0,15%',
  '0.25': '0,25%',
  '0.40': '0,40%',
  '0.65': '0,65%',
  '1.0': '1,0%',
  '1.5': '1,5%',
  '2.5': '2,5%',
  '4.0': '4,0%',
  '6.5': '6,5%',
  '10': '10%',
} as const;
export type Nqa = keyof typeof NQAS;

/** Posição de cada NQA na série completa da tabela 2-A (0,010 é a posição 0). */
const POSICAO_DO_NQA: Record<Nqa, number> = {
  '0.065': 4,
  '0.10': 5,
  '0.15': 6,
  '0.25': 7,
  '0.40': 8,
  '0.65': 9,
  '1.0': 10,
  '1.5': 11,
  '2.5': 12,
  '4.0': 13,
  '6.5': 14,
  '10': 15,
};

const LETRAS = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'J',
  'K',
  'L',
  'M',
  'N',
  'P',
  'Q',
  'R',
] as const;
const AMOSTRAS = [
  2, 3, 5, 8, 13, 20, 32, 50, 80, 125, 200, 315, 500, 800, 1250, 2000,
];

/** Tabela 1: limite superior da faixa do lote → letra-código nos níveis I, II e III (posição em LETRAS). */
const FAIXAS: [number, number, number, number][] = [
  [8, 0, 0, 1],
  [15, 0, 1, 2],
  [25, 1, 2, 3],
  [50, 2, 3, 4],
  [90, 2, 4, 5],
  [150, 3, 5, 6],
  [280, 4, 6, 7],
  [500, 5, 7, 8],
  [1200, 6, 8, 9],
  [3200, 7, 9, 10],
  [10000, 8, 10, 11],
  [35000, 9, 11, 12],
  [150000, 10, 12, 13],
  [500000, 11, 13, 14],
  [Infinity, 12, 14, 15],
];

/**
 * Tabela 2-A por diagonais: andar uma letra para baixo equivale a andar um NQA para a direita. Na soma
 * letra + NQA, 14 é Ac 0; 15 é seta para cima (usa a letra anterior); 16, seta para baixo (usa a seguinte);
 * de 17 em diante, os números de aceitação 1, 2, 3, 5, 7, 10, 14 e 21; acima disso, seta para cima.
 * Seta para cima na letra A, sem plano acima, segue para baixo.
 */
const ACEITACAO: Record<number, number> = {
  14: 0,
  17: 1,
  18: 2,
  19: 3,
  20: 5,
  21: 7,
  22: 10,
  23: 14,
  24: 21,
};

export interface PlanoDeAmostragem {
  nivel: NivelDeInspecao;
  nqa: Nqa;
  /** Letra-código da tabela 1 (antes de seguir as setas). */
  letra: string;
  /** Letra cujo plano foi usado, depois das setas. */
  letraDoPlano: string;
  amostra: number;
  /** Aceita o lote com até `aceita` defeituosos na amostra. */
  aceita: number;
  /** Rejeita o lote com `rejeita` ou mais defeituosos. */
  rejeita: number;
  /** Amostra maior ou igual ao lote: inspecionar 100% do lote. */
  cemPorCento: boolean;
}

export function planoDeAmostragem(
  lote: number,
  nivel: NivelDeInspecao,
  nqa: Nqa,
): PlanoDeAmostragem {
  const faixa = FAIXAS.find((f) => lote <= f[0])!;
  const coluna = nivel === 'I' ? 1 : nivel === 'II' ? 2 : 3;
  const letra = faixa[coluna];
  let i = letra;
  const j = POSICAO_DO_NQA[nqa];
  for (let passo = 0; passo < 40; passo++) {
    const soma = i + j;
    if (soma in ACEITACAO) break;
    // Seta para cima na letra A não tem plano acima: segue para baixo (amostra maior, mais conservador)
    if (soma < 14 || soma === 16 || (soma === 15 && i === 0)) i += 1;
    else i -= 1;
    if (i < 0 || i >= LETRAS.length) throw new Error('Plano fora da tabela.');
  }
  const aceita = ACEITACAO[i + j]!;
  const amostra = AMOSTRAS[i]!;
  return {
    nivel,
    nqa,
    letra: LETRAS[letra]!,
    letraDoPlano: LETRAS[i]!,
    amostra: Math.min(amostra, lote),
    aceita,
    rejeita: aceita + 1,
    cemPorCento: amostra >= lote,
  };
}

/** Lote aceito com até `aceita` defeituosos na amostra. */
export const loteAceito = (
  plano: Pick<PlanoDeAmostragem, 'aceita'>,
  defeituosos: number,
) => defeituosos <= plano.aceita;
