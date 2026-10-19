/**
 * Auditorias e constatações (serviço auditorias): contratos e regras de validação. docs/05-modulos/auditorias.md
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

export const TIPOS_AUDITORIA = {
  interna: 'Interna',
  certificacao: 'Externa de certificação',
  fornecedor: 'De fornecedor',
} as const;
export type TipoAuditoria = keyof typeof TIPOS_AUDITORIA;

/**
 * Referenciais auditados. As edições 2026 da 9001 e da 14001 são as vigentes; as de 2015 ficam em transição
 * (até 30/09/2029 e 30/04/2029). Cada auditoria usa uma edição só por referencial.
 */
export const NORMAS = {
  iso9001_2026: 'ISO 9001:2026',
  iso9001: 'ISO 9001:2015',
  iso14001_2026: 'ISO 14001:2026',
  iso14001: 'ISO 14001:2015',
  iso45001: 'ISO 45001:2018',
  iso27001: 'ISO/IEC 27001:2022',
  iso28000: 'ISO 28000:2022',
  iso31000: 'ISO 31000:2018',
  iatf16949: 'IATF 16949:2016',
  sgi: 'SGI integrado',
} as const;
export type Norma = keyof typeof NORMAS;

export const STATUS_AUDITORIA = {
  planejada: 'Planejada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
} as const;
export type StatusAuditoria = keyof typeof STATUS_AUDITORIA;

export const TIPOS_CONSTATACAO = {
  conformidade: 'Conformidade',
  nc_maior: 'NC maior',
  nc_menor: 'NC menor',
  observacao: 'Observação',
  oportunidade: 'Oportunidade de melhoria',
} as const;
export type TipoConstatacao = keyof typeof TIPOS_CONSTATACAO;
export const ehConstatacaoDeNc = (t: TipoConstatacao) =>
  t === 'nc_maior' || t === 'nc_menor';

/** Tipos de desvio do banco de NCs (repetido em TIPOS_DE_DESVIO abaixo, com o mesmo conteúdo). */
const TIPOS_DE_DESVIO_BASE = {
  execucao: 'Execução',
  documentacao: 'Documentação',
  registro: 'Registro',
  comunicacao: 'Comunicação',
  competencia: 'Competência',
  recursos: 'Recursos',
} as const;

/** Prazo padrão da NC formalizada a partir de uma constatação. */
export const DIAS_DE_PRAZO_DA_NC_DE_AUDITORIA = 30;

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);

const camposDaAuditoria = {
  tipo: z.enum(chaves(TIPOS_AUDITORIA), { error: 'Escolha o tipo.' }),
  escopo: texto('o escopo', 1000, 10),
  normas: z
    .array(z.enum(chaves(NORMAS), { error: 'Norma desconhecida.' }))
    .min(1, 'Escolha ao menos uma norma.')
    .max(10)
    .transform((n) => [...new Set(n)])
    .refine(
      (n) =>
        !(n.includes('iso9001') && n.includes('iso9001_2026')) &&
        !(n.includes('iso14001') && n.includes('iso14001_2026')),
      'Escolha uma edição só por norma (2015 ou 2026).',
    ),
  areas: textoOpcional(300),
  auditorLider: texto('o auditor líder', 120, 3),
  equipe: textoOpcional(300),
  representante: textoOpcional(120),
  dataInicio: data('a data de início'),
  dataFim: data('a data de fim'),
};
const fimDepoisDoInicio = (d: { dataInicio: string; dataFim: string }) =>
  d.dataFim >= d.dataInicio;
const ERRO_DATAS = {
  path: ['dataFim'],
  message: 'A data de fim não pode ser anterior à de início.',
};

export const novaAuditoriaSchema = z
  .object(camposDaAuditoria)
  .refine(fimDepoisDoInicio, ERRO_DATAS);
export type NovaAuditoria = z.input<typeof novaAuditoriaSchema>;
export const atualizarAuditoriaSchema = z
  .object({ ...camposDaAuditoria, versao })
  .refine(fimDepoisDoInicio, ERRO_DATAS);
export const iniciarAuditoriaSchema = z.object({ versao });
export const concluirAuditoriaSchema = z.object({
  versao,
  conclusao: texto('a conclusão da auditoria', 4000, 20),
});
export const cancelarAuditoriaSchema = z.object({
  versao,
  motivo: texto('o motivo do cancelamento', 500, 10),
});

export const constatacaoSchema = z.object({
  tipo: z.enum(chaves(TIPOS_CONSTATACAO), {
    error: 'Escolha o tipo da constatação.',
  }),
  norma: z.enum(chaves(NORMAS), { error: 'Escolha a norma.' }),
  clausula: opcional(
    z
      .string()
      .trim()
      .max(20, 'Use no máximo 20 caracteres.')
      .regex(
        /^[0-9A-Za-z.]+$/,
        'Informe a cláusula como na norma (ex.: 8.5.1).',
      ),
  ),
  area: textoOpcional(120),
  descricao: texto('a constatação', 2000, 10),
  evidencia: textoOpcional(2000),
  /** Pergunta do roteiro que originou o achado (cadeia de rastreabilidade). */
  perguntaCodigo: textoOpcional(40),
  /** Modelo do banco de NCs usado na redação. */
  modeloCodigo: textoOpcional(40),
  tipoDesvio: enumOpcional(
    TIPOS_DE_DESVIO_BASE,
    'Tipo de desvio desconhecido.',
  ),
  causaRaiz: textoOpcional(500),
  acaoCorretiva: textoOpcional(500),
  evidenciaFechamento: textoOpcional(500),
});
export type NovaConstatacao = z.input<typeof constatacaoSchema>;

export const registrarConstatacaoSchema = z.object({
  versao,
  constatacao: constatacaoSchema,
});
export const alterarConstatacaoSchema = z.object({
  versao,
  constatacaoId: z.uuid('Constatação inválida.'),
  constatacao: constatacaoSchema,
});

/** Constatação de NC → NC no serviço qualidade. Responsável e prazo podem ser ajustados; prazo padrão de 30 dias. */
export const formalizarNcSchema = z.object({
  versao,
  constatacaoId: z.uuid('Constatação inválida.'),
  responsavel: texto('o responsável pela NC', 120, 3),
  prazo: opcional(data('o prazo')),
});

export const filtroAuditoriasSchema = z.object({
  busca: opcional(z.string().trim().max(100, 'Use no máximo 100 caracteres.')),
  status: enumOpcional(STATUS_AUDITORIA, 'Status desconhecido.'),
  tipo: enumOpcional(TIPOS_AUDITORIA, 'Tipo desconhecido.'),
  ordenar: z
    .enum(['numero', 'auditorLider', 'dataInicio', 'status'])
    .optional(),
  ordem: z.enum(['asc', 'desc']).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce
    .number()
    .int()
    .refine(
      (v) => v === 25 || v === 50 || v === 100,
      'Use 25, 50 ou 100 por página.',
    )
    .default(25),
});

export interface Constatacao {
  id: string;
  ordem: number;
  tipo: TipoConstatacao;
  norma: Norma;
  clausula: string | null;
  area: string | null;
  descricao: string;
  evidencia: string | null;
  perguntaCodigo: string | null;
  modeloCodigo: string | null;
  tipoDesvio: TipoDeDesvio | null;
  causaRaiz: string | null;
  acaoCorretiva: string | null;
  evidenciaFechamento: string | null;
  /** Preenchidos quando a constatação vira NC no serviço qualidade. */
  ncId: string | null;
  ncNumero: string | null;
}

export interface Auditoria {
  id: string;
  numero: string;
  tipo: TipoAuditoria;
  escopo: string;
  normas: Norma[];
  areas: string | null;
  auditorLider: string;
  equipe: string | null;
  representante: string | null;
  dataInicio: string;
  dataFim: string;
  status: StatusAuditoria;
  conclusao: string | null;
  motivoCancelamento: string | null;
  plano: PlanoDaAuditoria;
  constatacoes: Constatacao[];
  /** Quantas constatações de cada tipo. */
  contagem: Record<TipoConstatacao, number>;
  /** NCs (maior e menor) ainda sem NC formalizada: impedem concluir. */
  ncsPendentes: number;
  concluidaEm: string | null;
  versao: string;
}

export type AuditoriaResumo = Pick<
  Auditoria,
  | 'id'
  | 'numero'
  | 'tipo'
  | 'escopo'
  | 'normas'
  | 'auditorLider'
  | 'dataInicio'
  | 'dataFim'
  | 'status'
  | 'ncsPendentes'
> & {
  constatacoesDeNc: number;
};

export interface ResumoAuditorias {
  planejadas: number;
  emAndamento: number;
  /** Constatações de NC em auditorias concluídas nos últimos 12 meses. */
  ncsUltimos12Meses: number;
}

// ---------------------------------------------------------------- jornada e kit pré-auditoria

/** Jornada da auditoria em 5 etapas (material de referência do AuditExpert, docs/06-referencias/auditexpert.md). */
export const ETAPAS_DA_AUDITORIA = {
  planejar: 'Planejar',
  auditar: 'Auditar',
  registrar: 'Registrar',
  tratar: 'Tratar',
  entregar: 'Entregar',
} as const;
export type EtapaDaAuditoria = keyof typeof ETAPAS_DA_AUDITORIA;

/** Quando cada item do kit deve estar pronto, em dias antes do início da auditoria. */
export const MOMENTOS_DO_KIT = {
  d90: { rotulo: '90 dias antes', dias: 90 },
  d30: { rotulo: '30 dias antes', dias: 30 },
  d15: { rotulo: '15 dias antes', dias: 15 },
  d7: { rotulo: '1 semana antes', dias: 7 },
  d0: { rotulo: 'Dia da auditoria', dias: 0 },
} as const;
export type MomentoDoKit = keyof typeof MOMENTOS_DO_KIT;

export const STATUS_DO_ITEM_DO_KIT = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
} as const;
export type StatusDoItemDoKit = keyof typeof STATUS_DO_ITEM_DO_KIT;

export const marcarItemDoKitSchema = z.object({
  codigo: texto('o item', 10, 2),
  status: z.enum(chaves(STATUS_DO_ITEM_DO_KIT), { error: 'Escolha o status.' }),
});

export interface ItemDoKit {
  codigo: string;
  momento: MomentoDoKit;
  descricao: string;
  responsavel: string;
  /** Tela do sistema onde está o que o item pede. */
  atalho: { rotulo: string; href: string } | null;
  status: StatusDoItemDoKit;
  /** Data limite: início da auditoria menos os dias do momento. */
  prazo: string;
  atrasado: boolean;
}

export interface KitPreAuditoria {
  auditoriaId: string;
  itens: ItemDoKit[];
  concluidos: number;
  total: number;
  /** Concluídos ÷ total, em % inteiro. */
  prontidao: number;
  /** Auditoria concluída ou cancelada: o kit só pode ser lido. */
  somenteLeitura: boolean;
}

// ---------------------------------------------------------------- roteiros de entrevista e execução

/** Os 18 processos dos roteiros de entrevista (material de referência, com os da IATF). */
export const PROCESSOS_AUDITADOS = {
  alta_direcao: 'Alta Direção',
  comercial: 'Comercial',
  projeto: 'Projeto e Desenvolvimento',
  compras: 'Compras',
  producao: 'Produção',
  qualidade: 'Qualidade',
  manutencao: 'Manutenção',
  logistica: 'Logística',
  rh: 'RH',
  meio_ambiente: 'Meio Ambiente',
  sso: 'SSO',
  assistencia_tecnica: 'Assistência Técnica',
  ti: 'TI e Segurança da Informação',
  terceiros: 'Contratadas e Terceiros',
  gestao_fornecedores: 'Gestão de Fornecedores',
  metrologia: 'Metrologia e Laboratório',
  inspecao_ensaios: 'Inspeção e Ensaios',
  planejamento_qualidade: 'Planejamento da Qualidade',
} as const;
export type ProcessoAuditado = keyof typeof PROCESSOS_AUDITADOS;

/** Resposta de cada pergunta na execução da auditoria. */
export const RESPOSTAS_DA_PERGUNTA = {
  pendente: 'Pendente',
  conforme: 'Conforme',
  parcial: 'Parcial',
  nao_conforme: 'Não conforme',
} as const;
export type RespostaDaPergunta = keyof typeof RESPOSTAS_DA_PERGUNTA;

export interface PerguntaDeRoteiro {
  /** Código do banco (ex.: P-COM-01) ou id da pergunta própria. */
  codigo: string;
  origem: 'banco' | 'propria';
  processo: ProcessoAuditado;
  norma: Norma;
  clausula: string;
  pergunta: string;
  /** O que a pergunta quer verificar. */
  objetivo: string | null;
  /** O que caracteriza conformidade. */
  respostaEsperada: string;
  /** Resposta que indica desvio e pede aprofundamento. */
  sinalDeAlerta: string;
}

export const filtroPerguntasSchema = z.object({
  pack: textoOpcional(30),
  processo: enumOpcional(PROCESSOS_AUDITADOS, 'Processo desconhecido.'),
  norma: enumOpcional(NORMAS, 'Norma desconhecida.'),
  clausula: textoOpcional(20),
  busca: textoOpcional(100),
});

const camposDaPerguntaPropria = {
  objetivo: textoOpcional(300),
  processo: z.enum(chaves(PROCESSOS_AUDITADOS), {
    error: 'Escolha o processo.',
  }),
  norma: z.enum(chaves(NORMAS), { error: 'Escolha a norma.' }),
  clausula: texto('a cláusula (ex.: 8.4.1)', 20, 1),
  pergunta: texto('a pergunta', 300, 10),
  respostaEsperada: texto('a resposta esperada', 500, 5),
  sinalDeAlerta: texto('o sinal de alerta', 500, 5),
};
export const novaPerguntaPropriaSchema = z.object(camposDaPerguntaPropria);
export type NovaPerguntaPropria = z.input<typeof novaPerguntaPropriaSchema>;

/** Incluir ou tirar perguntas do roteiro da auditoria. */
export const selecionarPerguntasSchema = z.object({
  incluir: z.array(z.string().min(2).max(40)).max(200).default([]),
  retirar: z.array(z.string().min(2).max(40)).max(200).default([]),
});

/** Resposta na execução: Parcial e Não conforme pedem a evidência que mostra o desvio. */
export const responderPerguntaSchema = z
  .object({
    codigo: texto('a pergunta', 40, 2),
    resposta: z.enum(chaves(RESPOSTAS_DA_PERGUNTA), {
      error: 'Escolha a resposta.',
    }),
    evidencia: textoOpcional(1000),
  })
  .refine((r) => r.resposta === 'pendente' || r.evidencia, {
    path: ['evidencia'],
    message:
      'Registre a evidência objetiva verificada (documento, número, data).',
  });

export interface PerguntaDaAuditoria extends PerguntaDeRoteiro {
  ordem: number;
  resposta: RespostaDaPergunta;
  evidencia: string | null;
  respondidaEm: string | null;
}

export interface RoteiroDaAuditoria {
  auditoriaId: string;
  perguntas: PerguntaDaAuditoria[];
  contagem: Record<RespostaDaPergunta, number>;
  /** Auditoria concluída ou cancelada. */
  somenteLeitura: boolean;
}

// ---------------------------------------------------------------- biblioteca de evidências

export const TIPOS_DE_EVIDENCIA = {
  documento: 'Documento',
  registro: 'Registro',
  entrevista: 'Entrevista',
  observacao: 'Observação in loco',
} as const;
export type TipoDeEvidencia = keyof typeof TIPOS_DE_EVIDENCIA;

/** Impacto provável se a evidência não existir: ajuda a priorizar o que investigar. */
export const RISCOS_DA_EVIDENCIA = {
  alto: 'Risco alto',
  medio: 'Risco médio',
  baixo: 'Risco baixo',
} as const;
export type RiscoDaEvidencia = keyof typeof RISCOS_DA_EVIDENCIA;

/** Temas do Anexo A da ISO 27001:2022 (93 controles). */
export const TEMAS_DO_ANEXO_A = {
  organizacional: 'Controles organizacionais',
  pessoas: 'Controles de pessoas',
  fisico: 'Controles físicos',
  tecnologico: 'Controles tecnológicos',
} as const;
export type TemaDoAnexoA = keyof typeof TEMAS_DO_ANEXO_A;

export interface EvidenciaDaBiblioteca {
  /** Código do banco (ex.: E-9001-8.4.1-1) ou id da evidência própria. */
  codigo: string;
  origem: 'banco' | 'propria';
  norma: Norma;
  clausula: string;
  titulo: string;
  tipo: TipoDeEvidencia;
  risco: RiscoDaEvidencia;
  /** O que pedir ao auditado. */
  oQuePedir: string;
  /** Como é uma evidência aceitável. */
  exemplo: string;
  /** Só ISO 27001: controle do Anexo A (ex.: A.5.15) e o tema dele. */
  controle?: string;
  tema?: TemaDoAnexoA;
}

export const filtroEvidenciasSchema = z.object({
  pack: textoOpcional(30),
  norma: enumOpcional(NORMAS, 'Norma desconhecida.'),
  /** Capítulo (4 a 10), cláusula exata (8.4.1) ou "A" para o Anexo A. */
  clausula: textoOpcional(20),
  tema: enumOpcional(TEMAS_DO_ANEXO_A, 'Tema desconhecido.'),
  controle: textoOpcional(10),
  busca: textoOpcional(100),
});

export const novaEvidenciaPropriaSchema = z.object({
  norma: z.enum(chaves(NORMAS), { error: 'Escolha a norma.' }),
  clausula: texto('a cláusula (ex.: 8.4.1)', 20, 1),
  titulo: texto('o título', 150, 3),
  tipo: z.enum(chaves(TIPOS_DE_EVIDENCIA), { error: 'Escolha o tipo.' }),
  risco: z.enum(chaves(RISCOS_DA_EVIDENCIA), { error: 'Escolha o risco.' }),
  oQuePedir: texto('o que pedir', 500, 5),
  exemplo: texto('um exemplo de evidência aceitável', 500, 5),
});
export type NovaEvidenciaPropria = z.input<typeof novaEvidenciaPropriaSchema>;

// ---------------------------------------------------------------- banco de NCs, prompts e packs

export const TIPOS_DE_DESVIO = TIPOS_DE_DESVIO_BASE;
export type TipoDeDesvio = keyof typeof TIPOS_DE_DESVIO;

/** Modelo de redação de NC com causa raiz comum, ação corretiva e evidência de fechamento. */
export interface ModeloDeNc {
  codigo: string;
  origem: 'banco' | 'propria';
  norma: Norma;
  clausula: string;
  tipo: TipoDeDesvio;
  titulo: string;
  descricao: string;
  causaRaiz: string;
  acaoCorretiva: string;
  evidenciaFechamento: string;
  controle?: string;
}

export const filtroModelosNcSchema = z.object({
  norma: enumOpcional(NORMAS, 'Norma desconhecida.'),
  clausula: textoOpcional(20),
  tipo: enumOpcional(TIPOS_DE_DESVIO, 'Tipo de desvio desconhecido.'),
  controle: textoOpcional(10),
  pack: textoOpcional(30),
  busca: textoOpcional(100),
});

export const novoModeloNcSchema = z.object({
  norma: z.enum(chaves(NORMAS), { error: 'Escolha a norma.' }),
  clausula: texto('a cláusula', 20, 1),
  tipo: z.enum(chaves(TIPOS_DE_DESVIO), { error: 'Escolha o tipo de desvio.' }),
  titulo: texto('o título do desvio', 150, 3),
  descricao: texto('a redação da NC', 1000, 10),
  causaRaiz: texto('a causa raiz comum', 500, 5),
  acaoCorretiva: texto('a ação corretiva', 500, 5),
  evidenciaFechamento: texto('a evidência de fechamento', 500, 5),
});

/** Prompt pronto para ferramentas de IA, por norma, cláusula e categoria. */
export interface PromptDeIa {
  codigo: string;
  norma: Norma;
  clausula: string;
  categoria: string;
  titulo: string;
  objetivo: string;
  prompt: string;
  dica: string;
  processo: ProcessoAuditado | null;
  tipoEvidencia: TipoDeEvidencia | null;
}

export const filtroPromptsSchema = z.object({
  norma: enumOpcional(NORMAS, 'Norma desconhecida.'),
  categoria: textoOpcional(60),
  processo: enumOpcional(PROCESSOS_AUDITADOS, 'Processo desconhecido.'),
  busca: textoOpcional(100),
});

/** Packs Anti-NC: cláusulas onde mais se emitem não conformidades, por norma (filtro rápido). */
export const PACKS_ANTI_NC = {
  iatf_anti_major: {
    nome: 'IATF Anti-Major',
    descricao:
      'Cláusulas onde mais se emitem não conformidades maiores em auditoria IATF.',
    norma: 'iatf16949',
    clausulas: [
      '10.2.3',
      '10.2.1',
      '6.1.2.3',
      '4.3.2',
      '8.5.1.1',
      '8.5.1.5',
      '7.1.5.1.1',
      '8.4',
      '9.2',
    ],
  },
  iso9001_anti_nc: {
    nome: 'ISO 9001 Anti-NC',
    descricao:
      'Contexto, riscos, objetivos, competência, fornecedores, desempenho e ação corretiva.',
    norma: 'iso9001',
    clausulas: ['4.1', '4.2', '6.1', '6.2', '7.2', '8.4', '9.1', '10.2'],
  },
  iso14001_anti_nc: {
    nome: 'ISO 14001 Anti-NC',
    descricao:
      'Aspectos e impactos, requisitos legais e preparação para emergências.',
    norma: 'iso14001',
    clausulas: ['6.1.2', '6.1.3', '8.2', '9.1.2', '10.2'],
  },
  iso45001_anti_nc: {
    nome: 'ISO 45001 Anti-NC',
    descricao:
      'Perigos e riscos, participação dos trabalhadores e investigação de incidentes.',
    norma: 'iso45001',
    clausulas: ['6.1.2', '5.4', '10.2', '8.2', '9.1.2'],
  },
} as const satisfies Record<
  string,
  {
    nome: string;
    descricao: string;
    norma: Norma;
    clausulas: readonly string[];
  }
>;
export type PackAntiNc = keyof typeof PACKS_ANTI_NC;

/** O pack vale para a norma dele e para a outra edição da mesma norma (9001:2015 e 2026, 14001:2015 e 2026). */
export function noPack(
  pack: PackAntiNc,
  norma: Norma,
  clausula: string,
): boolean {
  const p = PACKS_ANTI_NC[pack];
  const familia = (n: string) => n.replace('_2026', '');
  return (
    familia(norma) === familia(p.norma) &&
    p.clausulas.some((c) => clausula === c || clausula.startsWith(`${c}.`))
  );
}

// ---------------------------------------------------------------- plano, relatório e log do auditor

export const PAPEIS_DO_AUDITOR = {
  lider: 'Auditor líder',
  auditor: 'Auditor',
  treinamento: 'Auditor em treinamento',
  observador: 'Observador',
} as const;
export type PapelDoAuditor = keyof typeof PAPEIS_DO_AUDITOR;

/** Texto padrão da metodologia (ISO 19011), editável. */
export const METODOLOGIA_PADRAO =
  'Auditoria conduzida conforme ISO 19011, por amostragem, com análise documental, entrevistas com responsáveis pelos processos e verificação in loco de evidências objetivas.';

/** Critérios sugeridos a partir das normas; auditoria IATF inclui os requisitos do cliente e os manuais de referência. */
export function criteriosSugeridos(normas: Norma[]): string {
  const partes = [
    `Normas do sistema de gestão: ${normas.map((n) => NORMAS[n]).join(', ')}`,
    'documentação do sistema de gestão',
    'requisitos legais e contratuais aplicáveis',
  ];
  if (normas.includes('iatf16949'))
    partes.push(
      'requisitos específicos do cliente (CSR)',
      'manuais de referência aplicáveis (APQP, PPAP, FMEA, MSA, SPC)',
    );
  return `${partes.join('; ')}.`;
}

const linhaDoCronograma = z.object({
  horaInicio: z.string().trim().max(5).default(''),
  horaFim: z.string().trim().max(5).default(''),
  processo: z.string().trim().max(120).default(''),
  auditado: z.string().trim().max(120).default(''),
  local: z.string().trim().max(120).default(''),
});
const auditadoConvocado = z.object({
  nome: texto('o nome do auditado', 120, 2),
  funcao: z.string().trim().max(120).default(''),
  processo: z.string().trim().max(120).default(''),
});

/** Dados do plano e do relatório. Concluída a auditoria, só papel e horas mudam (para o Log do Auditor). */
export const planoDaAuditoriaSchema = z.object({
  versao,
  empresaAuditada: textoOpcional(150),
  unidade: textoOpcional(120),
  objetivo: textoOpcional(1000),
  metodologia: textoOpcional(1000),
  pontosFortes: textoOpcional(2000),
  processos: z
    .array(z.enum(chaves(PROCESSOS_AUDITADOS)))
    .max(30)
    .default([]),
  criterios: textoOpcional(1000),
  cronograma: z.array(linhaDoCronograma).max(60).default([]),
  auditados: z.array(auditadoConvocado).max(60).default([]),
  logistica: z
    .object({
      sala: z.string().trim().max(300).default(''),
      epi: z.string().trim().max(300).default(''),
      acompanhante: z.string().trim().max(150).default(''),
      observacoes: z.string().trim().max(600).default(''),
    })
    .default({ sala: '', epi: '', acompanhante: '', observacoes: '' }),
  emissor: textoOpcional(120),
  papel: z.enum(chaves(PAPEIS_DO_AUDITOR)).default('lider'),
  horas: opcional(
    z.coerce.number().min(0, 'Horas não podem ser negativas.').max(2000),
  ),
});

export interface PlanoDaAuditoria {
  empresaAuditada: string | null;
  unidade: string | null;
  objetivo: string | null;
  metodologia: string;
  pontosFortes: string | null;
  processos: ProcessoAuditado[];
  criterios: string | null;
  cronograma: {
    horaInicio: string;
    horaFim: string;
    processo: string;
    auditado: string;
    local: string;
  }[];
  auditados: { nome: string; funcao: string; processo: string }[];
  logistica: {
    sala: string;
    epi: string;
    acompanhante: string;
    observacoes: string;
  };
  emissor: string | null;
  papel: PapelDoAuditor;
  horas: number | null;
}

/** Log do auditor: auditorias em que a pessoa atuou (líder ou equipe), com horas, referenciais e processos. */
export const filtroLogDoAuditorSchema = z.object({
  auditor: texto('o nome do auditor', 120, 3),
});

export interface AuditoriaNoLog {
  id: string;
  numero: string;
  organizacao: string;
  dataInicio: string;
  dataFim: string;
  normas: Norma[];
  processos: ProcessoAuditado[];
  papel: PapelDoAuditor;
  horas: number | null;
  perguntasConduzidas: number;
  achados: number;
  status: StatusAuditoria;
}

export interface LogDoAuditor {
  auditor: string;
  auditorias: AuditoriaNoLog[];
  horas: number;
  referenciais: Norma[];
  processos: ProcessoAuditado[];
  perguntasConduzidas: number;
  achados: number;
}

// ---------------------------------------------------------------- critérios próprios (Minha biblioteca)

export const TIPOS_DE_CRITERIO = {
  legislacao: 'Legislação',
  norma_interna: 'Norma interna',
  requisito_contratual: 'Requisito contratual',
  requisito_cliente: 'Requisito do cliente',
} as const;
export type TipoDeCriterio = keyof typeof TIPOS_DE_CRITERIO;

/** Critério de auditoria além das normas ISO: lei, norma interna ou contrato, com os requisitos a verificar. */
export const novoCriterioSchema = z.object({
  tipo: z.enum(chaves(TIPOS_DE_CRITERIO), { error: 'Escolha o tipo.' }),
  nome: texto('o nome do critério', 150, 3),
  referencia: textoOpcional(150),
  requisitos: texto('os requisitos a verificar', 2000, 5),
});
export type NovoCriterio = z.input<typeof novoCriterioSchema>;

export interface CriterioProprio {
  id: string;
  tipo: TipoDeCriterio;
  nome: string;
  referencia: string | null;
  requisitos: string;
}
