import { of, type Observable } from 'rxjs';
import { ErroDeNegocio, hojeEmBrasilia } from '@davinci/shared';
import {
  criteriosSugeridos,
  METODOLOGIA_PADRAO,
  uuidv7,
  type Auditoria,
  type Contexto,
  type ErroPadrao,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { RoteiroService } from '../roteiro/roteiro.service.js';
import { BANCO_DE_PERGUNTAS } from '../conteudo/perguntas.js';
import { AuditoriasService } from './auditorias.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let s: AuditoriasService;
let roteiro: RoteiroService;
const ctx: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};
const hoje = hojeEmBrasilia();
const qualidade = {
  send: <R>(): Observable<R> =>
    of({ id: uuidv7(), numero: 'NC-2026-001' } as R),
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
const plano = (a: Auditoria, extra: Record<string, unknown> = {}) => ({
  id: a.id,
  alteracoes: { versao: a.versao, ...extra },
});

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  s = new AuditoriasService(banco.db, qualidade);
  roteiro = new RoteiroService(banco.db);
});
afterAll(() => banco.encerrar());

describe('Plano, relatório e log do auditor', () => {
  it('uma edição só por norma; metodologia padrão; critérios sugeridos incluem CSR na IATF', async () => {
    const base = {
      tipo: 'interna',
      escopo: 'Processos de produção da unidade Matriz.',
      normas: ['iso9001', 'iso9001_2026'],
      auditorLider: 'Paula Ribeiro',
      dataInicio: hoje,
      dataFim: hoje,
    };
    expect(
      (await recusa(s.criar(ctx, base))).detalhes?.[0]?.mensagem,
    ).toContain('uma edição só');
    const a = await s.criar(ctx, {
      ...base,
      normas: ['iso9001_2026', 'iatf16949'],
    });
    expect(a.plano).toMatchObject({
      metodologia: METODOLOGIA_PADRAO,
      papel: 'lider',
      cronograma: [],
      horas: null,
    });
    expect(criteriosSugeridos(a.normas)).toContain('CSR');
  });

  it('salva o plano completo; concluída só muda papel e horas; log soma horas, normas, perguntas e achados', async () => {
    let a = await s.criar(ctx, {
      tipo: 'certificacao',
      escopo: 'Certificação do SGQ da unidade Matriz.',
      normas: ['iso9001_2026'],
      auditorLider: 'Paula Ribeiro',
      equipe: 'Marcos Lima',
      dataInicio: hoje,
      dataFim: hoje,
    });
    a = await s.salvarPlano(
      ctx,
      plano(a, {
        empresaAuditada: 'Metalúrgica Sul Ltda',
        unidade: 'Matriz',
        objetivo: 'Verificar a conformidade para a certificação.',
        processos: ['compras', 'producao'],
        cronograma: [
          {
            horaInicio: '08:00',
            horaFim: '09:00',
            processo: 'Abertura',
            auditado: 'Direção',
            local: 'Sala 1',
          },
        ],
        auditados: [
          {
            nome: 'João Silva',
            funcao: 'Gerente de Compras',
            processo: 'Compras',
          },
        ],
        logistica: {
          sala: 'Sala 1 com projetor',
          epi: 'Botina e óculos',
          acompanhante: 'Ana',
          observacoes: '',
        },
        emissor: 'Paula Ribeiro',
        horas: 8,
      }),
    );
    expect(a.plano).toMatchObject({
      empresaAuditada: 'Metalúrgica Sul Ltda',
      processos: ['compras', 'producao'],
      horas: 8,
      logistica: { sala: 'Sala 1 com projetor' },
    });
    a = await s.iniciar(ctx, { id: a.id, alteracoes: { versao: a.versao } });
    const pergunta = BANCO_DE_PERGUNTAS.find(
      (p) => p.norma === 'iso9001_2026',
    )!;
    await roteiro.selecionar(ctx, {
      id: a.id,
      alteracoes: { incluir: [pergunta.codigo] },
    });
    await roteiro.responder(ctx, {
      id: a.id,
      alteracoes: {
        codigo: pergunta.codigo,
        resposta: 'nao_conforme',
        evidencia: 'Sem registro de avaliação',
      },
    });
    a = await s.registrarConstatacao(ctx, {
      id: a.id,
      alteracoes: {
        versao: a.versao,
        constatacao: {
          tipo: 'nc_menor',
          norma: 'iso9001_2026',
          clausula: pergunta.clausula,
          descricao: 'Avaliação de fornecedor não evidenciada.',
          evidencia: 'Sem registro',
          perguntaCodigo: pergunta.codigo,
          tipoDesvio: 'registro',
          causaRaiz: 'Sem rotina definida',
          acaoCorretiva: 'Definir rotina semestral',
        },
      },
    });
    expect(a.constatacoes[0]).toMatchObject({
      perguntaCodigo: pergunta.codigo,
      tipoDesvio: 'registro',
      causaRaiz: 'Sem rotina definida',
    });
    const c = a.constatacoes[0]!;
    a = await s.formalizarNc(ctx, {
      id: a.id,
      alteracoes: {
        versao: a.versao,
        constatacaoId: c.id,
        responsavel: 'Compras',
      },
    });
    a = await s.concluir(ctx, {
      id: a.id,
      alteracoes: {
        versao: a.versao,
        conclusao: 'Sistema implementado com pontos de melhoria.',
      },
    });
    a = await s.salvarPlano(
      ctx,
      plano(a, { empresaAuditada: 'Outro nome', papel: 'lider', horas: 12 }),
    );
    expect(a.plano).toMatchObject({
      empresaAuditada: 'Metalúrgica Sul Ltda',
      horas: 12,
    });
    const log = await s.logDoAuditor(ctx, { auditor: 'paula ribeiro' });
    expect(log).toMatchObject({
      horas: 12,
      referenciais: ['iso9001_2026', 'iatf16949'],
      perguntasConduzidas: 1,
      achados: 1,
    });
    expect(log.processos).toEqual(['compras', 'producao']);
    const membro = await s.logDoAuditor(ctx, { auditor: 'Marcos' });
    expect(membro.auditorias.find((x) => x.id === a.id)?.papel).toBe('auditor');
  });
});
