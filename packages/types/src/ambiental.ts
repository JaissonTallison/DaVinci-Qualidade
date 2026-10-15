/**
 * Meio Ambiente (serviço ambiental), parte 1: aspectos e impactos (LAIA), requisitos legais, licenças com
 * condicionantes e resíduos com MTR/CDF. ISO 14001 6.1.2, 6.1.3, 9.1.2 e 8.1. docs/05-modulos/ambiental.md
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
const numero = (rotulo: string) =>
  z.preprocess(
    (v) =>
      typeof v === 'string' ? v.trim().replace(/\./g, '').replace(',', '.') : v,
    z.coerce
      .number({ error: `Informe ${rotulo}.` })
      .positive(`Informe ${rotulo} maior que zero.`),
  );

// ---------------------------------------------------------------- aspectos e impactos (LAIA)

export const SITUACOES_OPERACIONAIS = {
  normal: 'Normal',
  anormal: 'Anormal',
  emergencia: 'Emergência',
} as const;
export type SituacaoOperacional = keyof typeof SITUACOES_OPERACIONAIS;
export const INCIDENCIAS = {
  direta: 'Direta (sob controle)',
  indireta: 'Indireta (sob influência)',
} as const;
export type Incidencia = keyof typeof INCIDENCIAS;
export const SIGNIFICANCIAS = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
} as const;
export type Significancia = keyof typeof SIGNIFICANCIAS;

/**
 * Severidade × frequência (1 a 5): até 5 baixa, até 14 média, 15 ou mais alta.
 * Aspecto ligado a requisito legal é sempre significativo, qualquer que seja a nota.
 */
export function significanciaDoAspecto(
  severidade: number,
  frequencia: number,
): Significancia {
  const p = severidade * frequencia;
  return p <= 5 ? 'baixa' : p <= 14 ? 'media' : 'alta';
}
export function aspectoSignificativo(
  severidade: number,
  frequencia: number,
  requisitoLegal: boolean,
): boolean {
  return (
    requisitoLegal || significanciaDoAspecto(severidade, frequencia) === 'alta'
  );
}

type ComControle = {
  severidade: number;
  frequencia: number;
  requisitoLegal: boolean;
  acoes: string | null;
  responsavel: string | null;
  prazo: string | null;
};
const exigeControle = (a: ComControle, ctx: z.RefinementCtx) => {
  if (!aspectoSignificativo(a.severidade, a.frequencia, a.requisitoLegal))
    return;
  if (!a.acoes)
    ctx.addIssue({
      code: 'custom',
      path: ['acoes'],
      message: 'Aspecto significativo: informe as ações de controle.',
    });
  if (!a.responsavel)
    ctx.addIssue({
      code: 'custom',
      path: ['responsavel'],
      message: 'Aspecto significativo: informe o responsável.',
    });
  if (!a.prazo)
    ctx.addIssue({
      code: 'custom',
      path: ['prazo'],
      message: 'Aspecto significativo: informe o prazo.',
    });
};
const camposAspecto = {
  atividade: texto('a atividade ou processo', 150, 3),
  aspecto: texto('o aspecto (o que a atividade gera ou consome)', 200, 3),
  impacto: texto('o impacto no meio ambiente', 200, 3),
  situacao: z.enum(chaves(SITUACOES_OPERACIONAIS), {
    error: 'Escolha a situação.',
  }),
  incidencia: z.enum(chaves(INCIDENCIAS), { error: 'Escolha a incidência.' }),
  severidade: nota('a severidade'),
  frequencia: nota('a frequência'),
  requisitoLegal: z.boolean().default(false),
  controles: textoOpcional(1000),
  acoes: textoOpcional(1000),
  responsavel: textoOpcional(120),
  prazo: opcional(data('o prazo')),
};
export const novoAspectoSchema = z
  .object(camposAspecto)
  .superRefine(exigeControle);
export type NovoAspecto = z.input<typeof novoAspectoSchema>;
export const atualizarAspectoSchema = z
  .object({ ...camposAspecto, versao })
  .superRefine(exigeControle);
export const situacaoDoAspectoSchema = z.object({ versao, ativo: z.boolean() });
export const filtroAspectosSchema = z.object({
  significativos: z.enum(['sim', 'nao']).optional(),
  situacao: z.enum(['ativos', 'inativos', 'todos']).default('ativos'),
});

export interface AspectoAmbiental {
  id: string;
  atividade: string;
  aspecto: string;
  impacto: string;
  situacao: SituacaoOperacional;
  incidencia: Incidencia;
  severidade: number;
  frequencia: number;
  requisitoLegal: boolean;
  significancia: Significancia;
  significativo: boolean;
  controles: string | null;
  acoes: string | null;
  responsavel: string | null;
  prazo: string | null;
  prazoVencido: boolean;
  ativo: boolean;
  versao: string;
}

// ---------------------------------------------------------------- requisitos legais

export const ESFERAS = {
  federal: 'Federal',
  estadual: 'Estadual',
  municipal: 'Municipal',
  outros: 'Outros (norma técnica, acordo)',
} as const;
export type Esfera = keyof typeof ESFERAS;
export const ATENDIMENTOS = {
  atende: 'Atende',
  parcial: 'Atende em parte',
  nao_atende: 'Não atende',
  nao_avaliado: 'Não avaliado',
} as const;
export type Atendimento = keyof typeof ATENDIMENTOS;
/** Cada requisito é reavaliado ao menos uma vez por ano (ISO 14001, 9.1.2). */
export const MESES_ENTRE_AVALIACOES = 12;

const camposRequisito = {
  norma: texto(
    'a legislação ou norma (ex.: Resolução CONAMA 430/2011)',
    200,
    3,
  ),
  esfera: z.enum(chaves(ESFERAS), { error: 'Escolha a esfera.' }),
  tema: texto('o tema', 100, 2),
  requisito: texto('o que ela exige da empresa', 1000, 10),
};
export const novoRequisitoSchema = z.object(camposRequisito);
export type NovoRequisito = z.input<typeof novoRequisitoSchema>;
export const atualizarRequisitoSchema = z.object({
  ...camposRequisito,
  versao,
});
/** Avaliação de atendimento: o que foi verificado e quando. "Não atende" e "em parte" pedem a ação. */
export const avaliarRequisitoSchema = z
  .object({
    versao,
    data: data('a data da avaliação'),
    atendimento: z.enum(['atende', 'parcial', 'nao_atende'], {
      error: 'Escolha o resultado.',
    }),
    evidencia: texto('a evidência verificada', 500, 5),
    acao: textoOpcional(500),
  })
  .refine((a) => a.atendimento === 'atende' || a.acao, {
    path: ['acao'],
    message: 'Informe a ação para passar a atender.',
  });
export const filtroRequisitosSchema = z.object({
  atendimento: enumOpcional(ATENDIMENTOS, 'Atendimento desconhecido.'),
});

export interface RequisitoLegal {
  id: string;
  norma: string;
  esfera: Esfera;
  tema: string;
  requisito: string;
  atendimento: Atendimento;
  ultimaAvaliacao: string | null;
  proximaAvaliacao: string | null;
  avaliacaoVencida: boolean;
  evidencia: string | null;
  acao: string | null;
  versao: string;
}

// ---------------------------------------------------------------- licenças

export const TIPOS_LICENCA = {
  lp: 'Licença Prévia (LP)',
  li: 'Licença de Instalação (LI)',
  lo: 'Licença de Operação (LO)',
  outorga: 'Outorga de uso de água',
  avcb: 'AVCB (Corpo de Bombeiros)',
  cadastro: 'Cadastro técnico (CTF/IBAMA)',
  outra: 'Outra licença ou autorização',
} as const;
export type TipoLicenca = keyof typeof TIPOS_LICENCA;

/** A renovação é pedida 120 dias antes do vencimento (Resolução CONAMA 237/1997, art. 18 §4º). */
export const DIAS_PARA_RENOVAR = 120;

export const novaLicencaSchema = z
  .object({
    tipo: z.enum(chaves(TIPOS_LICENCA), { error: 'Escolha o tipo.' }),
    numero: texto('o número', 60, 1),
    orgao: texto('o órgão emissor', 120, 2),
    descricao: textoOpcional(300),
    emissao: data('a data de emissão'),
    validade: data('a validade'),
    diasParaRenovar: z.coerce
      .number()
      .int()
      .min(0)
      .max(365)
      .default(DIAS_PARA_RENOVAR),
  })
  .refine((l) => l.validade > l.emissao, {
    path: ['validade'],
    message: 'A validade vem depois da emissão.',
  });
export type NovaLicenca = z.input<typeof novaLicencaSchema>;
export const renovacaoSolicitadaSchema = z.object({
  versao,
  data: data('a data do protocolo'),
  protocolo: texto('o número do protocolo', 60, 1),
});
export const novaCondicionanteSchema = z.object({
  descricao: texto('a condicionante', 500, 5),
  prazo: opcional(data('o prazo')),
  periodicidadeMeses: opcional(z.coerce.number().int().min(1).max(60)),
});
export const cumprirCondicionanteSchema = z.object({
  data: data('a data do cumprimento'),
  evidencia: texto('a evidência', 300, 3),
});

export const SITUACOES_LICENCA = {
  vigente: 'Vigente',
  renovar: 'Pedir renovação',
  em_renovacao: 'Renovação protocolada',
  vencida: 'Vencida',
} as const;
export type SituacaoLicenca = keyof typeof SITUACOES_LICENCA;

export interface Condicionante {
  id: string;
  descricao: string;
  prazo: string | null;
  periodicidadeMeses: number | null;
  cumpridaEm: string | null;
  evidencia: string | null;
  vencida: boolean;
}

export interface Licenca {
  id: string;
  tipo: TipoLicenca;
  numero: string;
  orgao: string;
  descricao: string | null;
  emissao: string;
  validade: string;
  diasParaRenovar: number;
  /** Data limite para protocolar a renovação. */
  renovarAte: string;
  renovacaoProtocolo: string | null;
  renovacaoData: string | null;
  situacao: SituacaoLicenca;
  condicionantes: Condicionante[];
  versao: string;
}

// ---------------------------------------------------------------- resíduos e MTR

export const CLASSES_RESIDUO = {
  I: 'Classe I · Perigoso',
  IIA: 'Classe II A · Não inerte',
  IIB: 'Classe II B · Inerte',
} as const;
export type ClasseResiduo = keyof typeof CLASSES_RESIDUO;
export const UNIDADES_RESIDUO = {
  kg: 'kg',
  t: 't',
  L: 'L',
  m3: 'm³',
  un: 'unidades',
} as const;
export type UnidadeResiduo = keyof typeof UNIDADES_RESIDUO;
/** O Certificado de Destinação Final (CDF) chega em até 30 dias depois da saída; passou disso, cobrar. */
export const DIAS_PARA_CDF = 30;

const camposResiduo = {
  nome: texto('o nome do resíduo', 150, 3),
  classe: z.enum(chaves(CLASSES_RESIDUO), {
    error: 'Escolha a classe (NBR 10004).',
  }),
  origem: texto('onde é gerado', 150, 2),
  acondicionamento: texto('como é armazenado', 150, 2),
  destinacao: texto(
    'a destinação (reciclagem, coprocessamento, aterro...)',
    150,
    3,
  ),
  unidade: z.enum(chaves(UNIDADES_RESIDUO), { error: 'Escolha a unidade.' }),
};
export const novoResiduoSchema = z.object(camposResiduo);
export type NovoResiduo = z.input<typeof novoResiduoSchema>;
export const atualizarResiduoSchema = z.object({ ...camposResiduo, versao });

export const registrarSaidaSchema = z.object({
  residuoId: z.uuid('Escolha o resíduo.'),
  data: data('a data da saída'),
  quantidade: numero('a quantidade'),
  mtr: texto('o número do MTR', 40, 3),
  transportador: texto('o transportador', 150, 2),
  destinador: texto('o destinador', 150, 2),
});
export type RegistrarSaida = z.input<typeof registrarSaidaSchema>;
export const registrarCdfSchema = z.object({
  numero: texto('o número do CDF', 40, 2),
  data: data('a data do CDF'),
});
export const filtroSaidasSchema = z.object({
  residuoId: opcional(z.uuid()),
  semCdf: z.enum(['sim']).optional(),
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
});

export interface Residuo {
  id: string;
  nome: string;
  classe: ClasseResiduo;
  origem: string;
  acondicionamento: string;
  destinacao: string;
  unidade: UnidadeResiduo;
  /** Quantidade que saiu no ano corrente. */
  quantidadeNoAno: number;
  versao: string;
}

export interface SaidaDeResiduo {
  id: string;
  residuoId: string;
  residuoNome: string;
  classe: ClasseResiduo;
  data: string;
  quantidade: number;
  unidade: UnidadeResiduo;
  mtr: string;
  transportador: string;
  destinador: string;
  cdfNumero: string | null;
  cdfData: string | null;
  /** Mais de 30 dias sem CDF. */
  cdfAtrasado: boolean;
}

export interface ResumoAmbiental {
  /** Licenças cadastradas (base do "licenças em dia" no início). */
  licencas: number;
  aspectosSignificativos: number;
  acoesVencidas: number;
  requisitosNaoAtendidos: number;
  avaliacoesVencidas: number;
  licencasVencidas: number;
  licencasParaRenovar: number;
  condicionantesVencidas: number;
  cdfsAtrasados: number;
}
