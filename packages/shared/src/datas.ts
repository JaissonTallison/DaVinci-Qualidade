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

/**
 * Soma meses a uma data civil (AAAA-MM-DD) respeitando o fim do mês: 31/01 + 1 mês = 28/02 (ou 29/02 em ano bissexto).
 */
export function somarMeses(data: string, meses: number): string {
  const [ano, mes, dia] = data.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  const indice = mes - 1 + meses;
  const anoFinal = ano + Math.floor(indice / 12);
  const mesFinal = ((indice % 12) + 12) % 12;
  const ultimoDia = new Date(Date.UTC(anoFinal, mesFinal + 1, 0)).getUTCDate();
  return `${anoFinal}-${String(mesFinal + 1).padStart(2, '0')}-${String(Math.min(dia, ultimoDia)).padStart(2, '0')}`;
}

/** Agora no fuso de Brasília, no formato do campo de data e hora (AAAA-MM-DDTHH:mm). */
export function agoraEmBrasilia(agora = new Date()): string {
  return agora.toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).slice(0, 16).replace(' ', 'T');
}
