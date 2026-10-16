import { of, throwError, type Observable } from 'rxjs';
import { ErroDeNegocio, hojeEmBrasilia, somarDias } from '@davinci/shared';
import {
  PATTERNS,
  uuidv7,
  type Contexto,
  type ErroPadrao,
  type Funcionario,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { EpisService } from '../epis/epis.service.js';
import { PgrService } from '../pgr/pgr.service.js';
import { CompetenciasEpisService } from './competencias.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let s: CompetenciasEpisService;
let epis: EpisService;
const ctx: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};
const hoje = hojeEmBrasilia();
const funcaoId = uuidv7();

const pessoa = (matricula: string, nome: string): Funcionario => ({
  id: uuidv7(),
  matricula,
  nome,
  cpf: '52998224725',
  setorId: uuidv7(),
  setorNome: 'Produção',
  funcaoId,
  funcaoNome: 'Operador de prensa',
  admissao: '2024-03-01',
  email: null,
  telefone: null,
  ativo: true,
  desligamento: null,
  motivoDesligamento: null,
  versao: new Date().toISOString(),
});
const ana = pessoa('2001', 'Ana Prado');
const joao = pessoa('1042', 'João Pereira');

/** Codex falso: funções, a pessoa e a lista de ativos da função. */
const codex = {
  send<R>(padrao: string, mensagem: unknown): Observable<R> {
    const d = (mensagem as { dados: Record<string, unknown> }).dados;
    if (padrao === PATTERNS.funcoes.listar)
      return of([
        { id: funcaoId, nome: 'Operador de prensa' },
      ]) as Observable<R>;
    if (padrao === PATTERNS.funcionarios.listar)
      return of({
        itens: d.funcaoId === funcaoId ? [ana, joao] : [],
        total: d.funcaoId === funcaoId ? 2 : 0,
        pagina: 1,
        porPagina: 100,
      }) as Observable<R>;
    const f = [ana, joao].find((p) => p.id === d.id);
    return (
      f
        ? of(f)
        : throwError(() => ({
            codigo: 'NAO_ENCONTRADO',
            mensagem: 'Funcionário não encontrado.',
          }))
    ) as Observable<R>;
  },
};

async function recusa(promessa: Promise<unknown>): Promise<ErroPadrao> {
  try {
    await promessa;
  } catch (e) {
    if (e instanceof ErroDeNegocio) return e.getError() as ErroPadrao;
    throw e;
  }
  throw new Error('Era esperada uma recusa.');
}

let luva: string;
let protetor: string;
let ruido: string;

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  s = new CompetenciasEpisService(banco.db, codex);
  epis = new EpisService(banco.db, codex);
  luva = (
    await epis.criar(ctx, {
      nome: 'Luva de vaqueta',
      ca: '32157',
      validadeCa: somarDias(hoje, 400),
    })
  ).id;
  protetor = (
    await epis.criar(ctx, {
      nome: 'Protetor auricular',
      ca: '5745',
      validadeCa: somarDias(hoje, 400),
      vidaUtilDias: 15,
    })
  ).id;
  ruido = (
    await new PgrService(banco.db).criar(ctx, {
      grupo: 'fisico',
      local: 'Prensas',
      perigo: 'Ruído contínuo acima de 85 dB(A)',
      danos: 'Perda auditiva induzida por ruído',
      severidade: 2,
      probabilidade: 2,
    })
  ).id;
});
afterAll(() => banco.encerrar());

describe('EPIs exigidos pela função', () => {
  it('define a lista com o risco do PGR e recusa EPI ou risco desconhecido', async () => {
    const r = await s.definirEpis(ctx, {
      funcaoId,
      itens: [
        { epiId: protetor, riscoId: ruido },
        { epiId: luva },
        { epiId: luva },
      ],
    });
    expect(r.map((x) => [x.nome, x.motivo])).toEqual([
      ['Luva de vaqueta', null],
      ['Protetor auricular', 'Ruído contínuo acima de 85 dB(A)'],
    ]);
    expect(
      (
        await recusa(
          s.definirEpis(ctx, { funcaoId, itens: [{ epiId: uuidv7() }] }),
        )
      ).codigo,
    ).toBe('DADOS_INVALIDOS');
    expect(
      (
        await recusa(
          s.definirEpis(ctx, {
            funcaoId,
            itens: [{ epiId: luva, riscoId: uuidv7() }],
          }),
        )
      ).mensagem,
    ).toBe('Risco não encontrado no PGR.');
    expect(
      (await recusa(s.definirEpis(ctx, { funcaoId: uuidv7(), itens: [] })))
        .codigo,
    ).toBe('NAO_ENCONTRADO');
  });

  it('conformidade: entrega em uso atende; devolvida ou troca vencida não', async () => {
    await epis.registrarEntrega(ctx, {
      funcionarioId: joao.id,
      epiId: luva,
      quantidade: 1,
      data: hoje,
      motivo: 'primeira_entrega',
      termoAssinado: true,
    });
    await epis.registrarEntrega(ctx, {
      funcionarioId: joao.id,
      epiId: protetor,
      quantidade: 1,
      data: somarDias(hoje, -20),
      motivo: 'primeira_entrega',
      termoAssinado: true,
    });
    const c = await s.conformidade(ctx, { funcionarioId: joao.id });
    expect(
      Object.fromEntries(c.requisitos.map((r) => [r.nome, r.situacao])),
    ).toEqual({
      'Luva de vaqueta': 'em_dia',
      'Protetor auricular': 'vencido',
    });
    expect(c.pendentes).toBe(1);

    const m = await s.matriz(ctx, { funcaoId });
    expect(m.linhas.map((l) => [l.nome, l.pendentes])).toEqual([
      ['Ana Prado', 2],
      ['João Pereira', 1],
    ]);
    expect(m.linhas[1]!.situacoes[`epi:${luva}`]).toBe('em_dia');
  });
});
