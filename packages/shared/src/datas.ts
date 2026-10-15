/** Data de hoje (AAAA-MM-DD) no fuso de Brasília: prazos são datas civis, não instantes. */
export function hojeEmBrasilia(agora = new Date()): string {
  return agora.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}

/** Soma dias a uma data civil (AAAA-MM-DD). */
export function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
