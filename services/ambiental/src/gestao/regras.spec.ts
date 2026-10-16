import {
  emKg,
  porUnidade,
  proximoVencimento,
  situacaoDaObrigacao,
} from './regras.js';

describe('Obrigações legais', () => {
  it('o próximo vencimento conta do vencimento anterior; única não volta', () => {
    expect(proximoVencimento('2026-03-31', 'anual')).toBe('2027-03-31');
    expect(proximoVencimento('2026-01-31', 'trimestral')).toBe('2026-04-30');
    expect(proximoVencimento('2026-03-31', 'unica')).toBeNull();
  });
  it('situação pelo vencimento: vencida, até 30 dias, em dia; sem próximo, cumprida', () => {
    expect(situacaoDaObrigacao('2026-10-15', '2026-10-16')).toBe('vencida');
    expect(situacaoDaObrigacao('2026-11-10', '2026-10-16')).toBe(
      'vence_em_breve',
    );
    expect(situacaoDaObrigacao('2027-01-10', '2026-10-16')).toBe('em_dia');
    expect(situacaoDaObrigacao(null, '2026-10-16')).toBe('cumprida');
  });
});

describe('Ecoeficiência', () => {
  it('massa em kg e indicador por unidade produzida', () => {
    expect(emKg(2.5, 't')).toBe(2500);
    expect(emKg(10, 'L')).toBeNull();
    expect(porUnidade(1200, 400)).toBe(3);
    expect(porUnidade(100, 0)).toBeNull();
  });
});
