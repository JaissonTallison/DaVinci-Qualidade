import { of, type Observable } from 'rxjs';
import { ErroDeNegocio, hojeEmBrasilia, somarDias } from '@davinci/shared';
import {
  PATTERNS,
  uuidv7,
  type Contexto,
  type ErroPadrao,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { AmbientalService } from '../ambiental/ambiental.service.js';
import { ConsumoService } from '../consumo/consumo.service.js';
import { MonitoramentosService } from '../monitoramentos/monitoramentos.service.js';
import { QuimicosService } from '../quimicos/quimicos.service.js';
import { GestaoAmbientalService } from './gestao.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let g: GestaoAmbientalService;
let amb: AmbientalService;
let consumo: ConsumoService;
const ctx: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};
const hoje = hojeEmBrasilia();
const ano = Number(hoje.slice(0, 4));

const qualidade = {
  pedidos: [] as { padrao: string; dados: Record<string, unknown> }[],
  send<R>(padrao: string, m: unknown): Observable<R> {
    this.pedidos.push({
      padrao,
      dados: (m as { dados: Record<string, unknown> }).dados,
    });
    return of({ id: uuidv7(), numero: 'NC-2026-090' }) as Observable<R>;
  },
};

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
  g = new GestaoAmbientalService(banco.db, qualidade);
  amb = new AmbientalService(
    banco.db,
    new QuimicosService(banco.db),
    new MonitoramentosService(banco.db),
  );
  consumo = new ConsumoService(banco.db);
});
afterAll(() => banco.encerrar());

describe('Ocorrências ambientais', () => {
  it('água torna a comunicação obrigatória (24 h); encerrar exige comunicar; NC na Qualidade', async () => {
    let o = await g.criarOcorrencia(ctx, {
      tipo: 'vazamento',
      data: somarDias(hoje, -2),
      hora: '08:30',
      local: 'Tanque de óleo',
      substancia: 'Óleo hidráulico',
      quantidade: 40,
      unidade: 'L',
      meios: ['solo', 'agua'],
      severidade: 'media',
      descricao: 'Vazamento da mangueira do tanque.',
      contencao: 'Barreira de areia e manta.',
    });
    expect(o).toMatchObject({
      numero: `OCA-${somarDias(hoje, -2).slice(0, 4)}-001`,
      comunicacaoObrigatoria: true,
      prazoComunicacao: somarDias(hoje, -1),
      comunicacaoAtrasada: true,
    });
    expect(
      (
        await recusa(
          g.encerrarOcorrencia(ctx, {
            id: o.id,
            alteracoes: {
              versao: o.versao,
              causas: 'Mangueira ressecada.',
              acoes: 'Troca preventiva anual.',
            },
          }),
        )
      ).mensagem,
    ).toContain('comunicação ao órgão');
    o = await g.comunicarOcorrencia(ctx, {
      id: o.id,
      alteracoes: {
        versao: o.versao,
        orgao: 'CETESB',
        data: hoje,
        protocolo: 'Tel. 0800 · prot. 1234',
      },
    });
    expect(o.comunicacaoAtrasada).toBe(true);
    o = await g.ncDaOcorrencia(ctx, {
      id: o.id,
      alteracoes: { versao: o.versao, responsavel: 'Ana Souza' },
    });
    expect(o.ncNumero).toBe('NC-2026-090');
    expect(qualidade.pedidos[0]).toMatchObject({
      padrao: PATTERNS.naoConformidades.criar,
      dados: { origem: 'ambiental', gravidade: 'media' },
    });
    o = await g.encerrarOcorrencia(ctx, {
      id: o.id,
      alteracoes: {
        versao: o.versao,
        causas: 'Mangueira ressecada.',
        acoes: 'Troca preventiva anual.',
      },
    });
    expect(o.status).toBe('encerrada');
    const leve = await g.criarOcorrencia(ctx, {
      tipo: 'derramamento',
      data: hoje,
      hora: '10:00',
      local: 'Almoxarifado',
      substancia: 'Tinta',
      meios: ['contido'],
      severidade: 'baixa',
      descricao: 'Lata caiu e abriu.',
      contencao: 'Recolhida com serragem.',
    });
    expect(leve.comunicacaoObrigatoria).toBe(false);
  });
});

describe('Obrigações legais', () => {
  it('cumprir avança pela periodicidade a partir do vencimento; única fecha; com histórico não exclui', async () => {
    let o = await g.criarObrigacao(ctx, {
      nome: 'RAPP',
      orgao: 'IBAMA',
      periodicidade: 'anual',
      proximoVencimento: `${ano}-03-31`,
      responsavel: 'Ana',
    });
    o = await g.cumprirObrigacao(ctx, {
      id: o.id,
      alteracoes: {
        versao: o.versao,
        data: `${ano}-03-20`,
        comprovante: 'Recibo 998',
      },
    });
    expect(o).toMatchObject({ proximoVencimento: `${ano + 1}-03-31` });
    expect(o.historico[0]).toMatchObject({
      noPrazo: true,
      comprovante: 'Recibo 998',
    });
    expect((await recusa(g.excluirObrigacao(ctx, { id: o.id }))).codigo).toBe(
      'REGRA_DE_NEGOCIO',
    );
    let u = await g.criarObrigacao(ctx, {
      nome: 'Renovar outorga',
      orgao: 'ANA',
      periodicidade: 'unica',
      proximoVencimento: hoje,
      responsavel: 'Ana',
    });
    u = await g.cumprirObrigacao(ctx, {
      id: u.id,
      alteracoes: { versao: u.versao, data: hoje, comprovante: 'Protocolo 77' },
    });
    expect(u).toMatchObject({ proximoVencimento: null, situacao: 'cumprida' });
  });
});

describe('Resíduos: destinador licenciado, custo e inventário', () => {
  it('saída com licença vencida é recusada; inventário soma quantidade, custo e CDF pendente', async () => {
    const r = await amb.criarResiduo(ctx, {
      nome: 'Borra oleosa',
      classe: 'I',
      origem: 'Manutenção',
      acondicionamento: 'Tambor',
      destinacao: 'Coprocessamento',
      unidade: 'kg',
    });
    const vencido = await g.criarDestinador(ctx, {
      nome: 'Recicla Velho',
      tipo: 'ambos',
      licencaNumero: 'LO-1',
      licencaOrgao: 'CETESB',
      licencaValidade: somarDias(hoje, -5),
    });
    const bom = await g.criarDestinador(ctx, {
      nome: 'Coprocessa SA',
      tipo: 'destinador',
      licencaNumero: 'LO-2',
      licencaOrgao: 'CETESB',
      licencaValidade: somarDias(hoje, 300),
    });
    const transp = await g.criarDestinador(ctx, {
      nome: 'Transporta Bem',
      tipo: 'transportador',
      licencaNumero: 'LO-3',
      licencaOrgao: 'CETESB',
      licencaValidade: somarDias(hoje, 300),
    });
    expect(vencido.licencaVencida).toBe(true);
    expect(
      (
        await recusa(
          amb.registrarSaida(ctx, {
            residuoId: r.id,
            data: hoje,
            quantidade: 100,
            mtr: 'MTR-1',
            transportadorId: vencido.id,
            destinadorId: bom.id,
          }),
        )
      ).detalhes?.[0]?.mensagem,
    ).toContain('A licença de Recicla Velho venceu');
    expect(
      (
        await recusa(
          amb.registrarSaida(ctx, {
            residuoId: r.id,
            data: hoje,
            quantidade: 100,
            mtr: 'MTR-1',
            transportadorId: transp.id,
            destinadorId: transp.id,
          }),
        )
      ).detalhes?.[0]?.mensagem,
    ).toBe('Transporta Bem não está cadastrado como destinador.');
    const lista = await amb.registrarSaida(ctx, {
      residuoId: r.id,
      data: hoje,
      quantidade: 120,
      mtr: 'MTR-2',
      transportadorId: transp.id,
      destinadorId: bom.id,
      custo: 450.5,
    });
    expect(lista[0]).toMatchObject({
      transportador: 'Transporta Bem',
      destinador: 'Coprocessa SA',
      custo: 450.5,
    });
    await amb.registrarSaida(ctx, {
      residuoId: r.id,
      data: hoje,
      quantidade: 80,
      mtr: 'MTR-3',
      transportador: 'Avulso',
      destinador: 'Avulso Dest',
    });
    const inv = await g.inventario(ctx, { ano });
    expect(inv.linhas[0]).toMatchObject({
      nome: 'Borra oleosa',
      saidas: 2,
      quantidade: 200,
      custo: 450.5,
      semCdf: 2,
    });
    expect(inv.custoTotal).toBe(450.5);
  });
});

describe('Ecoeficiência e programas', () => {
  it('indicadores por unidade produzida e progresso da meta', async () => {
    const mes = hoje.slice(0, 7);
    await g.registrarProducao(ctx, {
      competencia: mes,
      quantidade: 100,
      unidade: 't',
    });
    await consumo.registrar(ctx, {
      fonte: 'agua',
      competencia: mes,
      quantidade: 300,
    });
    await consumo.registrar(ctx, {
      fonte: 'energia',
      competencia: mes,
      quantidade: 5000,
    });
    await consumo.definirFator(ctx, {
      fonte: 'energia',
      ano,
      fator: 0.05,
      referencia: 'MCTI',
    });
    const eco = await g.ecoeficiencia(ctx, { ano });
    const m = eco.meses.find((x) => x.competencia === mes)!;
    expect(m).toMatchObject({
      producao: 100,
      agua: 300,
      energia: 5000,
      residuos: 200,
      gee: 250,
    });
    expect(eco.porUnidade).toEqual({
      agua: 3,
      energia: 50,
      residuos: 2,
      gee: 2.5,
    });
    const p = await g.criarPrograma(ctx, {
      nome: 'Reduzir água',
      objetivo: 'Reúso da água do lavador.',
      indicador: 'agua_por_unidade',
      linhaDeBase: 4,
      anoBase: ano - 1,
      meta: 2,
      prazo: `${ano}-12-31`,
      responsavel: 'Ana',
      acoes: [{ oQue: 'Instalar tanque de reúso' }],
    });
    expect(p).toMatchObject({ atual: 3, progresso: 50, unidade: 'm³/unid.' });
    expect(
      (
        await recusa(
          g.medirPrograma(ctx, {
            id: p.id,
            alteracoes: { versao: p.versao, competencia: mes, valor: 1 },
          }),
        )
      ).codigo,
    ).toBe('REGRA_DE_NEGOCIO');
    let manual = await g.criarPrograma(ctx, {
      nome: 'Coleta seletiva',
      objetivo: 'Separação na fonte.',
      indicador: 'manual',
      unidadeManual: '%',
      linhaDeBase: 20,
      anoBase: ano,
      meta: 80,
      prazo: `${ano}-12-31`,
      responsavel: 'Ana',
    });
    manual = await g.medirPrograma(ctx, {
      id: manual.id,
      alteracoes: { versao: manual.versao, competencia: mes, valor: 50 },
    });
    expect(manual).toMatchObject({ atual: 50, progresso: 50 });
  });
});
