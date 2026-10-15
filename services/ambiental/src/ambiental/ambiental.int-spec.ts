import {
  ErroDeNegocio,
  hojeEmBrasilia,
  somarDias,
  somarMeses,
} from '@davinci/shared';
import { uuidv7, type Contexto, type ErroPadrao } from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { ConsumoService } from '../consumo/consumo.service.js';
import { MonitoramentosService } from '../monitoramentos/monitoramentos.service.js';
import { PrazosService } from '../prazos/prazos.service.js';
import { QuimicosService } from '../quimicos/quimicos.service.js';
import { AmbientalService, situacaoDaLicenca } from './ambiental.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let s: AmbientalService;
let quimicos: QuimicosService;
let monit: MonitoramentosService;
let consumo: ConsumoService;
const ctx: Contexto = {
  empresaId: uuidv7(),
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
  quimicos = new QuimicosService(banco.db);
  monit = new MonitoramentosService(banco.db);
  consumo = new ConsumoService(banco.db);
  s = new AmbientalService(banco.db, quimicos, monit);
});
afterAll(() => banco.encerrar());

describe('Meio Ambiente', () => {
  it('situação da licença: vencida, protocolada, janela de renovação e vigente', () => {
    expect(
      situacaoDaLicenca('2026-01-01', '2025-09-01', true, '2026-02-01'),
    ).toBe('vencida');
    expect(
      situacaoDaLicenca('2027-01-01', '2026-09-01', true, '2026-10-01'),
    ).toBe('em_renovacao');
    expect(
      situacaoDaLicenca('2027-01-01', '2026-09-01', false, '2026-10-01'),
    ).toBe('renovar');
    expect(
      situacaoDaLicenca('2027-01-01', '2026-09-01', false, '2026-08-01'),
    ).toBe('vigente');
  });

  it('aspecto significativo exige controle; requisito legal torna significativo; prazo vencido aparece', async () => {
    const base = {
      atividade: 'Pintura',
      aspecto: 'Emissão de COV',
      impacto: 'Poluição do ar',
      situacao: 'normal',
      incidencia: 'direta',
      severidade: 4,
      frequencia: 4,
    };
    const erro = await recusa(s.criarAspecto(ctx, base));
    expect(erro.detalhes?.map((d) => d.campo)).toEqual(
      expect.arrayContaining(['acoes']),
    );
    const a = await s.criarAspecto(ctx, {
      ...base,
      acoes: 'Cabine com filtro',
      responsavel: 'Manutenção',
      prazo: somarDias(hoje, -2),
    });
    expect(a).toMatchObject({
      significancia: 'alta',
      significativo: true,
      prazoVencido: true,
    });
    const leve = await s.criarAspecto(ctx, {
      ...base,
      aspecto: 'Ruído',
      severidade: 1,
      frequencia: 2,
      requisitoLegal: true,
      acoes: 'Medição anual',
      responsavel: 'SESMT',
      prazo: somarDias(hoje, 20),
    });
    expect(leve).toMatchObject({
      significancia: 'baixa',
      significativo: true,
      prazoVencido: false,
    });
    const inativo = await s.situacaoAspecto(ctx, {
      id: a.id,
      alteracoes: { versao: a.versao, ativo: false },
    });
    expect(inativo.prazoVencido).toBe(false);
  });

  it('requisito: sem avaliação está vencido; "não atende" exige ação; próxima avaliação em 12 meses', async () => {
    let r = await s.criarRequisito(ctx, {
      norma: 'Lei 12.305/2010 (PNRS)',
      esfera: 'federal',
      tema: 'Resíduos',
      requisito: 'Elaborar e manter o PGRS.',
    });
    expect(r).toMatchObject({
      atendimento: 'nao_avaliado',
      avaliacaoVencida: true,
    });
    const erro = await recusa(
      s.avaliarRequisito(ctx, {
        id: r.id,
        alteracoes: {
          versao: r.versao,
          data: hoje,
          atendimento: 'nao_atende',
          evidencia: 'PGRS desatualizado',
        },
      }),
    );
    expect(erro.detalhes?.[0]?.campo).toBe('acao');
    r = await s.avaliarRequisito(ctx, {
      id: r.id,
      alteracoes: {
        versao: r.versao,
        data: hoje,
        atendimento: 'atende',
        evidencia: 'PGRS revisão 3',
        acao: 'sobra',
      },
    });
    expect(r).toMatchObject({
      atendimento: 'atende',
      acao: null,
      avaliacaoVencida: false,
      proximaAvaliacao: somarMeses(hoje, 12),
    });
  });

  it('licença: protocolo tira do "renovar"; condicionante periódica gera a próxima', async () => {
    let l = await s.criarLicenca(ctx, {
      tipo: 'lo',
      numero: '1234/2024',
      orgao: 'IAT-PR',
      emissao: '2024-01-10',
      validade: somarDias(hoje, 60),
      diasParaRenovar: 120,
    });
    expect(l.situacao).toBe('renovar');
    l = await s.criarCondicionante(ctx, {
      id: l.id,
      alteracoes: {
        descricao: 'Monitoramento de efluentes',
        prazo: somarDias(hoje, -1),
        periodicidadeMeses: 6,
      },
    });
    expect(l.condicionantes[0]).toMatchObject({ vencida: true });
    expect((await s.resumo(ctx)).condicionantesVencidas).toBe(1);
    l = await s.cumprirCondicionante(ctx, {
      id: l.condicionantes[0]!.id,
      alteracoes: { data: hoje, evidencia: 'Laudo 55/2026' },
    });
    expect(l.condicionantes).toHaveLength(2);
    expect(l.condicionantes.find((c) => !c.cumpridaEm)?.prazo).toBe(
      somarMeses(somarDias(hoje, -1), 6),
    );
    l = await s.renovacaoSolicitada(ctx, {
      id: l.id,
      alteracoes: { versao: l.versao, data: hoje, protocolo: 'PROT-889' },
    });
    expect(l.situacao).toBe('em_renovacao');
    const prazos = await new PrazosService(s, quimicos, monit).prazos(ctx, {
      dias: 90,
    });
    expect(prazos.map((p) => p.tipo)).toEqual(
      expect.arrayContaining([
        'Validade de licença',
        'Ação de aspecto ambiental',
      ]),
    );
  });

  it('resíduo: saída com MTR, CDF atrasado depois de 30 dias e CDF não antes da saída', async () => {
    const r = await s.criarResiduo(ctx, {
      nome: 'Borra de tinta',
      classe: 'I',
      origem: 'Pintura',
      acondicionamento: 'Tambor 200 L',
      destinacao: 'Coprocessamento',
      unidade: 'kg',
    });
    const data = somarDias(hoje, -40);
    let ss = await s.registrarSaida(ctx, {
      residuoId: r.id,
      data,
      quantidade: 350.5,
      mtr: '240012345',
      transportador: 'TransRes',
      destinador: 'Votorantim',
    });
    expect(ss[0]).toMatchObject({
      cdfAtrasado: true,
      residuoNome: 'Borra de tinta',
    });
    const erro = await recusa(
      s.registrarCdf(ctx, {
        id: ss[0]!.id,
        alteracoes: { numero: 'CDF-1', data: somarDias(data, -1) },
      }),
    );
    expect(erro.detalhes?.[0]?.campo).toBe('data');
    ss = await s.registrarCdf(ctx, {
      id: ss[0]!.id,
      alteracoes: { numero: 'CDF-1', data: hoje },
    });
    expect(ss[0]).toMatchObject({ cdfNumero: 'CDF-1', cdfAtrasado: false });
    if (data.slice(0, 4) === hoje.slice(0, 4))
      expect((await s.listarResiduos(ctx))[0]?.quantidadeNoAno).toBe(350.5);
  });

  it('produto químico: FDS revisada há mais de 5 anos fica vencida; revisão no futuro é recusada', async () => {
    const base = {
      nome: 'Thinner 2750',
      fabricante: 'Tintas Sul',
      cas: '108-88-3',
      perigos: ['inflamavel', 'saude'],
      local: 'Almoxarifado de inflamáveis',
      unidade: 'L',
    };
    expect(
      (
        await recusa(
          quimicos.criar(ctx, { ...base, fdsRevisao: somarDias(hoje, 1) }),
        )
      ).detalhes?.[0]?.campo,
    ).toBe('fdsRevisao');
    expect(
      (
        await recusa(
          quimicos.criar(ctx, { ...base, cas: '1088-3', fdsRevisao: hoje }),
        )
      ).detalhes?.[0]?.campo,
    ).toBe('cas');
    const p = await quimicos.criar(ctx, {
      ...base,
      quantidadeMaxima: '200',
      fdsRevisao: somarMeses(hoje, -61),
    });
    expect(p).toMatchObject({
      fdsVencida: true,
      perigos: ['inflamavel', 'saude'],
      quantidadeMaxima: 200,
    });
    const atual = await quimicos.atualizar(ctx, {
      id: p.id,
      alteracoes: { ...base, versao: p.versao, fdsRevisao: hoje },
    });
    expect(atual).toMatchObject({
      fdsVencida: false,
      proximaRevisaoFds: somarMeses(hoje, 60),
    });
  });

  it('consumo: um registro por fonte e mês (o segundo substitui); mês futuro recusado; GEE = consumo × fator', async () => {
    const ano = Number(hoje.slice(0, 4));
    const mes = hoje.slice(0, 7);
    await consumo.registrar(ctx, {
      fonte: 'energia',
      competencia: mes,
      quantidade: '10.000',
    });
    let cs = await consumo.registrar(ctx, {
      fonte: 'energia',
      competencia: mes,
      quantidade: '12.500',
      custo: '9.800,50',
    });
    expect(cs.filter((c) => c.fonte === 'energia')).toEqual([
      { fonte: 'energia', competencia: mes, quantidade: 12500, custo: 9800.5 },
    ]);
    await consumo.registrar(ctx, {
      fonte: 'diesel',
      competencia: mes,
      quantidade: '1000',
    });
    await consumo.registrar(ctx, {
      fonte: 'agua',
      competencia: mes,
      quantidade: '320',
    });
    const futuro = `${ano + 1}-01`;
    expect(
      (
        await recusa(
          consumo.registrar(ctx, {
            fonte: 'agua',
            competencia: futuro,
            quantidade: '1',
          }),
        )
      ).detalhes?.[0]?.campo,
    ).toBe('competencia');
    let inv = await consumo.inventario(ctx, { ano });
    expect(inv.semFator.sort()).toEqual(['diesel', 'energia']);
    expect(inv.linhas.map((l) => l.fonte)).not.toContain('agua');
    await consumo.definirFator(ctx, {
      fonte: 'diesel',
      ano,
      fator: '2,5',
      referencia: 'Fator de teste',
    });
    inv = await consumo.definirFator(ctx, {
      fonte: 'energia',
      ano,
      fator: '0,1',
      referencia: 'Fator de teste',
    });
    expect(inv).toMatchObject({
      escopo1: 2.5,
      escopo2: 1.25,
      total: 3.75,
      semFator: [],
    });
  });

  it('monitoramento: exige um limite; resultado fora do limite e próxima coleta pela periodicidade', async () => {
    const base = {
      tipo: 'efluente',
      ponto: 'Saída da ETE',
      parametro: 'pH',
      unidade: 'pH',
      periodicidadeMeses: 3,
    };
    expect((await recusa(monit.criar(ctx, base))).detalhes?.[0]?.campo).toBe(
      'limiteMaximo',
    );
    expect(
      (
        await recusa(
          monit.criar(ctx, { ...base, limiteMinimo: '9', limiteMaximo: '5' }),
        )
      ).detalhes?.[0]?.campo,
    ).toBe('limiteMaximo');
    let m = await monit.criar(ctx, {
      ...base,
      limiteMinimo: '5',
      limiteMaximo: '9',
    });
    expect(m).toMatchObject({ ultimo: null, proximaColeta: hoje });
    const coleta = somarMeses(hoje, -4);
    m = await monit.registrarResultado(ctx, {
      id: m.id,
      alteracoes: { data: coleta, valor: '9,4', laudo: 'L-120' },
    });
    expect(m).toMatchObject({
      ultimo: { valor: 9.4, conforme: false },
      proximaColeta: somarMeses(coleta, 3),
      coletaVencida: true,
    });
    expect(await s.resumo(ctx)).toMatchObject({
      foraDoLimite: 1,
      coletasVencidas: 1,
      fdsVencidas: 0,
    });
    m = await monit.registrarResultado(ctx, {
      id: m.id,
      alteracoes: { data: hoje, valor: '7' },
    });
    expect(m).toMatchObject({
      ultimo: { conforme: true },
      coletaVencida: false,
    });
    expect(m.resultados).toHaveLength(2);
    await quimicos.criar(ctx, {
      nome: 'Óleo hidráulico 68',
      fabricante: 'Lubrifica',
      local: 'Manutenção',
      unidade: 'L',
      fdsRevisao: somarMeses(hoje, -58),
    });
    const prazos = await new PrazosService(s, quimicos, monit).prazos(ctx, {
      dias: 365,
    });
    expect(prazos.map((p) => p.tipo)).toEqual(
      expect.arrayContaining(['Revisão de FDS', 'Coleta de monitoramento']),
    );
  });
});
