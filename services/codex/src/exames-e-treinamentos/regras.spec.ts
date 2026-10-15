import { situacaoDoVencimento } from './regras.js';

describe('situacaoDoVencimento', () => {
  it('vale até o próprio dia; 30 dias antes já avisa', () => {
    expect(situacaoDoVencimento('2026-10-15', '2026-10-15')).toBe(
      'vence_em_breve',
    );
    expect(situacaoDoVencimento('2026-10-14', '2026-10-15')).toBe('vencido');
    expect(situacaoDoVencimento('2026-11-14', '2026-10-15')).toBe(
      'vence_em_breve',
    );
    expect(situacaoDoVencimento('2026-11-15', '2026-10-15')).toBe('em_dia');
  });
});
