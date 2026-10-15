import type { ErroPadrao } from "@davinci/types";

/** Erros de validação por campo (`detalhes` do erro padrão) → { campo: mensagem }. */
export function errosPorCampo(
  detalhes: ErroPadrao["detalhes"],
): Record<string, string> {
  const erros: Record<string, string> = {};
  for (const d of detalhes ?? [])
    if (d.campo && !erros[d.campo]) erros[d.campo] = d.mensagem;
  return erros;
}
