import type { OrigemPlano } from "@davinci/types";

/**
 * Origens de plano que apontam para um registro real: caminho da lista no web (para o link clicável, filtrado
 * pelo número) e, quando há autocomplete no formulário, o endpoint e o rótulo do campo. A origem "nc" é tratada
 * à parte, pelo `ncId` (link direto). Melhoria e "outra" não têm registro.
 */
export const ORIGEM_PLANO_VINCULAVEL: Partial<
  Record<OrigemPlano, { base: string; endpoint?: string; rotuloCampo: string }>
> = {
  auditoria: {
    base: "/auditorias",
    endpoint: "/auditorias?porPagina=50",
    rotuloCampo: "Auditoria",
  },
  acidente: {
    base: "/seguranca/acidentes",
    endpoint: "/acidentes?porPagina=50",
    rotuloCampo: "Acidente",
  },
  risco: { base: "/seguranca/pgr", rotuloCampo: "Risco (PGR)" },
  analise_critica: {
    base: "/sgi/analises-criticas",
    rotuloCampo: "Análise crítica",
  },
};

/** Link para o registro de origem do plano (NC pelo ncId; os demais pela busca na lista do módulo). */
export function linkDaOrigemDoPlano(
  origem: OrigemPlano,
  ref: string | null,
  ncId: string | null,
): string | null {
  if (origem === "nc" && ncId) return `/qualidade/nao-conformidades/${ncId}`;
  const v = ORIGEM_PLANO_VINCULAVEL[origem];
  if (!v || !ref) return null;
  return `${v.base}?busca=${encodeURIComponent(ref)}`;
}
