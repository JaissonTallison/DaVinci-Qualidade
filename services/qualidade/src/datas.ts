/** Data de hoje (AAAA-MM-DD) no fuso de Brasília: prazos são datas civis, não instantes. */
export function hojeEmBrasilia(agora = new Date()): string {
  return agora.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}
