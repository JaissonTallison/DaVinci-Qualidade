import { ErroDeNegocio, hojeEmBrasilia, somarDias } from '@davinci/shared';
import {
  uuidv7,
  type Contexto,
  type ErroPadrao,
  type NovoRisco,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { PgrService } from './pgr.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let servico: PgrService;
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

const ruido = (extra: Partial<NovoRisco> = {}): NovoRisco => ({
  grupo: 'fisico',
  local: 'Estamparia',
  perigo: 'Ruído das prensas',
  danos: 'Perda auditiva induzida por ruído',
  severidade: 3,
  probabilidade: 3,
  controles: 'Protetor auricular tipo plug',
  acoes: 'Enclausurar a prensa P-04',
  responsavel: 'Engenharia de manutenção',
  prazo: somarDias(hoje, 60),
  ...extra,
});

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  servico = new PgrService(banco.db);
});
afterAll(() => banco.encerrar());

describe('PGR', () => {
  it('nível pela matriz; alto ou crítico exige medidas, responsável e prazo', async () => {
    const r = await recusa(
      servico.criar(
        ctx,
        ruido({ acoes: undefined, responsavel: undefined, prazo: undefined }),
      ),
    );
    expect(r.detalhes?.map((d) => d.campo).sort()).toEqual([
      'acoes',
      'prazo',
      'responsavel',
    ]);
    expect((await servico.criar(ctx, ruido())).nivel).toBe('alto');
    const baixo = await servico.criar(
      ctx,
      ruido({
        grupo: 'ergonomico',
        perigo: 'Postura em pé',
        severidade: 1,
        probabilidade: 2,
        acoes: undefined,
        responsavel: undefined,
        prazo: undefined,
      }),
    );
    expect(baixo.nivel).toBe('baixo');
  });

  it('mais graves primeiro; prazo vencido conta no resumo; reavaliar baixa o nível', async () => {
    const critico = await servico.criar(
      ctx,
      ruido({
        grupo: 'acidente',
        perigo: 'Prensa sem proteção',
        severidade: 4,
        probabilidade: 4,
        prazo: somarDias(hoje, -1),
      }),
    );
    expect((await servico.listar(ctx, {})).map((r) => r.nivel)).toEqual([
      'critico',
      'alto',
      'baixo',
    ]);
    expect(await servico.resumo(ctx)).toEqual({
      criticos: 1,
      altos: 1,
      acoesVencidas: 1,
    });
    const reavaliado = await servico.atualizar(ctx, {
      id: critico.id,
      alteracoes: {
        ...ruido({
          grupo: 'acidente',
          perigo: 'Prensa sem proteção',
          severidade: 4,
          probabilidade: 1,
        }),
        versao: critico.versao,
      },
    });
    expect(reavaliado).toMatchObject({ nivel: 'moderado', acaoVencida: false });
    expect((await servico.listar(ctx, { nivel: 'critico' })).length).toBe(0);
  });
});
