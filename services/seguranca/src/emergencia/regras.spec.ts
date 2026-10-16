import { vencimentosDoEquipamento } from './regras.js';

const hoje = '2026-10-16';

describe('Vencimentos do equipamento', () => {
  it('extintor: inspeção mensal, recarga anual e teste a cada 5 anos; vence o mais próximo', () => {
    const v = vencimentosDoEquipamento(
      {
        categoria: 'extintor',
        inspecaoDias: 30,
        ultimaInspecao: '2026-10-01',
        ultimaRecarga: '2025-11-01',
        ultimoTeste: '2022-05-10',
      },
      hoje,
    );
    expect(v).toMatchObject({
      proximaInspecao: '2026-10-31',
      proximaRecarga: '2026-11-01',
      proximoTeste: '2027-05-10',
    });
    expect(v.proximoVencimento).toEqual({ o: 'Inspeção', data: '2026-10-31' });
    expect(v.vencido).toBe(false);
  });
  it('sem inspeção registrada, a primeira é devida hoje; recarga passada vence', () => {
    const v = vencimentosDoEquipamento(
      {
        categoria: 'extintor',
        inspecaoDias: 30,
        ultimaInspecao: '2026-10-10',
        ultimaRecarga: '2025-09-01',
        ultimoTeste: '2024-01-01',
      },
      hoje,
    );
    expect(v.proximoVencimento).toEqual({ o: 'Recarga', data: '2026-09-01' });
    expect(v.vencido).toBe(true);
    expect(
      vencimentosDoEquipamento(
        {
          categoria: 'alarme',
          inspecaoDias: 30,
          ultimaInspecao: null,
          ultimaRecarga: null,
          ultimoTeste: null,
        },
        hoje,
      ).proximoVencimento,
    ).toEqual({ o: 'Inspeção', data: hoje });
  });
});
