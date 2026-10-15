/** "15/10/2026 08:00 às 12:00" (mesmo dia) ou com as duas datas. Os horários já estão em hora de Brasília. */
export function periodoDaPt(inicio: string, fim: string): string {
  const data = (m: string) => m.slice(0, 10).split("-").reverse().join("/");
  const hora = (m: string) => m.slice(11, 16);
  return inicio.slice(0, 10) === fim.slice(0, 10)
    ? `${data(inicio)} ${hora(inicio)} às ${hora(fim)}`
    : `${data(inicio)} ${hora(inicio)} a ${data(fim)} ${hora(fim)}`;
}
