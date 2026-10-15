import {
  ErroDeNegocio,
  hojeEmBrasilia,
  somarDias,
  somarMeses,
} from '@davinci/shared';
import { uuidv7, type Contexto, type ErroPadrao } from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { SgiService } from './sgi.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let sgi: SgiService;
const empresaId = uuidv7();
const ana: Contexto = { empresaId, usuarioId: uuidv7(), rastreioId: uuidv7() };
const diretor: Contexto = {
  empresaId,
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};
const hoje = hojeEmBrasilia();

async function recusa(p: Promise<unknown>): Promise<ErroPadrao> {
  try {
    await p;
  } catch (e) {
    if (e instanceof ErroDeNegocio) return e.getError() as ErroPadrao;
    throw e;
  }
  throw new Error('Era esperada uma recusa.');
}

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  sgi = new SgiService(banco.db);
});
afterAll(() => banco.encerrar());

describe('Gestão do SGI', () => {
  it('risco alto exige tratamento; encerrado sai dos abertos', async () => {
    const base = {
      tipo: 'risco' as const,
      processo: 'Compras',
      descricao: 'Fornecedor único de aço',
      probabilidade: 4,
      impacto: 5,
    };
    expect(
      (await recusa(sgi.criarRo(ana, base))).detalhes
        ?.map((d) => d.campo)
        .sort(),
    ).toEqual(['acao', 'prazo', 'responsavel']);
    const r = await sgi.criarRo(ana, {
      ...base,
      acao: 'Homologar segundo fornecedor',
      responsavel: 'Suprimentos',
      prazo: somarDias(hoje, -1),
    });
    expect(r).toMatchObject({ classe: 'alta', prazoVencido: true });
    expect(await sgi.resumo(ana)).toMatchObject({
      rosAltosAbertos: 1,
      rosComPrazoVencido: 1,
      analiseCriticaAtrasada: true,
    });
    await sgi.encerrarRo(ana, {
      id: r.id,
      alteracoes: {
        versao: r.versao,
        resultado: 'Segundo fornecedor homologado.',
      },
    });
    expect(await sgi.listarRos(ana, {})).toEqual([]);
  });

  it('objetivo: medição atinge conforme o sentido; mesma competência corrige', async () => {
    const o = await sgi.criarObjetivo(ana, {
      nome: 'Reduzir refugo',
      indicador: 'Refugo',
      unidade: '%',
      meta: '2,5',
      sentido: 'menor',
      responsavel: 'Produção',
    });
    const mes = hoje.slice(0, 7);
    let x = await sgi.registrarMedicao(ana, {
      id: o.id,
      alteracoes: { competencia: mes, valor: '3,1' },
    });
    expect(x.medicoes).toEqual([
      { competencia: mes, valor: 3.1, atingiu: false, analise: null },
    ]);
    expect((await sgi.resumo(ana)).objetivosFora).toBe(1);
    x = await sgi.registrarMedicao(ana, {
      id: o.id,
      alteracoes: { competencia: mes, valor: '2,2' },
    });
    expect(x.medicoes.map((m) => m.atingiu)).toEqual([true]);
    expect(
      (
        await recusa(
          sgi.registrarMedicao(ana, {
            id: o.id,
            alteracoes: {
              competencia: somarMeses(hoje, 1).slice(0, 7),
              valor: 1,
            },
          }),
        )
      ).detalhes?.[0]?.campo,
    ).toBe('competencia');
  });

  it('análise crítica marca a próxima; mudança não é decidida por quem propôs', async () => {
    await sgi.criarAnalise(ana, {
      data: hoje,
      participantes: 'Diretoria e gestores',
      entradas: 'Resultados de auditorias e objetivos do semestre.',
      decisoes: 'Contratar inspetor de qualidade.',
      proximaAnalise: somarMeses(hoje, 6),
    });
    expect((await sgi.resumo(ana)).analiseCriticaAtrasada).toBe(false);
    const m = await sgi.criarMudanca(ana, {
      titulo: 'Novo layout da expedição',
      descricao: 'Mudar as docas de lugar para separar carga e descarga.',
      motivo: 'Cruzamento de empilhadeiras',
      impactos: 'Treinar operadores; revisar o PGR da expedição.',
      responsavel: 'Logística',
      dataPrevista: somarDias(hoje, 30),
    });
    expect(m.numero).toMatch(/^MUD-\d{4}-001$/);
    expect(
      (
        await recusa(
          sgi.decidirMudanca(ana, {
            id: m.id,
            alteracoes: { versao: m.versao, aprovar: true, parecer: 'Aprovo.' },
          }),
        )
      ).mensagem,
    ).toContain('Quem propôs');
    const aprovada = await sgi.decidirMudanca(diretor, {
      id: m.id,
      alteracoes: {
        versao: m.versao,
        aprovar: true,
        parecer: 'Aprovada com treinamento antes.',
      },
    });
    const feita = await sgi.implementarMudanca(ana, {
      id: m.id,
      alteracoes: {
        versao: aprovada.versao,
        verificacao: 'Sem cruzamentos na primeira semana.',
      },
    });
    expect(feita.status).toBe('implementada');
  });
});
