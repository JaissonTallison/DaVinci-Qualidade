/** Violação de unicidade do Postgres (23505), com o nome da regra; `null` para qualquer outro erro. */
export function violacaoUnica(erro: unknown): string | null {
  const e =
    (erro as { cause?: { code?: string; constraint?: string } })?.cause ??
    (erro as { code?: string; constraint?: string });
  return e?.code === '23505' ? (e.constraint ?? '') : null;
}
