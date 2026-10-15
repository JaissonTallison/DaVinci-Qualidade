import { agoraEmBrasilia, ErroDeNegocio } from '@davinci/shared';
import {
  uuidv7,
  type Contexto,
  type ErroPadrao,
  type NovaPt,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { PtsService } from './pts.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let servico: PtsService;
const empresaId = uuidv7();
const tecnico: Contexto = {
  empresaId,
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};
const supervisor: Contexto = {
  empresaId,
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};

const daqui = (horas: number) =>
  agoraEmBrasilia(new Date(Date.now() + horas * 3_600_000));

async function recusa(promessa: Promise<unknown>): Promise<ErroPadrao> {
  try {
    await promessa;
  } catch (e) {
    if (e instanceof ErroDeNegocio) return e.getError() as ErroPadrao;
    throw e;
  }
  throw new Error('Era esperada uma recusa.');
}

const telhado = (extra: Partial<NovaPt> = {}): NovaPt => ({
  tipo: 'altura',
  local: 'Telhado do galpão 2',
  servico: 'Troca de telhas translúcidas quebradas',
  executantes: 'Paulo Souza e Ivan Rocha (Telhas Sul Ltda.)',
  inicio: daqui(1),
  fim: daqui(5),
  riscos:
    'Queda de altura: linha de vida instalada, cinto paraquedista com duplo talabarte.',
  ...extra,
});

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  servico = new PtsService(banco.db);
});
afterAll(() => banco.encerrar());

describe('Permissão de trabalho', () => {
  it('vale no máximo 12 horas; numera PT-AAAA-NNN', async () => {
    expect(
      (await recusa(servico.criar(tecnico, telhado({ fim: daqui(14) }))))
        .detalhes?.[0]?.campo,
    ).toBe('fim');
    const pt = await servico.criar(tecnico, telhado());
    expect(pt.numero).toMatch(/^PT-\d{4}-001$/);
    expect(pt).toMatchObject({ status: 'solicitada', solicitadaPorMim: true });
  });

  it('quem pediu não libera; liberada com o fim passado aparece vencida até encerrar', async () => {
    const pt = await servico.criar(tecnico, telhado());
    expect(
      (
        await recusa(
          servico.liberar(tecnico, {
            id: pt.id,
            alteracoes: { versao: pt.versao },
          }),
        )
      ).mensagem,
    ).toBe(
      'Quem solicitou a PT não pode liberá-la: peça a outra pessoa autorizada.',
    );
    let liberada = await servico.liberar(supervisor, {
      id: pt.id,
      alteracoes: { versao: pt.versao },
    });
    expect(liberada.status).toBe('liberada');
    // O serviço passou do horário: simula o fim já vencido
    await banco.db.update(schema.permissoesDeTrabalho).set({ fim: daqui(-1) });
    liberada = await servico.obter(tecnico, { id: pt.id });
    expect(liberada.vencida).toBe(true);
    expect((await servico.resumo(tecnico)).vencidas).toBe(1);
    const encerrada = await servico.encerrar(tecnico, {
      id: pt.id,
      alteracoes: {
        versao: liberada.versao,
        observacao: 'Área liberada e limpa.',
      },
    });
    expect(encerrada).toMatchObject({ status: 'encerrada', vencida: false });
    expect(
      (
        await recusa(
          servico.cancelar(tecnico, {
            id: pt.id,
            alteracoes: {
              versao: encerrada.versao,
              motivo: 'Tentativa depois de encerrar.',
            },
          }),
        )
      ).codigo,
    ).toBe('REGRA_DE_NEGOCIO');
  });
});
