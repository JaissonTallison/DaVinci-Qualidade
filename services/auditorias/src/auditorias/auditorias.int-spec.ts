import { of, throwError, type Observable } from 'rxjs';
import { ErroDeNegocio, hojeEmBrasilia, somarDias } from '@davinci/shared';
import {
  PATTERNS,
  uuidv7,
  type Auditoria,
  type Contexto,
  type ErroPadrao,
  type NovaAuditoria,
  type NovaConstatacao,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { AuditoriasService } from './auditorias.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let servico: AuditoriasService;

/** Qualidade falso: registra os pedidos e responde o que o teste mandar. */
const qualidade = {
  pedidos: [] as { padrao: string; mensagem: any }[],
  resposta: (): Observable<unknown> => of({}),
  send<R>(padrao: string, mensagem: unknown): Observable<R> {
    this.pedidos.push({ padrao, mensagem });
    return this.resposta() as Observable<R>;
  },
};

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
const ano = Number(hoje.slice(0, 4));

const interna: NovaAuditoria = {
  tipo: 'interna',
  escopo: 'Processos de produção e expedição da unidade Sorocaba.',
  normas: ['iso9001', 'iso14001'],
  areas: 'Produção, Expedição',
  auditorLider: 'Paula Ribeiro',
  representante: 'Carlos Menezes',
  dataInicio: hoje,
  dataFim: hoje,
};
const ncMaior: NovaConstatacao = {
  tipo: 'nc_maior',
  norma: 'iso9001',
  clausula: '7.1.5',
  area: 'Produção',
  descricao: 'Instrumentos de medição em uso sem calibração válida na linha 2.',
  evidencia:
    'Paquímetro PAQ-0042 com calibração vencida em agosto, em uso no turno da manhã.',
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

const acao = (a: Auditoria, alteracoes: Record<string, unknown>) => ({
  id: a.id,
  alteracoes: { versao: a.versao, ...alteracoes },
});

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  servico = new AuditoriasService(banco.db, qualidade);
});
afterAll(() => banco.encerrar());
beforeEach(() => {
  qualidade.pedidos = [];
  qualidade.resposta = () => of({ id: uuidv7(), numero: 'NC-2026-014' });
});

describe('ciclo', () => {
  it('planejada → em andamento → concluída; constatação só em andamento; concluir exige NC formalizada', async () => {
    let a = await servico.criar(empresaA, interna);
    expect(a).toMatchObject({
      numero: `AUD-${ano}-001`,
      status: 'planejada',
      normas: ['iso9001', 'iso14001'],
    });
    expect(
      (
        await recusa(
          servico.registrarConstatacao(
            empresaA,
            acao(a, { constatacao: ncMaior }),
          ),
        )
      ).codigo,
    ).toBe('REGRA_DE_NEGOCIO');

    a = await servico.iniciar(empresaA, acao(a, {}));
    a = await servico.registrarConstatacao(
      empresaA,
      acao(a, { constatacao: ncMaior }),
    );
    a = await servico.registrarConstatacao(
      empresaA,
      acao(a, {
        constatacao: {
          tipo: 'observacao',
          norma: 'iso14001',
          descricao:
            'Coleta seletiva sem identificação nas lixeiras do refeitório.',
        },
      }),
    );
    expect(a).toMatchObject({
      ncsPendentes: 1,
      contagem: { nc_maior: 1, observacao: 1, conformidade: 0 },
    });

    const pendente = await recusa(
      servico.concluir(
        empresaA,
        acao(a, {
          conclusao:
            'Sistema implementado, com uma NC maior em controle de instrumentos.',
        }),
      ),
    );
    expect(pendente.mensagem).toBe(
      'Formalize a NC pendente antes de concluir: NC de auditoria precisa de registro para tratamento.',
    );

    a = await servico.formalizarNc(
      empresaA,
      acao(a, {
        constatacaoId: a.constatacoes[0]!.id,
        responsavel: 'Carlos Menezes',
      }),
    );
    expect(a.constatacoes[0]).toMatchObject({ ncNumero: 'NC-2026-014' });
    expect(a.ncsPendentes).toBe(0);

    a = await servico.concluir(
      empresaA,
      acao(a, {
        conclusao:
          'Sistema implementado, com uma NC maior em controle de instrumentos.',
      }),
    );
    expect(a.status).toBe('concluida');
    expect(
      (
        await recusa(
          servico.cancelar(
            empresaA,
            acao(a, { motivo: 'Tentativa depois de concluída.' }),
          ),
        )
      ).codigo,
    ).toBe('REGRA_DE_NEGOCIO');
  });
});

describe('formalizar NC no serviço qualidade', () => {
  it('manda ao qualidade a NC com origem, referência, requisito, evidência, gravidade e prazo de 30 dias, no contexto de quem pediu', async () => {
    let a = await servico.iniciar(
      empresaA,
      acao(await servico.criar(empresaA, interna), {}),
    );
    a = await servico.registrarConstatacao(
      empresaA,
      acao(a, { constatacao: { ...ncMaior, tipo: 'nc_menor' } }),
    );
    await servico.formalizarNc(
      empresaA,
      acao(a, {
        constatacaoId: a.constatacoes[0]!.id,
        responsavel: 'Carlos Menezes',
      }),
    );
    expect(qualidade.pedidos).toHaveLength(1);
    const { padrao, mensagem } = qualidade.pedidos[0]!;
    expect(padrao).toBe(PATTERNS.naoConformidades.criar);
    expect(mensagem.contexto).toEqual(empresaA);
    expect(mensagem.dados).toMatchObject({
      titulo: `${a.numero} ISO 9001:2015 7.1.5: Instrumentos de medição em uso sem calibração válida na linha 2.`,
      origem: 'auditoria',
      origemRef: a.numero,
      tipo: 'sistema',
      gravidade: 'media',
      setor: 'Produção',
      responsavel: 'Carlos Menezes',
      prazo: somarDias(hoje, 30),
    });
    expect(mensagem.dados.descricao).toContain(
      'Evidência: Paquímetro PAQ-0042',
    );
  });

  it('recusa do qualidade volta com os campos e nada é gravado; depois, a mesma constatação formaliza', async () => {
    let a = await servico.iniciar(
      empresaA,
      acao(await servico.criar(empresaA, interna), {}),
    );
    a = await servico.registrarConstatacao(
      empresaA,
      acao(a, { constatacao: ncMaior }),
    );
    qualidade.resposta = () =>
      throwError(() => ({
        codigo: 'DADOS_INVALIDOS',
        mensagem: 'Verifique os campos destacados.',
        detalhes: [
          {
            campo: 'prazo',
            mensagem: 'O prazo não pode ser anterior à data de abertura.',
          },
        ],
      }));
    const r = await recusa(
      servico.formalizarNc(
        empresaA,
        acao(a, {
          constatacaoId: a.constatacoes[0]!.id,
          responsavel: 'Carlos Menezes',
          prazo: '2020-01-01',
        }),
      ),
    );
    expect(r.detalhes).toEqual([
      {
        campo: 'prazo',
        mensagem: 'O prazo não pode ser anterior à data de abertura.',
      },
    ]);
    const depois = await servico.obter(empresaA, { id: a.id });
    expect(depois.constatacoes[0]!.ncId).toBeNull();
    expect(depois.versao).toBe(a.versao); // a transação foi desfeita

    qualidade.resposta = () => of({ id: uuidv7(), numero: 'NC-2026-020' });
    const ok = await servico.formalizarNc(
      empresaA,
      acao(depois, {
        constatacaoId: a.constatacoes[0]!.id,
        responsavel: 'Carlos Menezes',
      }),
    );
    expect(ok.constatacoes[0]!.ncNumero).toBe('NC-2026-020');
    const deNovo = await recusa(
      servico.formalizarNc(
        empresaA,
        acao(ok, {
          constatacaoId: a.constatacoes[0]!.id,
          responsavel: 'Carlos Menezes',
        }),
      ),
    );
    expect(deNovo.mensagem).toBe('Esta constatação já virou a NC-2026-020.');
  });

  it('observação não vira NC; constatação formalizada não se altera', async () => {
    let a = await servico.iniciar(
      empresaA,
      acao(await servico.criar(empresaA, interna), {}),
    );
    a = await servico.registrarConstatacao(
      empresaA,
      acao(a, { constatacao: { ...ncMaior, tipo: 'observacao' } }),
    );
    expect(
      (
        await recusa(
          servico.formalizarNc(
            empresaA,
            acao(a, {
              constatacaoId: a.constatacoes[0]!.id,
              responsavel: 'Carlos Menezes',
            }),
          ),
        )
      ).mensagem,
    ).toBe('"Observação" não vira NC: só NC maior ou menor.');
    expect(qualidade.pedidos).toHaveLength(0);

    a = await servico.registrarConstatacao(
      empresaA,
      acao(a, { constatacao: ncMaior }),
    );
    a = await servico.formalizarNc(
      empresaA,
      acao(a, {
        constatacaoId: a.constatacoes[1]!.id,
        responsavel: 'Carlos Menezes',
      }),
    );
    const r = await recusa(
      servico.alterarConstatacao(
        empresaA,
        acao(a, {
          constatacaoId: a.constatacoes[1]!.id,
          constatacao: {
            ...ncMaior,
            descricao: 'Texto corrigido depois de virar NC.',
          },
        }),
      ),
    );
    expect(r.mensagem).toContain('Corrija na própria NC.');
  });
});

describe('normas e acesso', () => {
  it('constatação numa norma fora da auditoria é recusada; tirar norma com constatação também', async () => {
    let a = await servico.iniciar(
      empresaA,
      acao(await servico.criar(empresaA, interna), {}),
    );
    expect(
      (
        await recusa(
          servico.registrarConstatacao(
            empresaA,
            acao(a, { constatacao: { ...ncMaior, norma: 'iso45001' } }),
          ),
        )
      ).detalhes,
    ).toEqual([
      {
        campo: 'constatacao.norma',
        mensagem: 'A ISO 45001:2018 não está entre as normas desta auditoria.',
      },
    ]);
    a = await servico.registrarConstatacao(
      empresaA,
      acao(a, {
        constatacao: { ...ncMaior, tipo: 'observacao', norma: 'iso14001' },
      }),
    );
    const r = await recusa(
      servico.atualizar(empresaA, acao(a, { ...interna, normas: ['iso9001'] })),
    );
    expect(r.detalhes?.[0]).toEqual({
      campo: 'normas',
      mensagem:
        'Há constatação na ISO 14001:2015: mantenha essa norma na auditoria.',
    });
  });

  it('fim antes do início é recusado; outra empresa não enxerga', async () => {
    expect(
      (
        await recusa(
          servico.criar(empresaA, { ...interna, dataFim: somarDias(hoje, -1) }),
        )
      ).detalhes?.[0]?.campo,
    ).toBe('dataFim');
    const a = await servico.criar(empresaA, interna);
    expect((await recusa(servico.obter(empresaB, { id: a.id }))).codigo).toBe(
      'NAO_ENCONTRADO',
    );
  });
});
