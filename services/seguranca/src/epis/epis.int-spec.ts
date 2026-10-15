import { of, throwError, type Observable } from 'rxjs';
import { ErroDeNegocio, hojeEmBrasilia, somarDias } from '@davinci/shared';
import {
  PATTERNS,
  uuidv7,
  type Contexto,
  type ErroPadrao,
  type Funcionario,
  type RegistrarEntrega,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { EpisService } from './epis.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let servico: EpisService;

const empresaA: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};
const empresaB: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};
const hoje = hojeEmBrasilia();

const pessoa = (extra: Partial<Funcionario>): Funcionario => ({
  id: uuidv7(),
  matricula: '1042',
  nome: 'João Pereira',
  cpf: '52998224725',
  setorId: uuidv7(),
  setorNome: 'Produção',
  funcaoId: uuidv7(),
  funcaoNome: 'Operador de prensa',
  admissao: '2024-03-01',
  email: null,
  telefone: null,
  ativo: true,
  desligamento: null,
  motivoDesligamento: null,
  versao: new Date().toISOString(),
  ...extra,
});
const joao = pessoa({});
const ana = pessoa({
  matricula: '2001',
  nome: 'Ana Prado',
  cpf: '11144477735',
});
const carlos = pessoa({
  matricula: '3001',
  nome: 'Carlos Lima',
  cpf: '39053344705',
  ativo: false,
  desligamento: hoje,
});
const recem = pessoa({
  matricula: '4001',
  nome: 'Rita Souza',
  cpf: '86853615085',
  admissao: hoje,
});

/** Codex falso: responde pelo cadastro abaixo e recusa com NAO_ENCONTRADO o que não conhece, como o real. */
const codex = {
  cadastro: new Map([joao, ana, carlos, recem].map((f) => [f.id, f])),
  pedidos: [] as { padrao: string; mensagem: unknown }[],
  send<R>(padrao: string, mensagem: unknown): Observable<R> {
    this.pedidos.push({ padrao, mensagem });
    const f = this.cadastro.get(
      (mensagem as { dados: { id: string } }).dados.id,
    );
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
let oculos: string;
const entrega = (extra: Partial<RegistrarEntrega> = {}): RegistrarEntrega => ({
  funcionarioId: joao.id,
  epiId: luva,
  quantidade: 1,
  data: hoje,
  motivo: 'primeira_entrega',
  termoAssinado: true,
  ...extra,
});

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  servico = new EpisService(banco.db, codex);
  luva = (
    await servico.criar(empresaA, {
      nome: 'Luva de vaqueta',
      ca: '32.157',
      validadeCa: somarDias(hoje, 400),
    })
  ).id;
  protetor = (
    await servico.criar(empresaA, {
      nome: 'Protetor auricular de espuma',
      ca: '5745',
      validadeCa: somarDias(hoje, 10),
      vidaUtilDias: 15,
    })
  ).id;
  oculos = (
    await servico.criar(empresaA, {
      nome: 'Óculos de proteção',
      ca: '10346',
      validadeCa: somarDias(hoje, -10),
    })
  ).id;
});
afterAll(() => banco.encerrar());

describe('catálogo', () => {
  it('CA guardado só com dígitos; nome + CA únicos na empresa; aviso de CA vencendo ou vencido', async () => {
    const lista = await servico.listar(empresaA, {});
    expect(
      lista.map((e) => [e.nome, e.ca, e.caVencido, e.caVenceEmBreve]),
    ).toEqual([
      ['Luva de vaqueta', '32157', false, false],
      ['Óculos de proteção', '10346', true, false],
      ['Protetor auricular de espuma', '5745', false, true],
    ]);
    const r = await recusa(
      servico.criar(empresaA, {
        nome: 'Luva de vaqueta',
        ca: '32157',
        validadeCa: hoje,
      }),
    );
    expect(r.detalhes).toEqual([
      {
        campo: 'nome',
        mensagem: 'Já existe este EPI com este CA no catálogo.',
      },
    ]);
    await servico.criar(empresaB, {
      nome: 'Luva de vaqueta',
      ca: '32157',
      validadeCa: hoje,
    });
    expect((await servico.listar(empresaB, {})).map((e) => e.nome)).toEqual([
      'Luva de vaqueta',
    ]);
  });

  it('inativo sai da lista e da entrega; versão velha é recusada', async () => {
    const capacete = await servico.criar(empresaA, {
      nome: 'Capacete classe B',
      ca: '29638',
      validadeCa: somarDias(hoje, 200),
    });
    const inativo = await servico.mudarSituacao(empresaA, {
      id: capacete.id,
      alteracoes: { versao: capacete.versao, ativo: false },
    });
    expect((await servico.listar(empresaA, {})).map((e) => e.id)).not.toContain(
      capacete.id,
    );
    expect(
      (await servico.listar(empresaA, { situacao: 'inativos' })).map(
        (e) => e.id,
      ),
    ).toEqual([capacete.id]);
    expect(
      (
        await recusa(
          servico.mudarSituacao(empresaA, {
            id: capacete.id,
            alteracoes: { versao: capacete.versao, ativo: true },
          }),
        )
      ).codigo,
    ).toBe('CONFLITO');
    expect(
      (
        await recusa(
          servico.registrarEntrega(empresaA, entrega({ epiId: inativo.id })),
        )
      ).detalhes,
    ).toEqual([{ campo: 'epiId', mensagem: 'EPI não encontrado ou inativo.' }]);
  });
});

describe('entregas', () => {
  it('confere o funcionário no Codex e guarda nome, matrícula e o CA do dia', async () => {
    codex.pedidos.length = 0;
    const e = await servico.registrarEntrega(empresaA, entrega());
    expect(codex.pedidos).toEqual([
      {
        padrao: PATTERNS.funcionarios.obter,
        mensagem: { contexto: empresaA, dados: { id: joao.id } },
      },
    ]);
    expect(e).toMatchObject({
      funcionarioNome: 'João Pereira',
      funcionarioMatricula: '1042',
      epiNome: 'Luva de vaqueta',
      ca: '32157',
      proximaTroca: null,
      situacao: 'em_uso',
    });
  });

  it('recusa CA vencido no dia, funcionário desconhecido ou desligado, data futura e anterior à admissão', async () => {
    expect(
      (
        await recusa(
          servico.registrarEntrega(empresaA, entrega({ epiId: oculos })),
        )
      ).detalhes?.[0]?.mensagem,
    ).toBe(
      `O CA 10346 venceu em ${somarDias(hoje, -10).split('-').reverse().join('/')}: EPI sem CA válido não pode ser entregue (NR-6).`,
    );
    // Entregue antes do vencimento do CA, vale: a regra olha o CA na data da entrega.
    await servico.registrarEntrega(
      empresaA,
      entrega({ epiId: oculos, data: somarDias(hoje, -20) }),
    );
    expect(
      (
        await recusa(
          servico.registrarEntrega(
            empresaA,
            entrega({ funcionarioId: uuidv7() }),
          ),
        )
      ).detalhes,
    ).toEqual([
      { campo: 'funcionarioId', mensagem: 'Funcionário não encontrado.' },
    ]);
    expect(
      (
        await recusa(
          servico.registrarEntrega(
            empresaA,
            entrega({ funcionarioId: carlos.id }),
          ),
        )
      ).detalhes?.[0]?.mensagem,
    ).toBe(
      'Carlos Lima está desligado: EPI só é entregue a funcionário ativo.',
    );
    expect(
      (
        await recusa(
          servico.registrarEntrega(
            empresaA,
            entrega({ data: somarDias(hoje, 1) }),
          ),
        )
      ).detalhes?.[0]?.campo,
    ).toBe('data');
    expect(
      (
        await recusa(
          servico.registrarEntrega(
            empresaA,
            entrega({ funcionarioId: recem.id, data: somarDias(hoje, -1) }),
          ),
        )
      ).detalhes,
    ).toEqual([
      {
        campo: 'data',
        mensagem: 'A entrega não pode ser anterior à admissão do funcionário.',
      },
    ]);
  });

  it('vida útil marca a próxima troca; passou sem devolução, troca vencida; devolver encerra', async () => {
    const vencida = await servico.registrarEntrega(
      empresaA,
      entrega({
        funcionarioId: ana.id,
        epiId: protetor,
        data: somarDias(hoje, -20),
        termoAssinado: false,
      }),
    );
    expect(vencida).toMatchObject({
      proximaTroca: somarDias(hoje, -5),
      situacao: 'troca_vencida',
    });
    expect(
      (
        await servico.listarEntregas(empresaA, { situacao: 'troca_vencida' })
      ).itens.map((e) => e.id),
    ).toEqual([vencida.id]);
    expect(await servico.resumo(empresaA)).toEqual({
      trocasVencidas: 1,
      semTermo: 1,
      casVencendo: 2,
    });

    expect(
      (
        await recusa(
          servico.devolver(empresaA, {
            id: vencida.id,
            alteracoes: { data: somarDias(hoje, -21) },
          }),
        )
      ).detalhes?.[0]?.mensagem,
    ).toBe('A devolução não pode ser anterior à entrega.');
    const devolvida = await servico.devolver(empresaA, {
      id: vencida.id,
      alteracoes: { data: hoje },
    });
    expect(devolvida).toMatchObject({
      devolvidoEm: hoje,
      situacao: 'devolvido',
    });
    expect(
      (
        await recusa(
          servico.devolver(empresaA, {
            id: vencida.id,
            alteracoes: { data: hoje },
          }),
        )
      ).mensagem,
    ).toBe('Este EPI já foi devolvido.');
    expect(await servico.resumo(empresaA)).toMatchObject({
      trocasVencidas: 0,
      semTermo: 0,
    });
  });

  it('anular deixa na ficha com o motivo e tira das contas; outra empresa não enxerga', async () => {
    const errada = await servico.registrarEntrega(
      empresaA,
      entrega({ funcionarioId: ana.id, termoAssinado: false }),
    );
    expect((await servico.resumo(empresaA)).semTermo).toBe(1);
    expect(
      (
        await recusa(
          servico.anular(empresaA, {
            id: errada.id,
            alteracoes: { motivo: 'curto' },
          }),
        )
      ).detalhes?.[0]?.campo,
    ).toBe('motivo');
    const anulada = await servico.anular(empresaA, {
      id: errada.id,
      alteracoes: { motivo: 'Registrada para a pessoa errada.' },
    });
    expect(anulada).toMatchObject({
      situacao: 'anulada',
      motivoAnulacao: 'Registrada para a pessoa errada.',
    });
    expect((await servico.resumo(empresaA)).semTermo).toBe(0);

    const fichaDaAna = await servico.listarEntregas(empresaA, {
      funcionarioId: ana.id,
    });
    expect(fichaDaAna.itens.map((e) => e.situacao)).toEqual([
      'anulada',
      'devolvido',
    ]);
    expect(
      (
        await servico.listarEntregas(empresaA, { situacao: 'em_uso' })
      ).itens.every((e) => e.funcionarioId === joao.id),
    ).toBe(true);
    expect(
      (await servico.listarEntregas(empresaA, { epiId: protetor })).itens.map(
        (e) => e.funcionarioNome,
      ),
    ).toEqual(['Ana Prado']);
    expect((await servico.listarEntregas(empresaB, {})).total).toBe(0);
    expect(
      (
        await recusa(
          servico.anular(empresaB, {
            id: errada.id,
            alteracoes: { motivo: 'Tentativa de outra empresa.' },
          }),
        )
      ).codigo,
    ).toBe('NAO_ENCONTRADO');
  });
});
