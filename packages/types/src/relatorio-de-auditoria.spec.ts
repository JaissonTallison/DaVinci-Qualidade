import { describe, expect, it } from 'vitest';
import type { Auditoria, RoteiroDaAuditoria } from './auditorias.js';
import {
  indiceDeConformidade,
  proximoPasso,
  resultadoDaAuditoria,
  revisarRelatorio,
} from './relatorio-de-auditoria.js';

const respostas = (
  conforme: number,
  parcial: number,
  nao_conforme: number,
  pendente = 0,
) => ({
  conforme,
  parcial,
  nao_conforme,
  pendente,
});
const contagem = (k: Partial<Auditoria['contagem']> = {}) => ({
  conformidade: 0,
  nc_maior: 0,
  nc_menor: 0,
  observacao: 0,
  oportunidade: 0,
  ...k,
});

describe('Índice de conformidade', () => {
  it('conformes sobre as avaliadas, sem contar as pendentes', () => {
    expect(indiceDeConformidade(respostas(7, 2, 1, 5))).toBe(70);
  });
  it('sem resposta, sem índice', () => {
    expect(indiceDeConformidade(respostas(0, 0, 0, 3))).toBeNull();
  });
});

describe('Resultado da auditoria', () => {
  it('uma NC basta para não conforme', () => {
    expect(
      resultadoDaAuditoria(
        { contagem: contagem({ nc_menor: 1 }) },
        respostas(9, 0, 0),
      ),
    ).toBe('nao_conforme');
    expect(
      resultadoDaAuditoria({ contagem: contagem() }, respostas(9, 0, 1)),
    ).toBe('nao_conforme');
  });
  it('parcial ou observação, sem NC: implementado com pontos de melhoria', () => {
    expect(
      resultadoDaAuditoria(
        { contagem: contagem({ observacao: 1 }) },
        respostas(9, 0, 0),
      ),
    ).toBe('com_melhorias');
    expect(
      resultadoDaAuditoria({ contagem: contagem() }, respostas(9, 1, 0)),
    ).toBe('com_melhorias');
  });
  it('só conformidades: sistema conforme', () => {
    expect(
      resultadoDaAuditoria(
        { contagem: contagem({ conformidade: 3 }) },
        respostas(9, 0, 0),
      ),
    ).toBe('conforme');
  });
});

describe('Revisão do relatório', () => {
  const auditoria = {
    normas: ['iso9001_2026'],
    dataInicio: '2026-11-10',
    dataFim: '2026-11-11',
    auditorLider: 'Ana Souza',
    escopo: 'SGQ da matriz',
    conclusao: null,
    ncsPendentes: 1,
    constatacoes: [
      {
        tipo: 'nc_menor',
        perguntaCodigo: 'P-1',
        causaRaiz: null,
        acaoCorretiva: 'Revisar o PR-08',
      },
    ],
    plano: {
      empresaAuditada: 'Metalúrgica Alfa',
      objetivo: null,
      criterios: 'ISO 9001:2026',
      processos: ['compras', 'producao'],
      cronograma: [],
      pontosFortes: null,
    },
  } as unknown as Auditoria;
  const roteiro: Pick<RoteiroDaAuditoria, 'perguntas' | 'contagem'> = {
    perguntas: [
      {
        codigo: 'P-1',
        processo: 'compras',
        resposta: 'nao_conforme',
        evidencia: 'PO 123 sem aprovação',
      },
      {
        codigo: 'P-2',
        processo: 'compras',
        resposta: 'parcial',
        evidencia: 'Lista sem data',
      },
      {
        codigo: 'P-3',
        processo: 'producao',
        resposta: 'pendente',
        evidencia: null,
      },
    ] as RoteiroDaAuditoria['perguntas'],
    contagem: respostas(0, 1, 1, 1),
  };
  const r = revisarRelatorio(auditoria, roteiro, { prontidao: 40 });
  const status = (t: string) => r.find((v) => v.titulo === t);

  it('são 20 verificações', () => {
    expect(r).toHaveLength(20);
  });
  it('aponta o que falta e onde corrigir', () => {
    expect(status('Objetivo descrito')).toMatchObject({
      ok: false,
      destino: 'plano',
    });
    expect(status('Todas as perguntas avaliadas')).toMatchObject({
      ok: false,
      falta: '1 pergunta(s) sem resposta.',
    });
    expect(status('Todos os processos auditados')).toMatchObject({
      ok: false,
      falta: '1 processo(s) sem pergunta respondida.',
    });
    expect(status('Achados registrados')).toMatchObject({
      ok: false,
      falta: '1 achado(s) Parcial ou Não conforme sem constatação.',
    });
    expect(status('NCs com causa raiz')?.ok).toBe(false);
    expect(status('NCs com ação corretiva')?.ok).toBe(true);
    expect(status('Kit pré-auditoria concluído')?.falta).toBe(
      'Prontidão do kit em 40%.',
    );
  });
  it('o que já está pronto passa', () => {
    expect(status('Organização auditada informada')?.ok).toBe(true);
    expect(status('Respostas com evidência')?.ok).toBe(true);
  });
});

describe('Próximo passo', () => {
  const vazio = { perguntas: [], contagem: respostas(0, 0, 0, 0) } as Pick<
    RoteiroDaAuditoria,
    'perguntas' | 'contagem'
  >;
  const plano = {
    objetivo: 'Verificar',
    processos: ['compras'],
  } as unknown as Auditoria['plano'];
  const base = {
    status: 'planejada',
    plano,
    constatacoes: [],
    ncsPendentes: 0,
  } as unknown as Auditoria;

  it('planejada segue plano, roteiro, kit e início', () => {
    expect(
      proximoPasso(
        { ...base, plano: { ...plano, objetivo: null } },
        vazio,
        null,
      ).destino,
    ).toBe('plano');
    expect(proximoPasso(base, vazio, null).destino).toBe('roteiro');
    const comPergunta = {
      perguntas: [{ codigo: 'P-1', resposta: 'pendente' }],
      contagem: respostas(0, 0, 0, 1),
    } as unknown as RoteiroDaAuditoria;
    expect(proximoPasso(base, comPergunta, { prontidao: 50 }).destino).toBe(
      'kit',
    );
    expect(proximoPasso(base, comPergunta, { prontidao: 100 }).titulo).toBe(
      'Inicie a auditoria',
    );
  });

  it('em andamento: responder, registrar achados, formalizar NCs, fechar', () => {
    const andamento = { ...base, status: 'em_andamento' } as Auditoria;
    const pendente = {
      perguntas: [{ codigo: 'P-1', resposta: 'pendente' }],
      contagem: respostas(0, 0, 0, 1),
    } as unknown as RoteiroDaAuditoria;
    expect(proximoPasso(andamento, pendente, null).destino).toBe('execucao');
    const nc = {
      perguntas: [{ codigo: 'P-1', resposta: 'nao_conforme' }],
      contagem: respostas(0, 0, 1, 0),
    } as unknown as RoteiroDaAuditoria;
    expect(proximoPasso(andamento, nc, null).titulo).toBe(
      'Registre os achados',
    );
    const registrada = {
      ...andamento,
      constatacoes: [{ perguntaCodigo: 'P-1' }],
      ncsPendentes: 1,
    } as unknown as Auditoria;
    expect(proximoPasso(registrada, nc, null).titulo).toBe('Formalize as NCs');
    expect(
      proximoPasso({ ...registrada, ncsPendentes: 0 }, nc, null).destino,
    ).toBe('relatorio');
  });
});
