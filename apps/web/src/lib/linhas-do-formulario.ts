/** Linhas do editor (`<prefixo>.<i>.<campo>`), sem as linhas em branco; campo vazio sai como ausente. */
export function linhasDoFormulario(
  form: FormData,
  campos: readonly string[],
  prefixo = "linhas",
): Record<string, string | undefined>[] {
  const total = Number(form.get(`${prefixo}-total`) ?? 0);
  const saida: Record<string, string | undefined>[] = [];
  for (let i = 0; i < total; i++) {
    const l = Object.fromEntries(
      campos.map((c) => [
        c,
        String(form.get(`${prefixo}.${i}.${c}`) ?? "").trim() || undefined,
      ]),
    );
    if (Object.values(l).some(Boolean)) saida.push(l);
  }
  return saida;
}
