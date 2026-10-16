import { describe, expect, it } from 'vitest';
import {
  ELEMENTOS_DO_PPAP,
  exigenciaDoElemento,
  pendenciasDoPpap,
  prioridadeDeAcao,
  type ElementoDoPpap,
} from './automotivo.js';

describe('Prioridade de Ação (AIAG-VDA)', () => {
  it('severidade 9-10', () => {
    expect(prioridadeDeAcao(10, 8, 1)).toBe('H');
    expect(prioridadeDeAcao(9, 4, 1)).toBe('M');
    expect(prioridadeDeAcao(9, 2, 7)).toBe('H');
    expect(prioridadeDeAcao(9, 3, 5)).toBe('M');
    expect(prioridadeDeAcao(9, 2, 3)).toBe('L');
    expect(prioridadeDeAcao(10, 1, 10)).toBe('L');
  });
  it('severidade 7-8', () => {
    expect(prioridadeDeAcao(8, 9, 1)).toBe('H');
    expect(prioridadeDeAcao(7, 6, 1)).toBe('M');
    expect(prioridadeDeAcao(7, 5, 7)).toBe('H');
    expect(prioridadeDeAcao(7, 4, 5)).toBe('M');
    expect(prioridadeDeAcao(8, 2, 8)).toBe('M');
    expect(prioridadeDeAcao(8, 3, 4)).toBe('L');
  });
  it('severidade 4-6', () => {
    expect(prioridadeDeAcao(6, 8, 6)).toBe('H');
    expect(prioridadeDeAcao(6, 8, 3)).toBe('M');
    expect(prioridadeDeAcao(5, 7, 1)).toBe('L');
    expect(prioridadeDeAcao(4, 5, 7)).toBe('M');
    expect(prioridadeDeAcao(4, 5, 6)).toBe('L');
    expect(prioridadeDeAcao(6, 3, 10)).toBe('L');
  });
  it('severidade 2-3 e 1', () => {
    expect(prioridadeDeAcao(3, 9, 5)).toBe('M');
    expect(prioridadeDeAcao(3, 9, 4)).toBe('L');
    expect(prioridadeDeAcao(2, 7, 10)).toBe('L');
    expect(prioridadeDeAcao(1, 10, 10)).toBe('L');
  });
});

describe('PPAP: o que submeter por nível', () => {
  it('nível 1 só PSW e aparência; nível 3 quase tudo; nível 5 só o PSW', () => {
    const submeter = (n: 1 | 3 | 5) =>
      (Object.keys(ELEMENTOS_DO_PPAP) as ElementoDoPpap[]).filter(
        (e) => exigenciaDoElemento(e, n) === 'submeter',
      );
    expect(submeter(1)).toEqual(['aparencia', 'psw']);
    expect(submeter(3)).toHaveLength(16);
    expect(submeter(3)).not.toContain('amostra_padrao');
    expect(submeter(5)).toEqual(['psw']);
    expect(exigenciaDoElemento('dfmea', 4)).toBe('a_pedido');
  });
  it('não aplicável só vale com justificativa', () => {
    const base = { exigencia: 'submeter' as const, observacao: '' };
    expect(
      pendenciasDoPpap([
        { ...base, elemento: 'psw', status: 'concluido' },
        { ...base, elemento: 'aparencia', status: 'nao_aplicavel' },
        {
          ...base,
          elemento: 'dimensional',
          status: 'nao_aplicavel',
          observacao: 'Peça sem cota funcional',
        },
        {
          ...base,
          elemento: 'msa',
          status: 'em_andamento',
          exigencia: 'reter',
        },
      ]).map((e) => e.elemento),
    ).toEqual(['aparencia']);
  });
});
