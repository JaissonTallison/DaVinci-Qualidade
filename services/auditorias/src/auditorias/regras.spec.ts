import {
  contagemPorTipo,
  formatarNumeroAuditoria,
  gravidadeDaNc,
  ncsPendentes,
  recusaDaAcao,
} from './regras.js';

describe('ciclo da auditoria', () => {
  it('constatações só com a auditoria em andamento', () => {
    expect(recusaDaAcao('constatar', 'em_andamento')).toBeNull();
    expect(recusaDaAcao('constatar', 'planejada')).toBe(
      'Para registrar constatações, ela precisa estar "Em andamento". Hoje está "Planejada".',
    );
  });

  it('concluída e cancelada não aceitam mais nada', () => {
    for (const acao of [
      'editar',
      'iniciar',
      'constatar',
      'concluir',
      'cancelar',
    ] as const) {
      expect(recusaDaAcao(acao, 'concluida')).not.toBeNull();
      expect(recusaDaAcao(acao, 'cancelada')).not.toBeNull();
    }
  });
});

describe('constatações', () => {
  const lista = [
    { tipo: 'nc_maior', ncId: null },
    { tipo: 'nc_menor', ncId: 'formalizada' },
    { tipo: 'observacao', ncId: null },
    { tipo: 'conformidade', ncId: null },
  ];

  it('só NC maior e menor sem NC formalizada ficam pendentes', () => {
    expect(ncsPendentes(lista)).toBe(1);
  });

  it('conta por tipo, com zero para os ausentes', () => {
    expect(contagemPorTipo(lista)).toEqual({
      conformidade: 1,
      nc_maior: 1,
      nc_menor: 1,
      observacao: 1,
      oportunidade: 0,
    });
  });

  it('gravidade da NC e número', () => {
    expect([gravidadeDaNc('nc_maior'), gravidadeDaNc('nc_menor')]).toEqual([
      'alta',
      'media',
    ]);
    expect(formatarNumeroAuditoria(2026, 3)).toBe('AUD-2026-003');
  });
});
