/** "2026-10-15" → "15/10/2026". Data civil: não passa por fuso. */
export function formatarData(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

/** Instante (ISO com hora) → "15/10/2026 14:32", no horário de Brasília. */
export function formatarMomento(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

/** Hoje (AAAA-MM-DD) no fuso de Brasília. */
export function hojeEmBrasilia(agora = new Date()): string {
  return agora.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

/** Dias entre duas datas civis (AAAA-MM-DD). */
export function diasEntre(de: string, ate: string): number {
  return Math.round(
    (Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) /
      86_400_000,
  );
}

/** "vence hoje", "vence em 5 dias", "venceu há 3 dias". */
export function prazoRelativo(prazo: string, hoje = hojeEmBrasilia()): string {
  const dias = diasEntre(hoje, prazo);
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  if (dias > 1) return `vence em ${dias} dias`;
  return dias === -1 ? "venceu ontem" : `venceu há ${-dias} dias`;
}
