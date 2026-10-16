import { hojeEmBrasilia, somarDias } from '@davinci/shared';
import { situacaoDoEpi } from './regras.js';

const hoje = hojeEmBrasilia();

describe('EPI exigido pela função', () => {
  it('sem entrega em uso, não tem', () => {
    expect(situacaoDoEpi(undefined, hoje)).toBe('ausente');
  });
  it('sem troca periódica, em dia', () => {
    expect(situacaoDoEpi({ proximaTroca: null }, hoje)).toBe('em_dia');
  });
  it('troca vencida, vencido; troca em até 30 dias, vence em breve', () => {
    expect(situacaoDoEpi({ proximaTroca: somarDias(hoje, -1) }, hoje)).toBe(
      'vencido',
    );
    expect(situacaoDoEpi({ proximaTroca: hoje }, hoje)).toBe('vence_em_breve');
    expect(situacaoDoEpi({ proximaTroca: somarDias(hoje, 30) }, hoje)).toBe(
      'vence_em_breve',
    );
    expect(situacaoDoEpi({ proximaTroca: somarDias(hoje, 31) }, hoje)).toBe(
      'em_dia',
    );
  });
});
