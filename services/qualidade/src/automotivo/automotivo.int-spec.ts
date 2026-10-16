import { ErroDeNegocio } from '@davinci/shared';
import {
  uuidv7,
  type Contexto,
  type ErroPadrao,
  type LinhaDoFmeaEntrada,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { hojeEmBrasilia } from '../datas.js';
import { AutomotivoService } from './automotivo.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let s: AutomotivoService;
const ctx: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};
const outra: Contexto = { ...ctx, empresaId: uuidv7() };
const hoje = hojeEmBrasilia();
const ano = hoje.slice(0, 4);

async function recusa(promessa: Promise<unknown>): Promise<ErroPadrao> {
  try {
    await promessa;
  } catch (e) {
    if (e instanceof ErroDeNegocio) return e.getError() as ErroPadrao;
    throw e;
  }
  throw new Error('Era esperada uma recusa.');
}

const linha = (
  extra: Partial<LinhaDoFmeaEntrada> = {},
): LinhaDoFmeaEntrada => ({
  etapa: '20 Usinagem',
  funcao: 'Diâmetro do eixo 10,0 ± 0,1 mm',
  modoDeFalha: 'Diâmetro acima da tolerância',
  efeito: 'Montagem travada no cliente',
  severidade: 8,
  classificacao: 'SC',
  causa: 'Desgaste da ferramenta',
  prevencao: 'Troca de ferramenta a cada 500 peças',
  ocorrencia: 4,
  deteccao: 'Medição 1 a cada 50 com micrômetro',
  notaDeteccao: 5,
  ...extra,
});

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  s = new AutomotivoService(banco.db);
});
afterAll(() => banco.encerrar());

describe('FMEA de processo', () => {
  it('numera, calcula AP e NPR, e exige ação na AP alta', async () => {
    const recusado = await recusa(
      s.criarFmea(ctx, {
        titulo: 'PFMEA eixo',
        item: 'Eixo 10 mm',
        linhas: [linha({ ocorrencia: 8 })],
      }),
    );
    expect(recusado.detalhes?.map((d) => d.campo)).toEqual([
      'linhas.0.acao',
      'linhas.0.responsavel',
      'linhas.0.prazo',
    ]);

    const f = await s.criarFmea(ctx, {
      titulo: 'PFMEA eixo',
      item: 'Eixo 10 mm',
      linhas: [
        linha(),
        linha({
          ocorrencia: 8,
          acao: 'Sensor de desgaste',
          responsavel: 'Ana',
          prazo: hoje,
        }),
        linha({
          severidade: 3,
          ocorrencia: 2,
          notaDeteccao: 2,
          classificacao: undefined,
        }),
      ],
    });
    expect(f.numero).toBe(`FMEA-${ano}-001`);
    expect(f.linhas.map((l) => [l.ap, l.npr])).toEqual([
      ['M', 160],
      ['H', 320],
      ['L', 12],
    ]);
    expect(f.contagem).toEqual({ H: 1, M: 1, L: 1 });
    expect(f.acoesAltasAbertas).toBe(1);

    const r = await s.atualizarFmea(ctx, {
      id: f.id,
      alteracoes: {
        titulo: f.titulo,
        item: f.item,
        versao: f.versao,
        linhas: [
          linha({
            ocorrencia: 8,
            acao: 'Sensor de desgaste',
            responsavel: 'Ana',
            prazo: hoje,
            statusAcao: 'concluida',
          }),
        ],
      },
    });
    expect(r.acoesAltasAbertas).toBe(0);
    expect(
      (
        await recusa(
          s.atualizarFmea(ctx, {
            id: f.id,
            alteracoes: { titulo: 'x y z', item: 'Eixo', versao: f.versao },
          }),
        )
      ).codigo,
    ).toBe('CONFLITO');
    expect((await recusa(s.obterFmea(outra, { id: f.id }))).codigo).toBe(
      'NAO_ENCONTRADO',
    );
  });
});

describe('Plano de controle', () => {
  it('gerado do FMEA: uma linha por etapa e característica, com os controles', async () => {
    const f = await s.criarFmea(ctx, {
      titulo: 'PFMEA flange',
      item: 'Flange',
      linhas: [
        linha(),
        linha({ modoDeFalha: 'Diâmetro abaixo', causa: 'Ajuste errado' }),
        linha({ etapa: '30 Tratamento', funcao: 'Dureza 58-62 HRC' }),
      ],
    });
    const p = await s.criarPlano(ctx, {
      titulo: 'PC flange',
      item: 'Flange',
      fase: 'pre_lancamento',
      fmeaId: f.id,
    });
    expect(p.numero).toBe(`PC-${ano}-001`);
    expect(p.fmeaNumero).toBe(f.numero);
    expect(
      p.linhas.map((l) => [l.etapa, l.caracteristica, l.classificacao]),
    ).toEqual([
      ['20 Usinagem', 'Diâmetro do eixo 10,0 ± 0,1 mm', 'SC'],
      ['30 Tratamento', 'Dureza 58-62 HRC', 'SC'],
    ]);
    expect(p.linhas[0]!.controle).toBe(
      'Troca de ferramenta a cada 500 peças · Medição 1 a cada 50 com micrômetro',
    );
  });
});

describe('PPAP', () => {
  it('nível define o que submeter; submeter exige os elementos; decisão só depois de submetido', async () => {
    let p = await s.criarPpap(ctx, {
      peca: 'Eixo 10 mm',
      numeroDaPeca: 'EX-1020',
      cliente: 'Montadora X',
      nivel: 1,
      motivo: 'nova_peca',
    });
    expect(p.numero).toBe(`PPAP-${ano}-001`);
    expect(p.pendentesParaSubmeter).toBe(2);
    const falta = await recusa(
      s.submeterPpap(ctx, {
        id: p.id,
        alteracoes: { versao: p.versao, data: hoje },
      }),
    );
    expect(falta.mensagem).toContain('Certificado de submissão de peça (PSW)');

    p = await s.atualizarPpap(ctx, {
      id: p.id,
      alteracoes: {
        peca: p.peca,
        numeroDaPeca: p.numeroDaPeca,
        cliente: p.cliente,
        nivel: 1,
        motivo: 'nova_peca',
        versao: p.versao,
        elementos: {
          psw: { status: 'concluido', observacao: '' },
          aparencia: {
            status: 'nao_aplicavel',
            observacao: 'Peça sem requisito de aparência',
          },
        },
      },
    });
    expect(p.pendentesParaSubmeter).toBe(0);
    expect(
      (
        await recusa(
          s.decidirPpap(ctx, {
            id: p.id,
            alteracoes: {
              versao: p.versao,
              decisao: 'aprovado',
              parecer: 'ok ok',
            },
          }),
        )
      ).codigo,
    ).toBe('REGRA_DE_NEGOCIO');
    p = await s.submeterPpap(ctx, {
      id: p.id,
      alteracoes: { versao: p.versao, data: hoje },
    });
    expect(p.status).toBe('submetido');
    expect(
      (
        await recusa(
          s.atualizarPpap(ctx, {
            id: p.id,
            alteracoes: {
              peca: 'x y',
              numeroDaPeca: '1',
              cliente: 'cc',
              nivel: 1,
              motivo: 'outro',
              versao: p.versao,
            },
          }),
        )
      ).codigo,
    ).toBe('REGRA_DE_NEGOCIO');
    p = await s.decidirPpap(ctx, {
      id: p.id,
      alteracoes: {
        versao: p.versao,
        decisao: 'rejeitado',
        parecer: 'Falta relatório dimensional.',
      },
    });
    expect(p).toMatchObject({
      status: 'rejeitado',
      parecer: 'Falta relatório dimensional.',
    });
    // Rejeitado volta a preparação ao ser corrigido
    p = await s.atualizarPpap(ctx, {
      id: p.id,
      alteracoes: {
        peca: p.peca,
        numeroDaPeca: p.numeroDaPeca,
        cliente: p.cliente,
        nivel: 3,
        motivo: 'nova_peca',
        versao: p.versao,
      },
    });
    expect(p.status).toBe('em_preparacao');
    // Nível 3: 16 elementos a submeter, PSW e aparência já resolvidos
    expect(p.pendentesParaSubmeter).toBe(14);
  });
});
