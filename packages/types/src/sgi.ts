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
  controlesExistentes: textoOpcional(1000),
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
  controlesExistentes: string | null;
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

// ---------------------------------------------------------------- inovação (gestão de ideias de melhoria)

export const STATUS_MUDANCA = {
  proposta: 'Proposta',
  aprovada: 'Aprovada',
  implementada: 'Implementada',
  rejeitada: 'Rejeitada',
} as const;
export type StatusMudanca = keyof typeof STATUS_MUDANCA;

/** Natureza da inovação proposta. */
export const TIPOS_INOVACAO = {
  processo: 'Processo',
  produto: 'Produto ou serviço',
  tecnologia: 'Tecnologia',
  modelo_negocio: 'Modelo de negócio',
  sustentabilidade: 'Sustentabilidade e ESG',
  gestao: 'Gestão e pessoas',
} as const;
export type TipoInovacao = keyof typeof TIPOS_INOVACAO;

export const novaMudancaSchema = z.object({
  titulo: texto('o título', 150, 5),
  tipoInovacao: z.enum(chaves(TIPOS_INOVACAO), {
    error: 'Escolha o tipo de inovação.',
  }),
  descricao: texto('a proposta de inovação', 1000, 10),
  motivo: texto('a oportunidade ou motivação', 500, 5),
  ganhoEsperado: texto('o ganho esperado', 500, 5),
  impactos: texto(
    'os impactos e recursos necessários (pessoas, processos, recursos, SST, meio ambiente)',
    1000,
    10,
  ),
  responsavel: texto('o responsável', 120, 3),
  dataPrevista: data('a previsão de implementação'),
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
  tipoInovacao: TipoInovacao;
  descricao: string;
  motivo: string;
  ganhoEsperado: string;
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

// ---------------------------------------------------------------- documentos (controle de documentos, 7.5)

export const TIPOS_DOCUMENTO = {
  politica: 'Política',
  manual: 'Manual',
  procedimento: 'Procedimento',
  instrucao: 'Instrução de trabalho',
  formulario: 'Formulário',
  norma_externa: 'Norma externa',
} as const;
export type TipoDocumento = keyof typeof TIPOS_DOCUMENTO;

export const STATUS_DOCUMENTO = {
  rascunho: 'Rascunho',
  em_revisao: 'Em revisão',
  vigente: 'Vigente',
  obsoleto: 'Obsoleto',
} as const;
export type StatusDocumento = keyof typeof STATUS_DOCUMENTO;

const camposDocumento = {
  codigo: texto('o código', 30, 2),
  titulo: texto('o título', 150, 3),
  tipo: z.enum(chaves(TIPOS_DOCUMENTO), { error: 'Escolha o tipo.' }),
  area: textoOpcional(120),
  elaboradoPor: texto('o elaborador', 120, 3),
};
export const novoDocumentoSchema = z.object(camposDocumento);
export type NovoDocumento = z.input<typeof novoDocumentoSchema>;
export const atualizarDocumentoSchema = z.object({ ...camposDocumento, versao });
export const enviarRevisaoDocumentoSchema = z.object({ versao });
export const aprovarDocumentoSchema = z.object({
  versao,
  dataVigencia: data('a data de vigência'),
  proximaRevisao: opcional(data('a próxima revisão')),
});
export const novaRevisaoDocumentoSchema = z.object({
  versao,
  oQueMudou: texto('o que muda nesta revisão', 500, 5),
});
export const obsoletarDocumentoSchema = z.object({
  versao,
  motivo: texto('o motivo', 500, 5),
});
export const filtroDocumentosSchema = z.object({
  tipo: enumOpcional(TIPOS_DOCUMENTO, 'Tipo desconhecido.'),
  status: enumOpcional(STATUS_DOCUMENTO, 'Status desconhecido.'),
});

export interface RevisaoDoDocumento {
  revisao: number;
  oQueMudou: string;
  elaboradoPor: string;
  aprovadoPorNome: string | null;
  aprovadoEm: string;
  dataVigencia: string | null;
  proximaRevisao: string | null;
}
export interface Documento {
  id: string;
  codigo: string;
  titulo: string;
  tipo: TipoDocumento;
  area: string | null;
  elaboradoPor: string;
  status: StatusDocumento;
  revisaoAtual: number;
  oQueMudouPendente: string | null;
  aprovadoPorNome: string | null;
  aprovadoEm: string | null;
  dataVigencia: string | null;
  proximaRevisao: string | null;
  motivoObsolescencia: string | null;
  /** Vigente com a próxima revisão vencida. */
  revisaoVencida: boolean;
  /** Quem criou o documento não aprova a própria revisão (segregação). */
  criadoPorMim: boolean;
  versao: string;
}
export interface DocumentoComRevisoes extends Documento {
  /** Mais recentes primeiro. */
  revisoes: RevisaoDoDocumento[];
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
