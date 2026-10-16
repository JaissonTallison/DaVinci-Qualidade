/**
 * Meio Ambiente, gestão (serviço ambiental): ocorrências ambientais, obrigações legais com calendário,
 * destinadores e inventário de resíduos, produção e ecoeficiência, programas e metas. docs/05-modulos/ambiental.md
 */
import { z } from 'zod';
import { chaves, data, opcional, texto, textoOpcional } from './validadores.js';

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);
const competencia = z
  .string({ error: 'Informe o mês.' })
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Informe o mês como 2026-10.');
const valor = (rotulo: string) =>
  z.coerce
    .number({ error: `Informe ${rotulo}.` })
    .min(
      0,
      `${rotulo[0]!.toUpperCase()}${rotulo.slice(1)} não pode ser negativo.`,
    );

// ---------------------------------------------------------------- ocorrências ambientais

export const TIPOS_DE_OCORRENCIA = {
  vazamento: 'Vazamento',
  derramamento: 'Derramamento',
  emissao: 'Emissão atmosférica fora do padrão',
  incendio: 'Incêndio ou explosão',
  descarte_irregular: 'Descarte irregular',
  outro: 'Outro',
} as const;
export const MEIOS_AFETADOS = {
  solo: 'Solo',
  agua: 'Água (corpo hídrico ou rede)',
  ar: 'Ar',
  contido: 'Contido no local',
} as const;
export type MeioAfetado = keyof typeof MEIOS_AFETADOS;
export const SEVERIDADES_AMBIENTAIS = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
} as const;
export type SeveridadeAmbiental = keyof typeof SEVERIDADES_AMBIENTAIS;
/** Prazo para comunicar o órgão ambiental quando a comunicação é obrigatória. */
export const HORAS_PARA_COMUNICAR = 24;

/** Comunicação obrigatória: severidade alta ou crítica, ou atingiu a água. */
export const comunicacaoObrigatoria = (o: {
  severidade: SeveridadeAmbiental;
  meios: MeioAfetado[];
}) =>
  o.severidade === 'alta' ||
  o.severidade === 'critica' ||
  o.meios.includes('agua');

export const novaOcorrenciaSchema = z.object({
  tipo: z.enum(chaves(TIPOS_DE_OCORRENCIA), { error: 'Escolha o tipo.' }),
  data: data('a data'),
  hora: z
    .string({ error: 'Informe a hora.' })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Informe a hora como 14:30.'),
  local: texto('o local', 150, 2),
  substancia: texto('o que vazou ou foi emitido', 150, 2),
  quantidade: opcional(z.coerce.number().positive('Quantidade acima de zero.')),
  unidade: textoOpcional(10),
  meios: z
    .array(z.enum(chaves(MEIOS_AFETADOS)))
    .min(1, 'Marque o que foi atingido.')
    .max(4),
  severidade: z.enum(chaves(SEVERIDADES_AMBIENTAIS), {
    error: 'Escolha a severidade.',
  }),
  descricao: texto('o que aconteceu', 2000, 10),
  contencao: texto('a contenção feita', 2000, 5),
});
export type NovaOcorrencia = z.input<typeof novaOcorrenciaSchema>;
export const comunicarOcorrenciaSchema = z.object({
  versao,
  orgao: texto('o órgão comunicado', 120, 2),
  data: data('a data da comunicação'),
  protocolo: texto('o protocolo ou a forma de comunicação', 60, 2),
});
export const ncDaOcorrenciaSchema = z.object({
  versao,
  responsavel: texto('o responsável pela NC', 120, 3),
});
export const encerrarOcorrenciaSchema = z.object({
  versao,
  causas: texto('as causas', 2000, 10),
  acoes: texto('as ações para não se repetir', 2000, 10),
  remediacao: textoOpcional(2000),
});

export interface OcorrenciaAmbiental {
  id: string;
  numero: string;
  tipo: keyof typeof TIPOS_DE_OCORRENCIA;
  data: string;
  hora: string;
  local: string;
  substancia: string;
  quantidade: number | null;
  unidade: string | null;
  meios: MeioAfetado[];
  severidade: SeveridadeAmbiental;
  descricao: string;
  contencao: string;
  comunicacaoObrigatoria: boolean;
  /** Data limite (dia seguinte ao evento). */
  prazoComunicacao: string | null;
  comunicacao: { orgao: string; data: string; protocolo: string } | null;
  comunicacaoAtrasada: boolean;
  ncId: string | null;
  ncNumero: string | null;
  status: 'aberta' | 'encerrada';
  causas: string | null;
  acoes: string | null;
  remediacao: string | null;
  versao: string;
}

// ---------------------------------------------------------------- obrigações legais

export const PERIODICIDADES = {
  mensal: { nome: 'Mensal', meses: 1 },
  trimestral: { nome: 'Trimestral', meses: 3 },
  semestral: { nome: 'Semestral', meses: 6 },
  anual: { nome: 'Anual', meses: 12 },
  bienal: { nome: 'A cada 2 anos', meses: 24 },
  unica: { nome: 'Única', meses: null },
} as const;
export type Periodicidade = keyof typeof PERIODICIDADES;
export const NOMES_DAS_PERIODICIDADES = Object.fromEntries(
  Object.entries(PERIODICIDADES).map(([k, p]) => [k, p.nome]),
) as Record<Periodicidade, string>;

/** Obrigações comuns, para começar o calendário. Confira prazos e órgãos do seu estado. */
export const MODELOS_DE_OBRIGACAO: {
  nome: string;
  orgao: string;
  periodicidade: Periodicidade;
  dica: string;
}[] = [
  {
    nome: 'RAPP: relatório anual de atividades potencialmente poluidoras',
    orgao: 'IBAMA',
    periodicidade: 'anual',
    dica: 'Entrega até 31 de março, sobre o ano anterior, no CTF/APP.',
  },
  {
    nome: 'TCFA: taxa de controle e fiscalização ambiental',
    orgao: 'IBAMA',
    periodicidade: 'trimestral',
    dica: 'Paga por trimestre, até o 5º dia útil do mês seguinte ao trimestre.',
  },
  {
    nome: 'Certificado de regularidade do CTF/APP',
    orgao: 'IBAMA',
    periodicidade: 'trimestral',
    dica: 'O certificado vale 3 meses: emita de novo antes de vencer.',
  },
  {
    nome: 'Inventário anual de resíduos sólidos',
    orgao: 'Órgão ambiental estadual',
    periodicidade: 'anual',
    dica: 'Use o inventário de resíduos do sistema como base.',
  },
  {
    nome: 'Declaração de movimentação de resíduos',
    orgao: 'Órgão ambiental estadual',
    periodicidade: 'trimestral',
    dica: 'Periodicidade e sistema variam por estado.',
  },
  {
    nome: 'Relatório de automonitoramento de efluentes',
    orgao: 'Órgão ambiental estadual',
    periodicidade: 'trimestral',
    dica: 'Conforme a condicionante da licença.',
  },
  {
    nome: 'Relatório de monitoramento de emissões atmosféricas',
    orgao: 'Órgão ambiental estadual',
    periodicidade: 'anual',
    dica: 'Conforme a condicionante da licença.',
  },
  {
    nome: 'Declaração anual de uso de recursos hídricos',
    orgao: 'ANA ou órgão estadual',
    periodicidade: 'anual',
    dica: 'Para quem tem outorga de captação ou lançamento.',
  },
  {
    nome: 'Renovação da outorga de uso de água',
    orgao: 'ANA ou órgão estadual',
    periodicidade: 'unica',
    dica: 'Protocole com antecedência do vencimento da outorga.',
  },
];

const camposDaObrigacao = {
  nome: texto('o nome da obrigação', 200, 3),
  orgao: texto('o órgão', 120, 2),
  periodicidade: z.enum(chaves(NOMES_DAS_PERIODICIDADES), {
    error: 'Escolha a periodicidade.',
  }),
  proximoVencimento: data('o próximo vencimento'),
  responsavel: texto('o responsável', 120, 3),
  descricao: textoOpcional(1000),
};
export const novaObrigacaoSchema = z.object(camposDaObrigacao);
export type NovaObrigacao = z.input<typeof novaObrigacaoSchema>;
export const atualizarObrigacaoSchema = z.object({
  ...camposDaObrigacao,
  versao,
});
export const cumprirObrigacaoSchema = z.object({
  versao,
  data: data('a data da entrega'),
  comprovante: texto('o protocolo ou comprovante', 80, 2),
  observacao: textoOpcional(500),
});

export const SITUACOES_DA_OBRIGACAO = {
  em_dia: 'Em dia',
  vence_em_breve: 'Vence em até 30 dias',
  vencida: 'Vencida',
  cumprida: 'Cumprida',
} as const;

export interface ObrigacaoLegal {
  id: string;
  nome: string;
  orgao: string;
  periodicidade: Periodicidade;
  proximoVencimento: string | null;
  responsavel: string;
  descricao: string | null;
  situacao: keyof typeof SITUACOES_DA_OBRIGACAO;
  historico: {
    vencimento: string;
    data: string;
    comprovante: string;
    observacao: string | null;
    noPrazo: boolean;
  }[];
  versao: string;
}

// ---------------------------------------------------------------- destinadores de resíduos

export const TIPOS_DE_DESTINADOR = {
  transportador: 'Transportador',
  destinador: 'Destinador',
  ambos: 'Transportador e destinador',
} as const;

const camposDoDestinador = {
  nome: texto('o nome', 150, 2),
  cnpj: textoOpcional(18),
  tipo: z.enum(chaves(TIPOS_DE_DESTINADOR), { error: 'Escolha o tipo.' }),
  licencaNumero: texto('o número da licença', 60, 2),
  licencaOrgao: texto('o órgão da licença', 60, 2),
  licencaValidade: data('a validade da licença'),
  atividades: textoOpcional(500),
};
export const novoDestinadorSchema = z.object(camposDoDestinador);
export const atualizarDestinadorSchema = z.object({
  ...camposDoDestinador,
  versao,
});

export interface Destinador {
  id: string;
  nome: string;
  cnpj: string | null;
  tipo: keyof typeof TIPOS_DE_DESTINADOR;
  licencaNumero: string;
  licencaOrgao: string;
  licencaValidade: string;
  licencaVencida: boolean;
  licencaVenceEmBreve: boolean;
  atividades: string | null;
  versao: string;
}

export interface LinhaDoInventarioDeResiduos {
  residuoId: string;
  nome: string;
  classe: string;
  unidade: string;
  destinacao: string;
  saidas: number;
  quantidade: number;
  custo: number;
  semCdf: number;
}
export interface InventarioDeResiduos {
  ano: number;
  linhas: LinhaDoInventarioDeResiduos[];
  custoTotal: number;
}

// ---------------------------------------------------------------- produção e ecoeficiência

export const registrarProducaoSchema = z.object({
  competencia,
  quantidade: valor('a quantidade produzida'),
  unidade: texto('a unidade (t, peças, m²...)', 20, 1),
});
export interface ProducaoDoMes {
  competencia: string;
  quantidade: number;
  unidade: string;
}

export interface EcoeficienciaDoMes {
  competencia: string;
  producao: number | null;
  agua: number | null;
  energia: number | null;
  /** kg (saídas em kg ou t). */
  residuos: number | null;
  /** kg CO₂e com os fatores informados. */
  gee: number | null;
}
export interface Ecoeficiencia {
  ano: number;
  unidadeDeProducao: string | null;
  meses: EcoeficienciaDoMes[];
  /** Totais do ano divididos pela produção do ano; null sem produção. */
  porUnidade: {
    agua: number | null;
    energia: number | null;
    residuos: number | null;
    gee: number | null;
  };
}

// ---------------------------------------------------------------- programas e metas

export const INDICADORES_DO_PROGRAMA = {
  agua_por_unidade: 'Água por unidade produzida (m³)',
  energia_por_unidade: 'Energia por unidade produzida (kWh)',
  residuos_por_unidade: 'Resíduos por unidade produzida (kg)',
  gee_por_unidade: 'Emissões por unidade produzida (kg CO₂e)',
  agua: 'Água no ano (m³)',
  energia: 'Energia no ano (kWh)',
  residuos: 'Resíduos no ano (kg)',
  gee: 'Emissões no ano (kg CO₂e)',
  manual: 'Indicador próprio (medição manual)',
} as const;
export type IndicadorDoPrograma = keyof typeof INDICADORES_DO_PROGRAMA;

const camposDoPrograma = {
  nome: texto('o nome do programa', 150, 3),
  objetivo: texto('o objetivo', 1000, 5),
  indicador: z.enum(chaves(INDICADORES_DO_PROGRAMA), {
    error: 'Escolha o indicador.',
  }),
  unidadeManual: textoOpcional(20),
  linhaDeBase: valor('a linha de base'),
  anoBase: z.coerce.number().int().min(2000).max(2100),
  meta: valor('a meta'),
  prazo: data('o prazo da meta'),
  responsavel: texto('o responsável', 120, 3),
  acoes: z
    .array(
      z.object({
        oQue: texto('a ação', 300, 3),
        responsavel: z.string().trim().max(120).default(''),
        prazo: opcional(data('o prazo da ação')),
        concluida: z.coerce.boolean().default(false),
      }),
    )
    .max(50)
    .default([]),
};
export const novoProgramaSchema = z
  .object(camposDoPrograma)
  .refine((p) => p.indicador !== 'manual' || p.unidadeManual, {
    path: ['unidadeManual'],
    message: 'Informe a unidade do indicador próprio.',
  });
export const atualizarProgramaSchema = z
  .object({
    ...camposDoPrograma,
    versao,
    encerrado: z.coerce.boolean().default(false),
  })
  .refine((p) => p.indicador !== 'manual' || p.unidadeManual, {
    path: ['unidadeManual'],
    message: 'Informe a unidade do indicador próprio.',
  });
export const medirProgramaSchema = z.object({
  versao,
  competencia,
  valor: valor('o valor medido'),
});

export interface ProgramaAmbiental {
  id: string;
  nome: string;
  objetivo: string;
  indicador: IndicadorDoPrograma;
  unidade: string;
  linhaDeBase: number;
  anoBase: number;
  meta: number;
  prazo: string;
  responsavel: string;
  acoes: {
    oQue: string;
    responsavel: string;
    prazo: string | null;
    concluida: boolean;
  }[];
  medicoes: { competencia: string; valor: number }[];
  /** Valor atual: ano corrente (ou última medição, no manual). */
  atual: number | null;
  /** % do caminho da linha de base até a meta (pode passar de 100). */
  progresso: number | null;
  encerrado: boolean;
  versao: string;
}

/** Quanto do caminho da linha de base até a meta já foi feito (redução ou aumento). */
export function progressoDaMeta(
  base: number,
  meta: number,
  atual: number | null,
): number | null {
  if (atual === null || base === meta) return null;
  return Math.round(((base - atual) / (base - meta)) * 100);
}
