import type { OrigemNc } from "@davinci/types";

/**
 * Para cada origem de NC que aponta para um registro de verdade: o caminho da lista no web (para virar link
 * clicável, filtrado pelo número) e o endpoint da API (para a lista de seleção no formulário). Origens sem
 * registro (fornecedor, processo interno, outra) ficam de fora.
 */
export const ORIGEM_VINCULAVEL: Partial<
  Record<OrigemNc, { base: string; endpoint: string; rotuloCampo: string }>
> = {
  inspecao: {
    base: "/qualidade/inspecoes",
    endpoint: "/inspecoes?porPagina=50",
    rotuloCampo: "Inspeção",
  },
  calibracao: {
    base: "/qualidade/calibracao",
    endpoint: "/instrumentos?porPagina=50",
    rotuloCampo: "Instrumento (TAG)",
  },
  auditoria: {
    base: "/auditorias",
    endpoint: "/auditorias?porPagina=50",
    rotuloCampo: "Auditoria",
  },
  reclamacao_cliente: {
    base: "/servicos/reclamacoes",
    endpoint: "/reclamacoes?porPagina=50",
    rotuloCampo: "Reclamação",
  },
  acidente: {
    base: "/seguranca/acidentes",
    endpoint: "/acidentes?porPagina=50",
    rotuloCampo: "Acidente",
  },
  ambiental: {
    base: "/ambiental/ocorrencias",
    endpoint: "/ocorrencias-ambientais?porPagina=50",
    rotuloCampo: "Ocorrência ambiental",
  },
};

/** Link para o registro de origem, filtrando a lista do módulo pelo número. */
export function linkDaOrigem(
  origem: OrigemNc,
  ref: string | null,
): string | null {
  const v = ORIGEM_VINCULAVEL[origem];
  if (!v || !ref) return null;
  return `${v.base}?busca=${encodeURIComponent(ref)}`;
}
