import {
  estaVencida,
  formatarNumeroNc,
  hojeEmBrasilia,
  recusaDaTransicao,
  statusAposVerificacao,
} from './regras.js';

describe('transições da NC', () => {
  it('cada passo só parte do status anterior', () => {
    expect(recusaDaTransicao('registrarTratamento', 'aberta')).toBeNull();
    expect(
      recusaDaTransicao('registrarTratamento', 'em_tratamento'),
    ).toBeNull();
    expect(
      recusaDaTransicao('registrarTratamento', 'em_verificacao'),
    ).toContain('"Aberta" ou "Em tratamento"');
    expect(
      recusaDaTransicao('enviarParaVerificacao', 'em_tratamento'),
    ).toBeNull();
    expect(recusaDaTransicao('verificarEficacia', 'em_verificacao')).toBeNull();
  });

  it('pular etapa é recusado dizendo onde a NC está', () => {
    expect(recusaDaTransicao('verificarEficacia', 'aberta')).toBe(
      'Para verificar a eficácia da NC, ela precisa estar "Em verificação". Hoje está "Aberta".',
    );
    expect(recusaDaTransicao('enviarParaVerificacao', 'aberta')).toContain(
      '"Em tratamento"',
    );
  });

  it('NC encerrada ou cancelada não aceita mais nada, nem edição nem cancelamento', () => {
    for (const acao of [
      'registrarTratamento',
      'enviarParaVerificacao',
      'verificarEficacia',
      'cancelar',
      'editar',
    ] as const) {
      expect(recusaDaTransicao(acao, 'encerrada')).toMatch(/encerrada\.$/);
      expect(recusaDaTransicao(acao, 'cancelada')).toMatch(/cancelada\.$/);
    }
  });

  it('cancelar e editar valem em qualquer status não final', () => {
    for (const status of [
      'aberta',
      'em_tratamento',
      'em_verificacao',
    ] as const) {
      expect(recusaDaTransicao('cancelar', status)).toBeNull();
      expect(recusaDaTransicao('editar', status)).toBeNull();
    }
  });

  it('eficaz encerra; ineficaz volta para tratamento', () => {
    expect(statusAposVerificacao(true)).toBe('encerrada');
    expect(statusAposVerificacao(false)).toBe('em_tratamento');
  });
});

describe('vencimento', () => {
  it('vence no dia seguinte ao prazo, nunca no próprio dia', () => {
    expect(estaVencida('2026-10-15', 'aberta', '2026-10-15')).toBe(false);
    expect(estaVencida('2026-10-14', 'aberta', '2026-10-15')).toBe(true);
  });

  it('NC terminada não vence', () => {
    expect(estaVencida('2026-01-01', 'encerrada', '2026-10-15')).toBe(false);
    expect(estaVencida('2026-01-01', 'cancelada', '2026-10-15')).toBe(false);
  });

  it('hoje usa o fuso de Brasília: 01h UTC ainda é o dia anterior', () => {
    expect(hojeEmBrasilia(new Date('2026-10-16T01:00:00Z'))).toBe('2026-10-15');
    expect(hojeEmBrasilia(new Date('2026-10-16T03:00:00Z'))).toBe('2026-10-16');
  });
});

describe('número', () => {
  it('três dígitos e sem limite em 999', () => {
    expect(formatarNumeroNc(2026, 7)).toBe('NC-2026-007');
    expect(formatarNumeroNc(2026, 1000)).toBe('NC-2026-1000');
  });
});
