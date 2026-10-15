import {
  diasEntre,
  formatarNumeroAcidente,
  proximoDiaUtil,
  recusaDaAcao,
  taxaPorMilhaoDeHoras,
} from './regras.js';

describe('prazo da CAT', () => {
  it('primeiro dia útil seguinte: sexta → segunda, sábado → segunda, terça → quarta', () => {
    expect(proximoDiaUtil('2026-10-16')).toBe('2026-10-19'); // sexta
    expect(proximoDiaUtil('2026-10-17')).toBe('2026-10-19'); // sábado
    expect(proximoDiaUtil('2026-10-13')).toBe('2026-10-14'); // terça
  });
});

describe('taxas da NBR 14280', () => {
  it('TF e TG por milhão de horas, duas casas', () => {
    expect(taxaPorMilhaoDeHoras(3, 450_000)).toBe(6.67);
    expect(taxaPorMilhaoDeHoras(45, 450_000)).toBe(100);
  });

  it('sem horas lançadas não há taxa (não é zero)', () => {
    expect(taxaPorMilhaoDeHoras(2, null)).toBeNull();
    expect(taxaPorMilhaoDeHoras(0, 0)).toBeNull();
  });

  it('dias entre datas', () => {
    expect(diasEntre('2026-09-30', '2026-10-15')).toBe(15);
  });
});

describe('ciclo', () => {
  it('investigação só depois de registrar; concluído aceita só a CAT', () => {
    expect(recusaDaAcao('concluir', 'registrado')).toBe(
      'Não é possível concluir a investigação: o registro está "Registrado".',
    );
    expect(recusaDaAcao('cat', 'concluido')).toBeNull();
    expect(recusaDaAcao('editar', 'concluido')).not.toBeNull();
  });

  it('número ACI-AAAA-NNN', () => {
    expect(formatarNumeroAcidente(2026, 9)).toBe('ACI-2026-009');
  });
});
