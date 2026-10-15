import {
  contarNaoConformes,
  contarRespondidos,
  formatarNumeroInspecao,
  pendenciasParaConcluir,
  recusaPorStatusFinal,
  resultadoDaInspecao,
} from './regras.js';

const item = (
  ordem: number,
  resposta: 'ok' | 'nok' | 'na' | null,
  observacao: string | null = null,
) => ({ ordem, resposta, observacao });

describe('resultado', () => {
  it('um NOK reprova; OK e N/A aprovam', () => {
    expect(
      resultadoDaInspecao([
        item(0, 'ok'),
        item(1, 'na'),
        item(2, 'nok', 'Riscado'),
      ]),
    ).toBe('reprovada');
    expect(resultadoDaInspecao([item(0, 'ok'), item(1, 'na')])).toBe(
      'aprovada',
    );
  });

  it('tudo N/A aprova: nada foi encontrado fora do critério', () => {
    expect(resultadoDaInspecao([item(0, 'na')])).toBe('aprovada');
  });
});

describe('para concluir', () => {
  it('item sem resposta e NOK sem observação impedem, apontando o item', () => {
    expect(
      pendenciasParaConcluir([
        item(0, 'ok'),
        item(1, null),
        item(2, 'nok', '  '),
      ]),
    ).toEqual([
      { campo: 'itens.1.resposta', mensagem: 'Responda o item 2.' },
      {
        campo: 'itens.2.observacao',
        mensagem: 'Descreva o que foi encontrado no item 3 (NOK).',
      },
    ]);
  });

  it('tudo respondido e NOK descrito: pode concluir', () => {
    expect(
      pendenciasParaConcluir([
        item(0, 'ok'),
        item(1, 'nok', 'Diâmetro 10,3 mm'),
      ]),
    ).toEqual([]);
  });

  it('conta respondidos e NOK', () => {
    const itens = [
      item(0, 'ok'),
      item(1, null),
      item(2, 'nok', 'x'),
      item(3, 'na'),
    ];
    expect([contarRespondidos(itens), contarNaoConformes(itens)]).toEqual([
      3, 1,
    ]);
  });
});

describe('registro concluído', () => {
  it('aprovada, reprovada ou cancelada não muda mais', () => {
    expect(recusaPorStatusFinal('em_andamento')).toBeNull();
    expect(recusaPorStatusFinal('reprovada')).toBe(
      'A inspeção está reprovada: não aceita mais alterações.',
    );
  });

  it('número INS-AAAA-NNN', () => {
    expect(formatarNumeroInspecao(2026, 31)).toBe('INS-2026-031');
  });
});
