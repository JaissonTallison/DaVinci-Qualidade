/** "1.250,00" → "1250.00". Quem digita no padrão brasileiro não precisa adivinhar o formato. */
export function valorEmReais(texto: string | undefined): string | undefined {
  const t = texto?.trim();
  if (!t || !t.includes(",")) return t;
  return t.replace(/\./g, "").replace(",", ".");
}

/** "1250.5" → "R$ 1.250,50". */
export function formatarReais(valor: string | null): string | null {
  return valor === null
    ? null
    : Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
}
