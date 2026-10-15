import {
  caValidoEm,
  caVenceEmBreve,
  proximaTroca,
  situacaoDaEntrega,
} from './regras.js';

describe('EPIs', () => {
  it('CA vale até o dia da validade, inclusive', () => {
    expect(caValidoEm('2026-10-15', '2026-10-15')).toBe(true);
    expect(caValidoEm('2026-10-14', '2026-10-15')).toBe(false);
  });

  it('aviso de CA em até 30 dias; vencido não é "em breve"', () => {
    expect(caVenceEmBreve('2026-11-14', '2026-10-15')).toBe(true);
    expect(caVenceEmBreve('2026-11-15', '2026-10-15')).toBe(false);
    expect(caVenceEmBreve('2026-10-14', '2026-10-15')).toBe(false);
  });

  it('próxima troca pela vida útil; sem vida útil, nenhuma', () => {
    expect(proximaTroca('2026-10-01', 30)).toBe('2026-10-31');
    expect(proximaTroca('2026-10-01', null)).toBeNull();
  });

  it('situação: anulada, devolvido, troca vencida ou em uso', () => {
    const base = {
      proximaTroca: '2026-10-10',
      devolvidoEm: null,
      motivoAnulacao: null,
    };
    expect(situacaoDaEntrega(base, '2026-10-15')).toBe('troca_vencida');
    expect(
      situacaoDaEntrega({ ...base, proximaTroca: '2026-10-15' }, '2026-10-15'),
    ).toBe('em_uso');
    expect(
      situacaoDaEntrega({ ...base, devolvidoEm: '2026-10-12' }, '2026-10-15'),
    ).toBe('devolvido');
    expect(
      situacaoDaEntrega(
        { ...base, motivoAnulacao: 'Lançada para a pessoa errada.' },
        '2026-10-15',
      ),
    ).toBe('anulada');
  });
});
