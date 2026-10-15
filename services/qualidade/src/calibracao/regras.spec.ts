import {
  calibracaoVigente,
  situacaoDoInstrumento,
  somarMeses,
} from './regras.js';

const cal = (data: string, aprovada = true, anulada = false) => ({
  data,
  aprovada,
  anulada,
});

describe('somar meses', () => {
  it('respeita o fim do mês e o ano bissexto', () => {
    expect(somarMeses('2026-01-31', 1)).toBe('2026-02-28');
    expect(somarMeses('2028-01-31', 1)).toBe('2028-02-29');
    expect(somarMeses('2026-03-15', 12)).toBe('2027-03-15');
    expect(somarMeses('2026-11-30', 3)).toBe('2027-02-28');
  });
});

describe('situação do instrumento', () => {
  const hoje = '2026-10-15';

  it('sem calibração, em dia, vence em breve e vencido', () => {
    expect(situacaoDoInstrumento(true, 12, [], hoje).situacao).toBe(
      'sem_calibracao',
    );
    expect(situacaoDoInstrumento(true, 12, [cal('2026-06-01')], hoje)).toEqual({
      situacao: 'em_dia',
      ultima: '2026-06-01',
      proxima: '2027-06-01',
    });
    expect(
      situacaoDoInstrumento(true, 6, [cal('2026-05-10')], hoje).situacao,
    ).toBe('vence_em_breve');
    expect(
      situacaoDoInstrumento(true, 6, [cal('2026-04-15')], hoje).situacao,
    ).toBe('vence_em_breve'); // vence hoje: ainda vale
    expect(
      situacaoDoInstrumento(true, 6, [cal('2026-04-14')], hoje).situacao,
    ).toBe('vencido');
  });

  it('reprovada bloqueia até uma nova aprovada; a mais recente é a que vale', () => {
    expect(
      situacaoDoInstrumento(true, 12, [cal('2026-09-01', false)], hoje)
        .situacao,
    ).toBe('reprovado');
    expect(
      situacaoDoInstrumento(
        true,
        12,
        [cal('2026-09-01', false), cal('2026-09-20')],
        hoje,
      ).situacao,
    ).toBe('em_dia');
  });

  it('lançamento antigo não substitui a calibração mais recente', () => {
    expect(
      calibracaoVigente([cal('2026-09-20'), cal('2025-09-20', false)])?.data,
    ).toBe('2026-09-20');
  });

  it('anulada sai das contas; fora de uso não vence', () => {
    expect(
      situacaoDoInstrumento(
        true,
        12,
        [cal('2026-09-01'), cal('2026-10-01', false, true)],
        hoje,
      ).situacao,
    ).toBe('em_dia');
    expect(
      situacaoDoInstrumento(false, 1, [cal('2020-01-01')], hoje).situacao,
    ).toBe('fora_de_uso');
  });
});
