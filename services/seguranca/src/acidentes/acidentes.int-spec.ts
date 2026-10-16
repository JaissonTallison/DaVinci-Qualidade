import { of, throwError, type Observable } from 'rxjs';
import { eq } from 'drizzle-orm';
import { ErroDeNegocio, hojeEmBrasilia, somarDias } from '@davinci/shared';
import {
  uuidv7,
  type Acidente,
  type Contexto,
  type ErroPadrao,
  type NovoAcidente,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { acidentes } from '../db/schema.js';
import { AcidentesService } from './acidentes.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let servico: AcidentesService;

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

const corte: NovoAcidente = {
  tipo: 'com_afastamento',
  data: hoje,
  hora: '09:40',
  local: 'Linha 2, prensa P-04',
  setor: 'Produção',
  acidentado: 'João Pereira',
  funcao: 'Operador de prensa',
  descricao:
    'Corte na mão esquerda ao retirar peça da prensa sem a ferramenta de extração.',
  lesao: 'Corte',
  parteDoCorpo: 'Mão esquerda',
  diasPerdidos: 5,
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

const acao = (a: Acidente, alteracoes: Record<string, unknown>) => ({
  id: a.id,
  alteracoes: { versao: a.versao, ...alteracoes },
});

/** Codex falso: um funcionário conhecido. */
const funcionarioDeTeste = {
  id: '01900000-0000-7000-8000-000000000001',
  nome: 'João Pereira',
  funcaoNome: 'Operador',
  cpf: '52998224725',
  matricula: '10',
};
const codexDeTeste = {
  send<R>(_p: string, m: unknown): Observable<R> {
    const id = (m as { dados: { id: string } }).dados.id;
    return (
      id === funcionarioDeTeste.id
        ? of(funcionarioDeTeste)
        : throwError(() => ({
            codigo: 'NAO_ENCONTRADO',
            mensagem: 'Funcionário não encontrado.',
          }))
    ) as Observable<R>;
  },
};

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  servico = new AcidentesService(banco.db, codexDeTeste);
});
afterAll(() => banco.encerrar());

describe('registro', () => {
  it('numera, calcula o prazo da CAT e coerência entre tipo e dias perdidos', async () => {
    const a = await servico.criar(empresaA, corte);
    expect(a).toMatchObject({
      numero: `ACI-${ano}-001`,
      status: 'registrado',
      catAtrasada: false,
    });
    expect(a.prazoCat! > hoje).toBe(true);

    const semDias = await recusa(
      servico.criar(empresaA, { ...corte, diasPerdidos: 0 }),
    );
    expect(semDias.detalhes).toEqual([
      {
        campo: 'diasPerdidos',
        mensagem: 'Acidente com afastamento tem ao menos 1 dia perdido.',
      },
    ]);
    const quaseComDias = await recusa(
      servico.criar(empresaA, {
        ...corte,
        tipo: 'quase_acidente',
        diasPerdidos: 2,
      }),
    );
    expect(quaseComDias.detalhes?.[0]?.campo).toBe('diasPerdidos');
    const semPessoa = await recusa(
      servico.criar(empresaA, { ...corte, acidentado: '' }),
    );
    expect(semPessoa.detalhes).toEqual([
      { campo: 'acidentado', mensagem: 'Informe quem se acidentou.' },
    ]);

    const quase = await servico.criar(empresaA, {
      ...corte,
      tipo: 'quase_acidente',
      diasPerdidos: 0,
      acidentado: '',
    });
    expect(quase).toMatchObject({ prazoCat: null, catAtrasada: false });
  });

  it('CAT atrasada depois do primeiro dia útil seguinte, enquanto não registrada', async () => {
    const a = await servico.criar(empresaA, {
      ...corte,
      data: somarDias(hoje, -10),
    });
    expect(a.catAtrasada).toBe(true);
    const comCat = await servico.registrarCat(
      empresaA,
      acao(a, { numero: '2026.10.000123-4', data: somarDias(hoje, -9) }),
    );
    expect(comCat).toMatchObject({
      catAtrasada: false,
      catNumero: '2026.10.000123-4',
    });
    expect(
      (
        await recusa(
          servico.registrarCat(
            empresaA,
            acao(comCat, {
              numero: '2026.10.000123-4',
              data: somarDias(hoje, -11),
            }),
          ),
        )
      ).detalhes?.[0]?.mensagem,
    ).toBe('A CAT não pode ser anterior ao acidente.');
  });
});

describe('investigação', () => {
  it('concluir exige investigação iniciada, CAT para acidente com lesão, causas e medidas', async () => {
    let a = await servico.criar(empresaA, corte);
    expect(
      (
        await recusa(
          servico.concluirInvestigacao(
            empresaA,
            acao(a, { causas: 'x'.repeat(20), medidas: 'y'.repeat(20) }),
          ),
        )
      ).codigo,
    ).toBe('REGRA_DE_NEGOCIO');
    a = await servico.iniciarInvestigacao(empresaA, acao(a, {}));
    const semCat = await recusa(
      servico.concluirInvestigacao(
        empresaA,
        acao(a, {
          causas: 'Retirada manual da peça.',
          medidas: 'Ferramenta de extração obrigatória e bloqueio da prensa.',
        }),
      ),
    );
    expect(semCat.mensagem).toContain('Registre a CAT antes de concluir');
    a = await servico.registrarCat(
      empresaA,
      acao(a, { numero: '2026.10.000200-1', data: hoje }),
    );
    a = await servico.concluirInvestigacao(
      empresaA,
      acao(a, {
        causas: 'Retirada manual da peça.',
        medidas: 'Ferramenta de extração obrigatória e bloqueio da prensa.',
      }),
    );
    expect(a.status).toBe('concluido');
    expect(
      (
        await recusa(
          servico.cancelar(
            empresaA,
            acao(a, { motivo: 'Tentativa depois de concluído.' }),
          ),
        )
      ).codigo,
    ).toBe('REGRA_DE_NEGOCIO');
  });

  it('versão desatualizada e outra empresa são recusadas', async () => {
    const a = await servico.criar(empresaA, corte);
    await servico.iniciarInvestigacao(empresaA, acao(a, {}));
    expect(
      (
        await recusa(
          servico.cancelar(
            empresaA,
            acao(a, { motivo: 'Registro em duplicidade.' }),
          ),
        )
      ).codigo,
    ).toBe('CONFLITO');
    expect((await recusa(servico.obter(empresaB, { id: a.id }))).codigo).toBe(
      'NAO_ENCONTRADO',
    );
  });
});

describe('indicadores (NBR 14280)', () => {
  it('TF e TG por mês e no ano; mês sem horas fica sem taxa; cancelado não conta', async () => {
    const ctx: Contexto = {
      empresaId: uuidv7(),
      usuarioId: uuidv7(),
      rastreioId: uuidv7(),
    };
    const mes = hoje.slice(0, 7);
    const primeiroDia = `${mes}-01`;
    await servico.criar(ctx, { ...corte, data: primeiroDia, diasPerdidos: 10 });
    await servico.criar(ctx, {
      ...corte,
      data: primeiroDia,
      diasPerdidos: 5,
      diasDebitados: 0,
    });
    const cancelado = await servico.criar(ctx, {
      ...corte,
      data: primeiroDia,
      diasPerdidos: 30,
    });
    await servico.cancelar(
      ctx,
      acao(cancelado, { motivo: 'Lançado em duplicidade.' }),
    );
    await servico.criar(ctx, {
      ...corte,
      tipo: 'sem_afastamento',
      data: primeiroDia,
      diasPerdidos: 0,
    });

    let ind = await servico.indicadores(ctx, { ano });
    const doMes = ind.meses.find((m) => m.competencia === mes)!;
    expect(doMes).toMatchObject({
      horas: null,
      acidentesComAfastamento: 2,
      diasPerdidosEDebitados: 15,
      tf: null,
      tg: null,
    });
    expect(ind.total.tf).toBeNull();

    await servico.registrarHoras(ctx, { competencia: mes, horas: 400_000 });
    ind = await servico.indicadores(ctx, { ano });
    expect(ind.meses.find((m) => m.competencia === mes)).toMatchObject({
      horas: 400_000,
      tf: 5,
      tg: 37.5,
    });
    expect(ind.total).toMatchObject({ horas: 400_000, tf: 5, tg: 37.5 });

    // Lançar de novo corrige, não soma
    await servico.registrarHoras(ctx, { competencia: mes, horas: 500_000 });
    expect((await servico.indicadores(ctx, { ano })).total.tf).toBe(4);
  });

  it('dias sem acidente contam do último com afastamento; mês futuro não recebe horas', async () => {
    const ctx: Contexto = {
      empresaId: uuidv7(),
      usuarioId: uuidv7(),
      rastreioId: uuidv7(),
    };
    expect((await servico.resumo(ctx)).diasSemAcidente).toBeNull();
    const a = await servico.criar(ctx, corte);
    await banco.db
      .update(acidentes)
      .set({ data: somarDias(hoje, -12) })
      .where(eq(acidentes.id, a.id));
    expect(await servico.resumo(ctx)).toMatchObject({
      diasSemAcidente: 12,
      emAberto: 1,
      catsAtrasadas: 1,
    });
    const futuro = await recusa(
      servico.registrarHoras(ctx, {
        competencia: `${ano + 1}-01`,
        horas: 1000,
      }),
    );
    expect(futuro.detalhes?.[0]?.campo).toBe('competencia');
  });
});
