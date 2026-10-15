import {
  ErroDeNegocio,
  hojeEmBrasilia,
  somarDias,
  somarMeses,
} from '@davinci/shared';
import {
  uuidv7,
  type Contexto,
  type ErroPadrao,
  type NovoRegistroSst,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { RegistrosService } from './registros.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let servico: RegistrosService;
const ctx: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};
const hoje = hojeEmBrasilia();

async function recusa(promessa: Promise<unknown>): Promise<ErroPadrao> {
  try {
    await promessa;
  } catch (e) {
    if (e instanceof ErroDeNegocio) return e.getError() as ErroPadrao;
    throw e;
  }
  throw new Error('Era esperada uma recusa.');
}

const dds = (extra: Partial<NovoRegistroSst> = {}): NovoRegistroSst => ({
  tipo: 'dds',
  data: hoje,
  tema: 'Uso do protetor auricular',
  responsavel: 'Marcos Reis',
  participantes: 18,
  conteudo: 'Colocação correta do plug e troca quando sujo.',
  ...extra,
});

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  servico = new RegistrosService(banco.db);
});
afterAll(() => banco.encerrar());

describe('registros de segurança', () => {
  it('não aceita data futura; resumo conta DDS do mês e vê CIPA e simulado em dia', async () => {
    expect(
      (await recusa(servico.criar(ctx, dds({ data: somarDias(hoje, 1) }))))
        .detalhes?.[0]?.campo,
    ).toBe('data');
    expect(await servico.resumo(ctx)).toMatchObject({
      ddsNoMes: 0,
      cipaEmDia: false,
      simuladoEmDia: false,
    });
    const d = await servico.criar(ctx, dds());
    await servico.criar(
      ctx,
      dds({
        tipo: 'reuniao_cipa',
        tema: 'Reunião ordinária',
        conteudo: 'Análise dos acidentes do mês.',
      }),
    );
    await servico.criar(
      ctx,
      dds({
        tipo: 'simulado',
        data: somarMeses(hoje, -13),
        tema: 'Abandono de área',
        conteudo: 'Evacuação em 4 minutos.',
      }),
    );
    expect(await servico.resumo(ctx)).toMatchObject({
      ddsNoMes: 1,
      cipaEmDia: true,
      simuladoEmDia: false,
      ultimaReuniaoCipa: hoje,
    });
    await servico.anular(ctx, {
      id: d.id,
      alteracoes: { motivo: 'Lançado em duplicidade.' },
    });
    expect((await servico.resumo(ctx)).ddsNoMes).toBe(0);
    expect(
      (await servico.listar(ctx, { tipo: 'dds' })).itens[0]?.motivoAnulacao,
    ).toBe('Lançado em duplicidade.');
  });
});
