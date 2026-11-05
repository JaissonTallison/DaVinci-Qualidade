/** "2026-10-15" → "15/10/2026". Data civil: não passa por fuso. */
export function formatarData(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

/**
 * Fuso para exibir instantes com hora. Configurável por deploy na variável de ambiente `DAVINCI_FUSO`
 * (ex.: `DAVINCI_FUSO=America/Manaus`); padrão `America/Sao_Paulo`. Fuso por empresa é evolução futura
 * (exigiria uma tela de admin para configurar o fuso de cada empresa). Datas civis (sem hora) não
 * passam por fuso — ver `formatarData`.
 */
const FUSO = process.env.DAVINCI_FUSO ?? "America/Sao_Paulo";

/** Instante (ISO com hora) → "15/10/2026 14:32", no fuso do sistema (DAVINCI_FUSO). */
export function formatarMomento(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: FUSO,
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
