/**
 * Não conformidades (serviço qualidade): contratos e regras de validação.
 * As mesmas regras valem na tela, no gateway e no serviço. docs/05-modulos/nao-conformidades.md
 */
import { z } from 'zod';
import {
  chaves,
  data,
  enumOpcional,
  lista,
  opcional,
  texto,
  textoOpcional,
} from './validadores.js';

export const ORIGENS_NC = {
  inspecao: 'Inspeção',
  calibracao: 'Calibração',
  auditoria: 'Auditoria',
  reclamacao_cliente: 'Reclamação de cliente',
  fornecedor: 'Fornecedor',
  processo: 'Processo interno',
  acidente: 'Acidente ou incidente',
  ambiental: 'Ocorrência ambiental',
  outra: 'Outra',
} as const;
export type OrigemNc = keyof typeof ORIGENS_NC;

export const TIPOS_NC = {
  produto: 'Produto',
  servico: 'Serviço',
  processo: 'Processo',
  sistema: 'Sistema de gestão',
} as const;
export type TipoNc = keyof typeof TIPOS_NC;

export const GRAVIDADES_NC = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
} as const;
export type GravidadeNc = keyof typeof GRAVIDADES_NC;

export const METODOS_ANALISE = {
  cinco_porques: '5 porquês',
  ishikawa: 'Ishikawa (6M)',
  outro: 'Outro',
} as const;
export type MetodoAnalise = keyof typeof METODOS_ANALISE;

export const CATEGORIAS_6M = {
  mao_de_obra: 'Mão de obra',
  metodo: 'Método',
  maquina: 'Máquina',
  material: 'Material',
  medicao: 'Medição',
  meio_ambiente: 'Meio ambiente',
} as const;
export type Categoria6m = keyof typeof CATEGORIAS_6M;

export const STATUS_NC = {
  aberta: 'Aberta',
  em_tratamento: 'Em tratamento',
  em_verificacao: 'Em verificação',
  encerrada: 'Encerrada',
  cancelada: 'Cancelada',
} as const;
export type StatusNc = keyof typeof STATUS_NC;

export const STATUS_FINAIS_NC: readonly StatusNc[] = ['encerrada', 'cancelada'];
export const ehStatusFinalNc = (s: StatusNc) => STATUS_FINAIS_NC.includes(s);

/** Ciclos a partir dos quais a NC é reincidente: a ação corretiva já falhou ao menos uma vez. */
export const CICLOS_REINCIDENTE = 2;

const dinheiro = opcional(
  z
    .string()
    .trim()
    .regex(
      /^\d{1,13}(\.\d{1,2})?$/,
      'Informe o valor em reais (ex.: 1250.00).',
    ),
);

/** Campos descritivos: os mesmos na abertura e na correção. */
const camposDescritivos = {
  titulo: texto('o título', 150, 5),
  descricao: texto('a descrição do que aconteceu', 4000, 10),
  origem: z.enum(chaves(ORIGENS_NC), { error: 'Escolha a origem.' }),
  origemRef: textoOpcional(60),
  tipo: z.enum(chaves(TIPOS_NC), { error: 'Escolha o tipo.' }),
  gravidade: z.enum(chaves(GRAVIDADES_NC), { error: 'Escolha a gravidade.' }),
  setor: textoOpcional(100),
  produto: textoOpcional(150),
  lote: textoOpcional(60),
  responsavel: texto('o responsável', 120, 3),
  prazo: data('a data de prazo'),
  contencao: textoOpcional(2000),
  custoEstimado: dinheiro,
};

export const novaNcSchema = z.object(camposDescritivos);
export type NovaNc = z.input<typeof novaNcSchema>;

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);

export const atualizarNcSchema = z.object({ ...camposDescritivos, versao });
export type AtualizarNc = z.input<typeof atualizarNcSchema>;

/**
 * Análise e ação corretiva. Numa NC aberta, inicia o tratamento (ciclo 1). Numa NC em tratamento, revisa a análise:
 * é o caminho depois de uma verificação ineficaz.
 */
export const registrarTratamentoSchema = z.object({
  versao,
  metodoAnalise: z.enum(chaves(METODOS_ANALISE), {
    error: 'Escolha o método de análise.',
  }),
  categoria6m: enumOpcional(CATEGORIAS_6M, 'Categoria desconhecida.'),
  porques: lista(texto('o porquê', 300), 5, 'porquês'),
  causaRaiz: texto('a causa raiz', 2000, 10),
  acaoCorretiva: texto('a ação corretiva', 2000, 10),
});
export type RegistrarTratamento = z.input<typeof registrarTratamentoSchema>;

/** EM TRATAMENTO → EM VERIFICAÇÃO: a ação foi implantada. */
export const enviarParaVerificacaoSchema = z.object({
  versao,
  dataImplantacao: data('a data de implantação'),
});
export type EnviarParaVerificacao = z.input<typeof enviarParaVerificacaoSchema>;

/** EM VERIFICAÇÃO → ENCERRADA (eficaz) ou de volta a EM TRATAMENTO (ineficaz). */
export const verificarEficaciaSchema = z.object({
  versao,
  eficaz: z.boolean({ error: 'Informe se a ação foi eficaz.' }),
  parecer: texto('o parecer da verificação', 2000, 10),
});
export type VerificarEficacia = z.input<typeof verificarEficaciaSchema>;

export const cancelarNcSchema = z.object({
  versao,
  motivo: texto('o motivo do cancelamento', 500, 10),
});
export type CancelarNc = z.input<typeof cancelarNcSchema>;

export const filtroNcsSchema = z.object({
  /** Registro de origem exato (ex.: INS-2026-004): as NCs abertas a partir dele. */
  origemRef: opcional(z.string().trim().max(60)),
  busca: opcional(z.string().trim().max(100, 'Use no máximo 100 caracteres.')),
  status: enumOpcional(STATUS_NC, 'Status desconhecido.'),
  gravidade: enumOpcional(GRAVIDADES_NC, 'Gravidade desconhecida.'),
  origem: enumOpcional(ORIGENS_NC, 'Origem desconhecida.'),
  vencidas: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((v) => v === true || v === 'true'),
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
export type FiltroNcs = z.input<typeof filtroNcsSchema>;

export interface NaoConformidade {
  id: string;
  numero: string;
  titulo: string;
  descricao: string;
  origem: OrigemNc;
  origemRef: string | null;
  tipo: TipoNc;
  gravidade: GravidadeNc;
  setor: string | null;
  produto: string | null;
  lote: string | null;
  responsavel: string;
  /** AAAA-MM-DD */
  prazo: string;
  dataAbertura: string;
  contencao: string | null;
  custoEstimado: string | null;
  status: StatusNc;
  metodoAnalise: MetodoAnalise | null;
  categoria6m: Categoria6m | null;
  porques: string[];
  causaRaiz: string | null;
  acaoCorretiva: string | null;
  dataImplantacao: string | null;
  /** Resultado da última verificação de eficácia. */
  eficaz: boolean | null;
  parecerEficacia: string | null;
  verificadoPor: string | null;
  verificadoEm: string | null;
  /** Quantas vezes a NC entrou em tratamento (1 = primeira; 2+ = ação anterior ineficaz). */
  ciclos: number;
  encerradaEm: string | null;
  motivoCancelamento: string | null;
  canceladaEm: string | null;
  /** Calculado: prazo anterior a hoje e status não final. */
  vencida: boolean;
  criadoEm: string;
  /** Versão para edição simultânea: devolva-a em toda alteração. */
  versao: string;
}

export type NaoConformidadeResumo = Pick<
  NaoConformidade,
  | 'id'
  | 'numero'
  | 'titulo'
  | 'origem'
  | 'gravidade'
  | 'responsavel'
  | 'prazo'
  | 'status'
  | 'ciclos'
  | 'vencida'
>;

export interface ResumoNcs {
  abertas: number;
  vencidas: number;
  /** Altas e críticas que ainda não terminaram. */
  graves: number;
}

export const ncsPorMesSchema = z.object({
  meses: z.coerce.number().int().min(1).max(24).default(12),
});

/** Quantas NCs foram abertas e quantas foram encerradas em cada mês (AAAA-MM), do mais antigo ao atual. */
export interface NcsDoMes {
  mes: string;
  abertas: number;
  encerradas: number;
}
