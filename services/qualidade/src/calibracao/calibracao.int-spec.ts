import { ErroDeNegocio } from '@davinci/shared';
import {
  uuidv7,
  type Contexto,
  type ErroPadrao,
  type Instrumento,
  type NovoInstrumento,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { hojeEmBrasilia } from '../datas.js';
import { CalibracaoService } from './calibracao.service.js';
import { somarMeses } from './regras.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let servico: CalibracaoService;

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
const mesesAtras = (n: number) => somarMeses(hoje, -n);

const paquimetro: NovoInstrumento = {
  tag: 'paq-0042',
  descricao: 'Paquímetro digital 150 mm',
  local: 'Linha 2',
  responsavel: 'Marina Duarte',
  criterioAceitacao: 'Erro máximo ± 0,02 mm',
  frequenciaMeses: 12,
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

const registrar = (
  ctx: Contexto,
  i: Instrumento,
  data: string,
  aprovada = true,
) =>
  servico.registrar(ctx, {
    id: i.id,
    alteracoes: {
      versao: i.versao,
      data,
      laboratorio: 'Lab Metrologia Alfa',
      certificado: 'CERT-8812',
      aprovada,
    },
  });

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  servico = new CalibracaoService(banco.db);
});
afterAll(() => banco.encerrar());

describe('instrumento', () => {
  it('TAG em maiúsculas e única por empresa; começa sem calibração', async () => {
    const i = await servico.criar(empresaA, paquimetro);
    expect(i).toMatchObject({
      tag: 'PAQ-0042',
      situacao: 'sem_calibracao',
      ultimaCalibracao: null,
      proximaCalibracao: null,
    });
    expect(
      (
        await recusa(
          servico.criar(empresaA, { ...paquimetro, tag: 'PAQ-0042' }),
        )
      ).detalhes,
    ).toEqual([
      { campo: 'tag', mensagem: 'Já existe um instrumento com esta TAG.' },
    ]);
    await servico.criar(empresaB, paquimetro);
  });
});

describe('calibrações', () => {
  it('calcula a próxima pela frequência; reprovada bloqueia até nova aprovada; anulada sai das contas', async () => {
    let i = await servico.criar(empresaA, { ...paquimetro, tag: 'PAQ-0100' });
    i = await registrar(empresaA, i, mesesAtras(2));
    expect(i).toMatchObject({
      situacao: 'em_dia',
      ultimaCalibracao: mesesAtras(2),
      proximaCalibracao: somarMeses(mesesAtras(2), 12),
    });

    i = await registrar(empresaA, i, hoje, false);
    expect(i.situacao).toBe('reprovado');

    // Lançamento atrasado (mais antigo) não muda a situação: vale a mais recente
    i = await registrar(empresaA, i, mesesAtras(14));
    expect(i.situacao).toBe('reprovado');
    expect(i.calibracoes.map((c) => c.data)).toEqual([
      hoje,
      mesesAtras(2),
      mesesAtras(14),
    ]);

    // A reprovada foi registrada por engano: anulada, volta a valer a de 2 meses atrás
    const errada = i.calibracoes[0]!;
    i = await servico.anular(empresaA, {
      id: i.id,
      alteracoes: {
        versao: i.versao,
        calibracaoId: errada.id,
        motivo: 'Lançada no instrumento errado.',
      },
    });
    expect(i).toMatchObject({
      situacao: 'em_dia',
      ultimaCalibracao: mesesAtras(2),
    });
    expect(i.calibracoes[0]).toMatchObject({
      anulada: true,
      motivoAnulacao: 'Lançada no instrumento errado.',
    });
    expect(
      (
        await recusa(
          servico.anular(empresaA, {
            id: i.id,
            alteracoes: {
              versao: i.versao,
              calibracaoId: errada.id,
              motivo: 'De novo, por engano.',
            },
          }),
        )
      ).mensagem,
    ).toBe('Esta calibração já está anulada.');
  });

  it('vencido quando passa da próxima; data futura é recusada', async () => {
    let i = await servico.criar(empresaA, {
      ...paquimetro,
      tag: 'MIC-0007',
      frequenciaMeses: 6,
    });
    i = await registrar(empresaA, i, mesesAtras(7));
    expect(i.situacao).toBe('vencido');
    const amanha = new Date(`${hoje}T12:00:00Z`);
    amanha.setUTCDate(amanha.getUTCDate() + 1);
    expect(
      (await recusa(registrar(empresaA, i, amanha.toISOString().slice(0, 10))))
        .detalhes?.[0]?.campo,
    ).toBe('data');
  });

  it('fora de uso não vence e não recebe calibração até voltar para uso', async () => {
    let i = await servico.criar(empresaA, { ...paquimetro, tag: 'TRENA-01' });
    i = await registrar(empresaA, i, mesesAtras(30));
    i = await servico.mudarUso(empresaA, {
      id: i.id,
      alteracoes: { versao: i.versao, emUso: false },
    });
    expect(i.situacao).toBe('fora_de_uso');
    expect((await recusa(registrar(empresaA, i, hoje))).codigo).toBe(
      'REGRA_DE_NEGOCIO',
    );
  });

  it('versão desatualizada e outra empresa são recusadas', async () => {
    const i = await servico.criar(empresaA, { ...paquimetro, tag: 'BAL-0003' });
    await registrar(empresaA, i, hoje);
    expect((await recusa(registrar(empresaA, i, hoje))).codigo).toBe(
      'CONFLITO',
    );
    expect((await recusa(servico.obter(empresaB, { id: i.id }))).codigo).toBe(
      'NAO_ENCONTRADO',
    );
  });
});

describe('lista e resumo', () => {
  it('o que pede ação vem primeiro; filtra pela situação calculada', async () => {
    const ctx: Contexto = {
      empresaId: uuidv7(),
      usuarioId: uuidv7(),
      rastreioId: uuidv7(),
    };
    const emDia = await registrar(
      ctx,
      await servico.criar(ctx, { ...paquimetro, tag: 'A-EMDIA' }),
      mesesAtras(1),
    );
    const vencido = await registrar(
      ctx,
      await servico.criar(ctx, {
        ...paquimetro,
        tag: 'B-VENCIDO',
        frequenciaMeses: 3,
      }),
      mesesAtras(5),
    );
    const reprovado = await registrar(
      ctx,
      await servico.criar(ctx, { ...paquimetro, tag: 'C-REPROVADO' }),
      hoje,
      false,
    );
    const novo = await servico.criar(ctx, { ...paquimetro, tag: 'D-NOVO' });

    expect((await servico.listar(ctx, {})).itens.map((i) => i.id)).toEqual([
      reprovado.id,
      vencido.id,
      novo.id,
      emDia.id,
    ]);
    expect(
      (await servico.listar(ctx, { situacao: 'vencido' })).itens.map(
        (i) => i.id,
      ),
    ).toEqual([vencido.id]);
    expect(
      (await servico.listar(ctx, { busca: 'reprov' })).itens.map((i) => i.id),
    ).toEqual([reprovado.id]);
    expect(await servico.resumo(ctx)).toMatchObject({
      vencidos: 1,
      vencemEmBreve: 0,
      reprovados: 1,
      semCalibracao: 1,
    });
  });
});
