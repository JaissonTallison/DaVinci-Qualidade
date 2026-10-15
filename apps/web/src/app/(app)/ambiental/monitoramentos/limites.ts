import type { Monitoramento } from "@davinci/types";

const n = (v: number) =>
  v.toLocaleString("pt-BR", { maximumFractionDigits: 6 });

/** "5 a 9 pH", "até 120 mg/L", "a partir de 5 mg/L". */
export function textoDoLimite(
  m: Pick<Monitoramento, "limiteMinimo" | "limiteMaximo" | "unidade">,
): string {
  if (m.limiteMinimo !== null && m.limiteMaximo !== null)
    return `${n(m.limiteMinimo)} a ${n(m.limiteMaximo)} ${m.unidade}`;
  if (m.limiteMaximo !== null) return `até ${n(m.limiteMaximo)} ${m.unidade}`;
  return `a partir de ${n(m.limiteMinimo ?? 0)} ${m.unidade}`;
}
