import { STATUS_ACIDENTE, type StatusAcidente } from '@davinci/types';

/** Primeiro dia útil (segunda a sexta) depois da data. Feriados não entram: o prazo fica mais curto, nunca mais longo. */
export function proximoDiaUtil(data: string): string {
  const d = new Date(`${data}T12:00:00Z`);
  do d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return d.toISOString().slice(0, 10);
}

/** Taxa por milhão de horas (NBR 14280), com duas casas; sem horas no período, não há taxa. */
export function taxaPorMilhaoDeHoras(
  eventos: number,
  horas: number | null,
): number | null {
  if (!horas || horas <= 0) return null;
  return Math.round(((eventos * 1_000_000) / horas) * 100) / 100;
}

export function diasEntre(de: string, ate: string): number {
  return Math.round(
    (Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) /
      86_400_000,
  );
}

export type AcaoAcidente =
  'editar' | 'cat' | 'iniciar' | 'concluir' | 'cancelar';
const PERMITIDA_EM: Record<AcaoAcidente, readonly StatusAcidente[]> = {
  editar: ['registrado', 'em_investigacao'],
  cat: ['registrado', 'em_investigacao', 'concluido'],
  iniciar: ['registrado'],
  concluir: ['em_investigacao'],
  cancelar: ['registrado', 'em_investigacao'],
};
const FRASE: Record<AcaoAcidente, string> = {
  editar: 'alterar o registro',
  cat: 'registrar a CAT',
  iniciar: 'iniciar a investigação',
  concluir: 'concluir a investigação',
  cancelar: 'cancelar o registro',
};

export function recusaDaAcao(
  acao: AcaoAcidente,
  status: StatusAcidente,
): string | null {
  if (PERMITIDA_EM[acao].includes(status)) return null;
  return `Não é possível ${FRASE[acao]}: o registro está "${STATUS_ACIDENTE[status]}".`;
}

export function formatarNumeroAcidente(
  ano: number,
  sequencial: number,
): string {
  return `ACI-${ano}-${String(sequencial).padStart(3, '0')}`;
}
