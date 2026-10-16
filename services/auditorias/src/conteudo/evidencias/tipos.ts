import type {
  EvidenciaDaBiblioteca,
  Norma,
  RiscoDaEvidencia,
  TemaDoAnexoA,
  TipoDeEvidencia,
} from '@davinci/types';

/** Linha compacta do banco: [cláusula, título, tipo, risco, o que pedir, exemplo aceitável]. */
export type LinhaDeEvidencia = [
  string,
  string,
  'd' | 'r' | 'e' | 'o',
  'a' | 'm' | 'b',
  string,
  string,
];

const TIPO: Record<LinhaDeEvidencia[2], TipoDeEvidencia> = {
  d: 'documento',
  r: 'registro',
  e: 'entrevista',
  o: 'observacao',
};
const RISCO: Record<LinhaDeEvidencia[3], RiscoDaEvidencia> = {
  a: 'alto',
  m: 'medio',
  b: 'baixo',
};

/** Monta as evidências de uma norma; o código fica estável pela ordem dentro da cláusula. */
export function montar(
  norma: Norma,
  sigla: string,
  linhas: LinhaDeEvidencia[],
  anexoA?: (clausula: string) => TemaDoAnexoA | undefined,
): EvidenciaDaBiblioteca[] {
  const contador = new Map<string, number>();
  return linhas.map(([clausula, titulo, tipo, risco, oQuePedir, exemplo]) => {
    const n = (contador.get(clausula) ?? 0) + 1;
    contador.set(clausula, n);
    const tema = anexoA?.(clausula);
    return {
      codigo: `E-${sigla}-${clausula}-${n}`,
      origem: 'banco',
      norma,
      clausula,
      titulo,
      tipo: TIPO[tipo],
      risco: RISCO[risco],
      oQuePedir,
      exemplo,
      ...(tema ? { controle: clausula, tema } : {}),
    };
  });
}
