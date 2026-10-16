import { of, throwError, type Observable } from 'rxjs';
import {
  ErroDeNegocio,
  hojeEmBrasilia,
  somarDias,
  somarMeses,
} from '@davinci/shared';
import {
  PATTERNS,
  uuidv7,
  type Contexto,
  type DadosDaCat,
  type ErroPadrao,
  type Funcionario,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { AcidentesService } from '../acidentes/acidentes.service.js';
import { CompetenciasEpisService } from '../competencias/competencias.service.js';
import { EmergenciaService } from '../emergencia/emergencia.service.js';
import { EpisService } from '../epis/epis.service.js';
import { PgrService } from '../pgr/pgr.service.js';
import { EsocialService } from './esocial.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let acidentes: AcidentesService;
let pgr: PgrService;
let competencias: CompetenciasEpisService;
let esocial: EsocialService;
let emergencia: EmergenciaService;
let epis: EpisService;
const ctx: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};
const hoje = hojeEmBrasilia();
const funcaoId = uuidv7();
const joao: Funcionario = {
  id: uuidv7(),
  matricula: 'A-10',
  nome: 'João Pereira',
  cpf: '52998224725',
  setorId: uuidv7(),
  setorNome: 'Prensas',
  funcaoId,
  funcaoNome: 'Operador de prensa',
  admissao: '2024-03-01',
  email: null,
  telefone: null,
  ativo: true,
  desligamento: null,
  motivoDesligamento: null,
  versao: new Date().toISOString(),
};
const asoId = uuidv7();

const codex = {
  send<R>(padrao: string, m: unknown): Observable<R> {
    const d = (m as { dados: Record<string, unknown> }).dados;
    if (padrao === PATTERNS.funcoes.listar)
      return of([{ id: funcaoId, nome: joao.funcaoNome }]) as Observable<R>;
    if (padrao === PATTERNS.funcionarios.listar)
      return of({
        itens: [joao],
        total: 1,
        pagina: 1,
        porPagina: 100,
      }) as Observable<R>;
    if (padrao === PATTERNS.asos.paraEsocial)
      return of([
        {
          id: asoId,
          funcionarioId: joao.id,
          funcionarioNome: joao.nome,
          cpf: joao.cpf,
          matricula: joao.matricula,
          tipo: 'periodico',
          data: hoje,
          resultado: 'apto',
          proximoExame: somarMeses(hoje, 12),
          medico: 'Dra. Ana',
          crm: '1234',
          ufCrm: null,
          observacao: null,
          exames: [],
          motivoAnulacao: null,
        },
      ]) as Observable<R>;
    return (
      d.id === joao.id
        ? of(joao)
        : throwError(() => ({
            codigo: 'NAO_ENCONTRADO',
            mensagem: 'Não encontrado.',
          }))
    ) as Observable<R>;
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
  acidentes = new AcidentesService(banco.db, codex);
  pgr = new PgrService(banco.db);
  competencias = new CompetenciasEpisService(banco.db, codex);
  esocial = new EsocialService(banco.db, codex);
  emergencia = new EmergenciaService(banco.db, codex);
  epis = new EpisService(banco.db, codex);
});
afterAll(() => banco.encerrar());

const cat = (extra: Partial<DadosDaCat> = {}) => ({
  acidentadoId: joao.id,
  tpAcid: 1,
  hrAcid: '0930',
  hrsTrab: '0300',
  tpLocal: 1,
  dscLograd: 'Rua das Prensas',
  nrLograd: '100',
  codSitGeradora: '200004300',
  codParteAting: '753030000',
  lateralidade: 2,
  codAgntCausador: '302010300',
  indCatObito: 'N',
  indComunPolicia: 'N',
  dtAtendimento: hoje,
  hrAtendimento: '1015',
  indInternacao: 'N',
  durTrat: 5,
  dscLesao: '702000000',
  codCID: 'S610',
  nmEmit: 'Dr. Rui',
  ideOC: 1,
  nrOC: '4567',
  ufOC: 'SP',
  ...extra,
});

describe('Investigação do acidente', () => {
  it('estruturada só em investigação; árvore de causas confere os antecedentes', async () => {
    let a = await acidentes.criar(ctx, {
      tipo: 'com_afastamento',
      data: hoje,
      local: 'Prensa 3',
      acidentado: 'João',
      descricao: 'Prensamento do dedo na prensa 3.',
      diasPerdidos: 5,
    });
    expect(
      (
        await recusa(
          acidentes.registrarInvestigacao(ctx, {
            id: a.id,
            alteracoes: { versao: a.versao },
          }),
        )
      ).codigo,
    ).toBe('REGRA_DE_NEGOCIO');
    a = await acidentes.iniciarInvestigacao(ctx, {
      id: a.id,
      alteracoes: { versao: a.versao },
    });
    expect(
      (
        await recusa(
          acidentes.registrarInvestigacao(ctx, {
            id: a.id,
            alteracoes: {
              versao: a.versao,
              fatos: [
                {
                  fato: 'Mão na área de prensagem',
                  componente: 'individuo',
                  antecedentes: [1],
                },
              ],
            },
          }),
        )
      ).detalhes?.[0]?.mensagem,
    ).toContain('o antecedente 1 não existe');
    a = await acidentes.registrarInvestigacao(ctx, {
      id: a.id,
      alteracoes: {
        versao: a.versao,
        testemunhas: [
          {
            nome: 'Carla',
            funcao: 'Operadora',
            relato: 'Vi a prensa descer com a mão dele dentro.',
          },
        ],
        porques: ['Mão na área de prensagem', 'Cortina de luz desligada'],
        fatos: [
          { fato: 'Dedo prensado', componente: 'individuo', antecedentes: [2] },
          {
            fato: 'Cortina de luz desligada',
            componente: 'material',
            antecedentes: [],
          },
        ],
      },
    });
    expect(a.investigacao.fatos).toHaveLength(2);
    expect(a.investigacao.testemunhas[0]!.nome).toBe('Carla');

    // Complemento da CAT: confere o acidentado e as datas
    expect(
      (
        await recusa(
          acidentes.registrarDadosCat(ctx, {
            id: a.id,
            alteracoes: {
              versao: a.versao,
              ...cat({ dtAtendimento: somarDias(hoje, -1) }),
            },
          }),
        )
      ).detalhes?.[0]?.campo,
    ).toBe('dtAtendimento');
    a = await acidentes.registrarDadosCat(ctx, {
      id: a.id,
      alteracoes: { versao: a.versao, ...cat() },
    });
    expect(a).toMatchObject({
      acidentado: 'João Pereira',
      funcao: 'Operador de prensa',
    });
    expect(a.dadosCat?.codCID).toBe('S610');
  });
});

describe('eSocial SST', () => {
  it('sem configuração não gera; candidatos mostram pendências; pronto gera XML e registra o recibo', async () => {
    expect((await esocial.painel(ctx)).configurado).toBe(false);
    const painel = await esocial.salvarConfiguracao(ctx, {
      cnpj: '11.222.333/0001-81',
      ambiente: 2,
      inicioSst: '2023-01-01',
      medicoNome: 'Dra. Helena',
      medicoCrm: '123456',
      medicoUf: 'sp',
      ambientalNome: 'Eng. Paulo',
      ambientalCpf: '529.982.247-25',
      ambientalOrgao: 4,
      ambientalNumero: '5061234567',
      ambientalUf: 'SP',
    });
    const s2220 = painel.candidatos.find((c) => c.evento === 'S-2220')!;
    expect(s2220.pendencias).toEqual([
      'Informe a UF do CRM.',
      'Informe os exames realizados (procedimento da tabela 27).',
    ]);
    expect(
      (
        await recusa(
          esocial.gerar(ctx, { evento: 'S-2220', referenciaId: asoId }),
        )
      ).mensagem,
    ).toContain('Antes de gerar');

    const s2210 = painel.candidatos.find((c) => c.evento === 'S-2210')!;
    expect(s2210.pendencias).toEqual([]);
    const gerado = await esocial.gerar(ctx, {
      evento: 'S-2210',
      referenciaId: s2210.referenciaId,
    });
    expect(gerado).toMatchObject({
      evento: 'S-2210',
      status: 'gerado',
      funcionarioNome: 'João Pereira',
    });
    expect(gerado.idDoEvento).toMatch(/^ID111222333000181\d{19}$/);
    expect((await esocial.xml(ctx, { id: gerado.id })).xml).toContain(
      '<cpfTrab>52998224725</cpfTrab>',
    );
    const enviado = await esocial.marcarEnviado(ctx, {
      id: gerado.id,
      alteracoes: { recibo: '1.2.0000000000012345678' },
    });
    expect(enviado).toMatchObject({
      status: 'enviado',
      recibo: '1.2.0000000000012345678',
    });

    // S-2240: risco ligado à função sem agente nocivo e sem atividades descritas
    const ruido = await pgr.criar(ctx, {
      grupo: 'fisico',
      local: 'Prensas',
      perigo: 'Ruído contínuo',
      danos: 'Perda auditiva',
      severidade: 2,
      probabilidade: 2,
    });
    await competencias.definirRiscos(ctx, { funcaoId, riscoIds: [ruido.id] });
    let s2240 = (await esocial.painel(ctx)).candidatos.find(
      (c) => c.evento === 'S-2240',
    )!;
    expect(s2240.pendencias).toHaveLength(2);
    await pgr.definirEsocial(ctx, {
      id: ruido.id,
      alteracoes: {
        versao: ruido.versao,
        dados: {
          codAgNoc: '02.01.001',
          tpAval: 1,
          intConc: 92,
          limTol: 85,
          unMed: 1,
          tecMedicao: 'NHO 01',
        },
      },
    });
    await emergencia.salvarOrdemSst(ctx, {
      funcaoId,
      atividades: 'Operar prensa excêntrica',
      procedimentos: 'Bloqueio antes de manutenção',
      proibicoes: 'Desligar a cortina de luz',
    });
    const protetor = await epis.criar(ctx, {
      nome: 'Protetor auricular',
      ca: '5745',
      validadeCa: somarDias(hoje, 300),
    });
    await competencias.definirEpis(ctx, {
      funcaoId,
      itens: [{ epiId: protetor.id, riscoId: ruido.id }],
    });
    s2240 = (await esocial.painel(ctx)).candidatos.find(
      (c) => c.evento === 'S-2240',
    )!;
    expect(s2240.pendencias).toEqual([]);
    const ev = await esocial.gerar(ctx, {
      evento: 'S-2240',
      referenciaId: joao.id,
    });
    const xml = (await esocial.xml(ctx, { id: ev.id })).xml;
    expect(xml).toContain('<dtIniCondicao>2024-03-01</dtIniCondicao>');
    expect(xml).toContain('<codAgNoc>02.01.001</codAgNoc>');
    expect(xml).toContain('<epi><docAval>5745</docAval></epi>');
  });
});

describe('Emergência', () => {
  it('extintor com vencimentos, inspeção não conforme deixa pendência; brigada com validade', async () => {
    let ext = await emergencia.criarEquipamento(ctx, {
      categoria: 'extintor',
      identificacao: 'EXT-01',
      local: 'Portaria',
      ultimaRecarga: somarMeses(hoje, -13),
      ultimoTeste: '2024-01-10',
    });
    expect(ext).toMatchObject({ inspecaoDias: 30, vencido: true });
    expect(
      (
        await recusa(
          emergencia.criarEquipamento(ctx, {
            categoria: 'extintor',
            identificacao: 'EXT-01',
            local: 'Outro',
          }),
        )
      ).detalhes?.[0]?.campo,
    ).toBe('identificacao');
    expect(
      (
        await recusa(
          emergencia.inspecionar(ctx, {
            id: ext.id,
            alteracoes: {
              versao: ext.versao,
              data: hoje,
              resultado: 'nao_conforme',
              responsavel: 'Brigadista',
            },
          }),
        )
      ).detalhes?.[0]?.campo,
    ).toBe('observacao');
    ext = await emergencia.inspecionar(ctx, {
      id: ext.id,
      alteracoes: {
        versao: ext.versao,
        data: hoje,
        resultado: 'nao_conforme',
        responsavel: 'Brigadista',
        observacao: 'Lacre rompido',
      },
    });
    expect(ext).toMatchObject({
      pendencia: 'Lacre rompido',
      ultimaInspecao: hoje,
    });
    ext = await emergencia.inspecionar(ctx, {
      id: ext.id,
      alteracoes: {
        versao: ext.versao,
        data: hoje,
        resultado: 'conforme',
        responsavel: 'Brigadista',
        recarregado: true,
      },
    });
    expect(ext).toMatchObject({
      pendencia: null,
      ultimaRecarga: hoje,
      vencido: false,
    });
    expect(ext.inspecoes).toHaveLength(2);

    const b = await emergencia.incluirBrigadista(ctx, {
      funcionarioId: joao.id,
      papel: 'lider',
      treinadoEm: somarMeses(hoje, -13),
    });
    expect(b).toMatchObject({
      nome: 'João Pereira',
      setor: 'Prensas',
      vencido: true,
    });
    expect(
      (
        await recusa(
          emergencia.incluirBrigadista(ctx, {
            funcionarioId: joao.id,
            papel: 'brigadista',
            treinadoEm: hoje,
          }),
        )
      ).detalhes?.[0]?.mensagem,
    ).toContain('já está na brigada');

    const plano = await emergencia.salvarPlano(ctx, {
      cenarios: 'Incêndio no almoxarifado; vazamento de GLP',
      rotasDeFuga: 'Pelas saídas sinalizadas',
      pontoDeEncontro: 'Estacionamento',
      procedimentos: 'Acionar o alarme, evacuar e chamar o 193',
      contatos: [{ nome: 'Bombeiros', telefone: '193' }],
    });
    expect(
      (await recusa(emergencia.salvarPlano(ctx, { ...plano, versao: 'velha' })))
        .codigo,
    ).toBe('CONFLITO');
  });
});
