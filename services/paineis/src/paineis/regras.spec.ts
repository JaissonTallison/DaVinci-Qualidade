import type { Prazo } from '@davinci/types';
import { itensDoAviso, montarAviso } from './regras.js';

const p = (data: string, situacao: Prazo['situacao']): Prazo => ({
  modulo: 'qualidade',
  tipo: 'NC',
  descricao: 'NC-2026-001 · Etiqueta ilegível',
  data,
  situacao,
  href: '/x',
});

describe('aviso diário', () => {
  it('leva vencidos e os próximos 7 dias; o resto fica só no painel', () => {
    const itens = itensDoAviso(
      [
        p('2026-10-30', 'vence_em_breve'),
        p('2026-10-20', 'vence_em_breve'),
        p('2026-10-01', 'vencido'),
      ],
      '2026-10-15',
    );
    expect(itens.map((i) => i.data)).toEqual(['2026-10-01', '2026-10-20']);
  });

  it('assunto conta vencidos e próximos; linha diz o módulo e o tipo', () => {
    const e = montarAviso(
      'ana@x.com',
      'Ana Prado',
      'Metalúrgica Sul',
      [p('2026-10-01', 'vencido'), p('2026-10-20', 'vence_em_breve')],
      'http://localhost:3170/',
    );
    expect(e.assunto).toBe(
      'Metalúrgica Sul: 1 prazo vencido, 1 nos próximos 7 dias',
    );
    expect(e.paragrafos[1]).toBe(
      'Venceu em 01/10/2026 · Qualidade · NC: NC-2026-001 · Etiqueta ilegível',
    );
    expect(e.botao?.url).toBe('http://localhost:3170/paineis/vencimentos');
  });
});
