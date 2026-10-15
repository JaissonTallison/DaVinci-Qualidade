/**
 * Gestão do SGI (serviço sgi): riscos e oportunidades, objetivos, análise crítica pela direção e gestão de mudanças.
 * ISO 9001 6.1, 6.2, 6.3 e 9.3. docs/05-modulos/sgi.md
 */
import { z } from 'zod';
import {
  chaves,
  data,
  enumOpcional,
  opcional,
  texto,
  textoOpcional,
} from './validadores.js';

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);
const nota = (rotulo: string) =>
  z.coerce
    .number({ error: `Escolha ${rotulo}.` })
    .int()
    .min(1, `Escolha ${rotulo}.`)
    .max(5, `Escolha ${rotulo}.`);

// ---------------------------------------------------------------- riscos e oportunidades (6.1)

export const TIPOS_RO = {
  risco: 'Risco',
  oportunidade: 'Oportunidade',
} as const;
export type TipoRo = keyof typeof TIPOS_RO;
export const CLASSES_RO = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
} as const;
export type ClasseRo = keyof typeof CLASSES_RO;

/** Probabilidade × impacto (1 a 5): até 6 baixa, até 12 média, acima alta. */
export function classeDoRo(probabilidade: number, impacto: number): ClasseRo {
  const p = probabilidade * impacto;
  return p <= 6 ? 'baixa' : p <= 12 ? 'media' : 'alta';
}

type ComTratamento = {
  probabilidade: number;
  impacto: number;
  acao: string | null;
  responsavel: string | null;
  prazo: string | null;
};
const exigeTratamento = (r: ComTratamento, ctx: z.RefinementCtx) => {
  if (classeDoRo(r.probabilidade, r.impacto) !== 'alta') return;
  if (!r.acao)
    ctx.addIssue({
      code: 'custom',
      path: ['acao'],
      message: 'Classificação alta: informe a ação.',
    });
  if (!r.responsavel)
    ctx.addIssue({
      code: 'custom',
      path: ['responsavel'],
      message: 'Classificação alta: informe o responsável.',
    });
  if (!r.prazo)
    ctx.addIssue({
      code: 'custom',
      path: ['prazo'],
      message: 'Classificação alta: informe o prazo.',
    });
};
const camposRo = {
  tipo: z.enum(chaves(TIPOS_RO), { error: 'Escolha risco ou oportunidade.' }),
  processo: texto('o processo', 120, 2),
  descricao: texto('a descrição', 500, 5),
  contexto: textoOpcional(500),
  probabilidade: nota('a probabilidade'),
  impacto: nota('o impacto'),
  acao: textoOpcional(1000),
  responsavel: textoOpcional(120),
  prazo: opcional(data('o prazo')),
};
export const novoRoSchema = z.object(camposRo).superRefine(exigeTratamento);
export type NovoRo = z.input<typeof novoRoSchema>;
export const atualizarRoSchema = z
  .object({ ...camposRo, versao })
  .superRefine(exigeTratamento);
export const encerrarRoSchema = z.object({
  versao,
  resultado: texto('o resultado do tratamento', 500, 5),
});
export const filtroRosSchema = z.object({
  tipo: enumOpcional(TIPOS_RO, 'Tipo desconhecido.'),
  classe: enumOpcional(CLASSES_RO, 'Classe desconhecida.'),
  situacao: z.enum(['abertos', 'encerrados', 'todos']).default('abertos'),
});

export interface RiscoOuOportunidade {
  id: string;
  tipo: TipoRo;
  processo: string;
  descricao: string;
  contexto: string | null;
  probabilidade: number;
  impacto: number;
  classe: ClasseRo;
  acao: string | null;
  responsavel: string | null;
  prazo: string | null;
  prazoVencido: boolean;
  /** Encerrado com o resultado do tratamento. */
  resultado: string | null;
  encerradoEm: string | null;
  versao: string;
}

// ---------------------------------------------------------------- objetivos (6.2)

export const SENTIDOS_META = {
  maior: 'Quanto maior, melhor',
  menor: 'Quanto menor, melhor',
} as const;
export type SentidoMeta = keyof typeof SENTIDOS_META;

const numero = (rotulo: string) =>
  z.preprocess(
    (v) =>
      typeof v === 'string' ? v.trim().replace(/\./g, '').replace(',', '.') : v,
    z.coerce
      .number({ error: `Informe ${rotulo}.` })
      .refine(Number.isFinite, `Informe ${rotulo}.`),
  );
const camposObjetivo = {
  nome: texto('o objetivo', 200, 5),
  indicador: texto('o indicador', 150, 3),
  unidade: texto('a unidade', 20, 1),
  meta: numero('a meta'),
  sentido: z.enum(chaves(SENTIDOS_META), {
    error: 'Escolha o sentido da meta.',
  }),
  responsavel: texto('o responsável', 120, 3),
};
export const novoObjetivoSchema = z.object(camposObjetivo);
export type NovoObjetivo = z.input<typeof novoObjetivoSchema>;
export const atualizarObjetivoSchema = z.object({ ...camposObjetivo, versao });
export const situacaoDoObjetivoSchema = z.object({
  versao,
  ativo: z.boolean(),
});
/** Uma medição por competência; lançar de novo a mesma competência corrige o valor. */
export const registrarMedicaoSchema = z.object({
  competencia: z
    .string({ error: 'Informe o mês.' })
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Informe o mês (AAAA-MM).'),
  valor: numero('o valor medido'),
  analise: textoOpcional(500),
});

export interface Medicao {
  competencia: string;
  valor: number;
  atingiu: boolean;
  analise: string | null;
}
export interface Objetivo {
  id: string;
  nome: string;
  indicador: string;
  unidade: string;
  meta: number;
  sentido: SentidoMeta;
  responsavel: string;
  ativo: boolean;
  /** Mais recentes primeiro. */
  medicoes: Medicao[];
  versao: string;
}

// ---------------------------------------------------------------- análise crítica (9.3)

export const ENTRADAS_ANALISE_CRITICA = [
  'Situação das ações de análises anteriores',
  'Mudanças em questões externas e internas',
  'Satisfação do cliente e retorno das partes interessadas',
  'Atendimento aos objetivos da qualidade',
  'Desempenho de processos e conformidade de produtos e serviços',
  'Não conformidades e ações corretivas',
  'Resultados de monitoramento e medição',
  'Resultados de auditorias',
  'Desempenho de provedores externos',
  'Suficiência de recursos',
  'Eficácia das ações sobre riscos e oportunidades',
  'Oportunidades de melhoria',
] as const;

export const novaAnaliseCriticaSchema = z.object({
  data: data('a data da reunião'),
  participantes: texto('os participantes', 500, 3),
  entradas: texto('o que foi analisado (entradas)', 6000, 20),
  decisoes: texto('as decisões e ações (saídas)', 4000, 10),
  proximaAnalise: data('a data da próxima análise'),
});
export type NovaAnaliseCritica = z.input<typeof novaAnaliseCriticaSchema>;

export interface AnaliseCritica {
  id: string;
  data: string;
  participantes: string;
  entradas: string;
  decisoes: string;
  proximaAnalise: string;
}

// ---------------------------------------------------------------- mudanças (6.3)

export const STATUS_MUDANCA = {
  proposta: 'Proposta',
  aprovada: 'Aprovada',
  implementada: 'Implementada',
  rejeitada: 'Rejeitada',
} as const;
export type StatusMudanca = keyof typeof STATUS_MUDANCA;

export const novaMudancaSchema = z.object({
  titulo: texto('o título', 150, 5),
  descricao: texto('o que muda', 1000, 10),
  motivo: texto('o motivo', 500, 5),
  impactos: texto(
    'os impactos e riscos (pessoas, processos, recursos, SST, meio ambiente)',
    1000,
    10,
  ),
  responsavel: texto('o responsável', 120, 3),
  dataPrevista: data('a data prevista'),
});
export type NovaMudanca = z.input<typeof novaMudancaSchema>;
export const decidirMudancaSchema = z.object({
  versao,
  aprovar: z.boolean({ error: 'Informe a decisão.' }),
  parecer: texto('o parecer', 500, 5),
});
export const implementarMudancaSchema = z.object({
  versao,
  verificacao: texto('como foi verificado que a mudança funcionou', 500, 10),
});
export const filtroMudancasSchema = z.object({
  status: enumOpcional(STATUS_MUDANCA, 'Status desconhecido.'),
});

export interface Mudanca {
  id: string;
  numero: string;
  titulo: string;
  descricao: string;
  motivo: string;
  impactos: string;
  responsavel: string;
  dataPrevista: string;
  status: StatusMudanca;
  parecer: string | null;
  decididaEm: string | null;
  verificacao: string | null;
  implementadaEm: string | null;
  propostaPorMim: boolean;
  versao: string;
}

export interface ResumoSgi {
  rosAltosAbertos: number;
  rosComPrazoVencido: number;
  objetivosFora: number;
  /** Objetivos ativos com ao menos uma medição (base do percentual na meta). */
  objetivosMedidos: number;
  objetivosSemMedicao: number;
  ultimaAnaliseCritica: string | null;
  proximaAnaliseCritica: string | null;
  analiseCriticaAtrasada: boolean;
  mudancasAguardandoDecisao: number;
}
