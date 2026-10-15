/**
 * Módulos contratados por empresa: cada grupo do QSSMA é um módulo. Desligado, some do menu, das permissões e
 * dos painéis; os dados ficam. Os cadastros (clientes, fornecedores, funcionários) estão sempre ligados.
 */
import { z } from 'zod';
import type { Permissao } from './permissoes.js';

export interface DefinicaoDeRecurso {
  nome: string;
  descricao: string;
  tipo: 'modulo' | 'recurso';
  /** Só liga com estes ligados (desligar um deles desliga este). */
  depende?: string[];
  /** Permissões que somem quando o recurso está desligado (prefixo termina em "."). */
  permissoes?: string[];
}

export const RECURSOS = {
  qualidade: {
    nome: 'Qualidade',
    descricao:
      'Inspeções, checklists, não conformidades, planos de ação, rastreabilidade e calibração (ISO 9001).',
    tipo: 'modulo',
    permissoes: ['qualidade.'],
  },
  auditorias: {
    nome: 'Auditorias',
    descricao:
      'Auditorias com kit pré-auditoria, roteiros de entrevista e banco de conteúdo para 7 normas.',
    tipo: 'modulo',
    permissoes: ['auditorias.'],
  },
  sgi: {
    nome: 'Gestão do SGI',
    descricao:
      'Riscos e oportunidades, objetivos, análise crítica pela direção e gestão de mudanças.',
    tipo: 'modulo',
    permissoes: ['sgi.'],
  },
  servicos: {
    nome: 'Serviços',
    descricao:
      'Ordens de serviço, avaliação de serviços, satisfação do cliente (NPS) e avaliação de fornecedores.',
    tipo: 'modulo',
    permissoes: ['servicos.'],
  },
  seguranca: {
    nome: 'Segurança do Trabalho',
    descricao:
      'Acidentes, indicadores SST, PGR, permissões de trabalho, EPIs, CIPA/DDS/APR e terceiros (ISO 45001 e NRs).',
    tipo: 'modulo',
    permissoes: ['seguranca.'],
  },
  ambiental: {
    nome: 'Meio Ambiente',
    descricao:
      'Aspectos e impactos, requisitos legais, licenças, resíduos/MTR, químicos, consumo, GEE e monitoramento (ISO 14001).',
    tipo: 'modulo',
    permissoes: ['ambiental.'],
  },
  esg: {
    nome: 'Agenda ESG',
    descricao:
      'Temas materiais, matriz de materialidade, ODS e painel com os indicadores dos outros módulos.',
    tipo: 'modulo',
    permissoes: ['esg.'],
  },
} as const satisfies Record<string, DefinicaoDeRecurso>;
export type Recurso = keyof typeof RECURSOS;
export const TODOS_OS_RECURSOS = Object.keys(RECURSOS) as Recurso[];
export const ehRecurso = (v: unknown): v is Recurso =>
  typeof v === 'string' && v in RECURSOS;

/** Empresa nova: todos os módulos (o administrador desliga o que não contratou). */
export const RECURSOS_BASICOS: Recurso[] = [
  'qualidade',
  'auditorias',
  'sgi',
  'servicos',
  'seguranca',
  'ambiental',
  'esg',
];

/**
 * Recursos que valem de fato: sem lista (empresas de antes dos recursos), todos; um recurso cujo módulo de que
 * depende está desligado também fica desligado.
 */
export function recursosEfetivos(
  ligados: readonly string[] | null | undefined,
): Recurso[] {
  if (!ligados) return [...TODOS_OS_RECURSOS];
  const conjunto = new Set(ligados.filter(ehRecurso));
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const r of [...conjunto]) {
      const def: DefinicaoDeRecurso = RECURSOS[r];
      if (def.depende?.some((d) => !conjunto.has(d as Recurso))) {
        conjunto.delete(r);
        mudou = true;
      }
    }
  }
  return TODOS_OS_RECURSOS.filter((r) => conjunto.has(r));
}

/** Tira as permissões dos recursos desligados (o menu e o gateway já se guiam por elas). */
export function permissoesComRecursos<P extends Permissao>(
  permissoes: readonly P[],
  recursos: readonly Recurso[],
): P[] {
  const desligados = TODOS_OS_RECURSOS.filter((r) => !recursos.includes(r));
  const fora = desligados.flatMap(
    (r) => (RECURSOS[r] as DefinicaoDeRecurso).permissoes ?? [],
  );
  return permissoes.filter(
    (p) => !fora.some((f) => (f.endsWith('.') ? p.startsWith(f) : p === f)),
  );
}

export const salvarRecursosSchema = z.object({
  recursos: z
    .array(z.string().refine(ehRecurso, 'Recurso desconhecido.'))
    .max(50),
});
export interface RecursosDaEmpresa {
  /** Os que valem (com as dependências aplicadas). */
  ligados: Recurso[];
  /** null = empresa de antes dos recursos (tudo ligado). */
  escolhidos: Recurso[] | null;
}

/** O que está em aberto e impede desligar o recurso (cada serviço responde pelos seus). */
export interface PendenciaDeRecurso {
  recurso: Recurso;
  descricao: string;
}
