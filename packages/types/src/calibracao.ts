/**
 * Calibração: instrumentos de medição e o histórico de calibrações (serviço qualidade). docs/05-modulos/calibracao.md
 */
import { z } from 'zod';
import {
  data,
  enumOpcional,
  opcional,
  texto,
  textoOpcional,
} from './validadores.js';

export const SITUACOES_INSTRUMENTO = {
  sem_calibracao: 'Sem calibração',
  em_dia: 'Em dia',
  vence_em_breve: 'Vence em até 30 dias',
  vencido: 'Vencido',
  reprovado: 'Reprovado',
  fora_de_uso: 'Fora de uso',
} as const;
export type SituacaoInstrumento = keyof typeof SITUACOES_INSTRUMENTO;

/** Grandeza metrológica que o instrumento mede (organiza o catálogo e o relatório). */
export const GRANDEZAS_DE_MEDICAO = {
  dimensional: 'Dimensional',
  massa: 'Massa',
  temperatura: 'Temperatura',
  pressao: 'Pressão',
  volume: 'Volume',
  vazao: 'Vazão',
  eletrica: 'Elétrica',
  fisico_quimica: 'Físico-química',
  forca_torque: 'Força e torque',
  tempo_rotacao: 'Tempo e rotação',
  umidade: 'Umidade',
  outra: 'Outra',
} as const;
export type GrandezaDeMedicao = keyof typeof GRANDEZAS_DE_MEDICAO;

/** Ramos/segmentos do mercado brasileiro, para filtrar o catálogo de instrumentos por aplicação. */
export const RAMOS_DE_CALIBRACAO = {
  metalmecanica: 'Metalmecânica e usinagem',
  automotivo: 'Automotivo e autopeças',
  industria_geral: 'Indústria geral e manufatura',
  alimentos: 'Alimentos e bebidas',
  farmaceutica: 'Farmacêutica',
  cosmeticos: 'Cosméticos e higiene pessoal',
  laboratorio_saude: 'Laboratório e saúde',
  quimica: 'Química e petroquímica',
  plasticos_borracha: 'Plásticos e borracha',
  textil: 'Têxtil e confecção',
  construcao: 'Construção civil e materiais',
  papel_celulose: 'Papel e celulose',
  eletroeletronica: 'Elétrica e eletrônica',
  oleo_gas_energia: 'Óleo, gás e energia',
  logistica_frio: 'Logística e cadeia do frio',
  agronegocio: 'Agronegócio',
  agua_saneamento: 'Água e saneamento',
  grafica_embalagens: 'Gráfica e embalagens',
} as const;
export type RamoDeCalibracao = keyof typeof RAMOS_DE_CALIBRACAO;

/** Dias de antecedência do aviso "vence em breve". */
export const DIAS_DE_AVISO_DE_CALIBRACAO = 30;

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);
// Aceita o formato brasileiro (1.250,50) e também o cru (1250.50); guarda sempre com ponto decimal.
const dinheiro = opcional(
  z
    .string()
    .trim()
    .transform((s) => (s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s))
    .pipe(
      z
        .string()
        .regex(/^\d{1,13}(\.\d{1,2})?$/, 'Informe o valor em reais (ex.: 250,00).'),
    ),
);

const camposDoInstrumento = {
  tag: z
    .string({ error: 'Informe a TAG.' })
    .trim()
    .toUpperCase()
    .min(2, 'Informe a TAG (ex.: PAQ-0042).')
    .max(30, 'Use no máximo 30 caracteres.')
    .regex(
      /^[A-Z0-9][A-Z0-9./_-]*$/,
      'Use letras, números, ponto, barra, hífen ou sublinhado (ex.: PAQ-0042).',
    ),
  descricao: texto('a descrição', 150, 3),
  fabricante: textoOpcional(80),
  modelo: textoOpcional(80),
  numeroSerie: textoOpcional(60),
  local: textoOpcional(120),
  responsavel: textoOpcional(120),
  grandeza: enumOpcional(GRANDEZAS_DE_MEDICAO, 'Grandeza desconhecida.'),
  unidade: textoOpcional(20),
  faixa: textoOpcional(80),
  criterioAceitacao: textoOpcional(200),
  /** Erro máximo admissível (EMA): o limite de erro que ainda aprova. */
  erroMaximoAdmissivel: textoOpcional(200),
  incerteza: textoOpcional(120),
  classeExatidao: textoOpcional(60),
  normaReferencia: textoOpcional(160),
  frequenciaMeses: z.coerce
    .number({ error: 'Informe a frequência em meses.' })
    .int('Use um número inteiro de meses.')
    .min(1, 'A frequência mínima é de 1 mês.')
    .max(60, 'A frequência máxima é de 60 meses.'),
};

export const novoInstrumentoSchema = z.object(camposDoInstrumento);
export type NovoInstrumento = z.input<typeof novoInstrumentoSchema>;
export const atualizarInstrumentoSchema = z.object({
  ...camposDoInstrumento,
  versao,
});
export const usoDoInstrumentoSchema = z.object({
  versao,
  emUso: z.boolean({ error: 'Informe se o instrumento está em uso.' }),
});

export const registrarCalibracaoSchema = z.object({
  versao,
  data: data('a data da calibração'),
  laboratorio: texto('o laboratório', 120, 2),
  certificado: textoOpcional(60),
  aprovada: z.boolean({ error: 'Informe se a calibração foi aprovada.' }),
  erroEncontrado: textoOpcional(200),
  observacao: textoOpcional(1000),
  custo: dinheiro,
});
export type RegistrarCalibracao = z.input<typeof registrarCalibracaoSchema>;

export const anularCalibracaoSchema = z.object({
  versao,
  calibracaoId: z.uuid('Calibração inválida.'),
  motivo: texto('o motivo da anulação', 300, 10),
});

export const filtroInstrumentosSchema = z.object({
  busca: opcional(z.string().trim().max(100, 'Use no máximo 100 caracteres.')),
  situacao: enumOpcional(SITUACOES_INSTRUMENTO, 'Situação desconhecida.'),
  ordenar: z
    .enum([
      'tag',
      'descricao',
      'local',
      'ultimaCalibracao',
      'proximaCalibracao',
      'situacao',
    ])
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
    .default(50),
});

export interface Calibracao {
  id: string;
  data: string;
  laboratorio: string;
  certificado: string | null;
  aprovada: boolean;
  erroEncontrado: string | null;
  observacao: string | null;
  custo: string | null;
  anulada: boolean;
  motivoAnulacao: string | null;
  criadoEm: string;
}

export interface Instrumento {
  id: string;
  tag: string;
  descricao: string;
  fabricante: string | null;
  modelo: string | null;
  numeroSerie: string | null;
  local: string | null;
  responsavel: string | null;
  grandeza: GrandezaDeMedicao | null;
  unidade: string | null;
  faixa: string | null;
  criterioAceitacao: string | null;
  erroMaximoAdmissivel: string | null;
  incerteza: string | null;
  classeExatidao: string | null;
  normaReferencia: string | null;
  frequenciaMeses: number;
  emUso: boolean;
  situacao: SituacaoInstrumento;
  /** Data da calibração válida mais recente (não anulada). */
  ultimaCalibracao: string | null;
  proximaCalibracao: string | null;
  /** Histórico, da mais recente para a mais antiga (inclui as anuladas). */
  calibracoes: Calibracao[];
  versao: string;
}

export type InstrumentoResumo = Pick<
  Instrumento,
  | 'id'
  | 'tag'
  | 'descricao'
  | 'local'
  | 'responsavel'
  | 'grandeza'
  | 'frequenciaMeses'
  | 'situacao'
  | 'ultimaCalibracao'
  | 'proximaCalibracao'
>;

/**
 * Item do catálogo de calibração por ramo: um instrumento típico de um segmento, já com a grandeza,
 * a unidade, a faixa, o critério/EMA, a frequência e a norma sugeridos. Serve só de ponto de partida
 * no cadastro (a empresa ajusta tudo). O conteúdo fica no web (apps/web); não vai para o banco.
 */
export interface ItemDoCatalogoDeCalibracao {
  /** Nome/descrição do instrumento (ex.: "Paquímetro digital"). */
  instrumento: string;
  grandeza: GrandezaDeMedicao;
  unidade: string;
  /** Faixa de medição típica (ex.: "0 a 150 mm"). */
  faixa: string;
  /** Critério de aceitação / erro máximo admissível típico (ex.: "± 0,02 mm"). */
  criterioAceitacao: string;
  /** Frequência sugerida de calibração, em meses. */
  frequenciaMeses: number;
  /** Norma(s) de referência (ex.: "ABNT NBR ISO 10012; VIM; ISO/IEC 17025"). */
  normaReferencia: string;
  /** Ramos a que o instrumento se aplica. */
  ramos: RamoDeCalibracao[];
  /** Prefixo de TAG sugerido (ex.: "PAQ"). */
  tagSugerida?: string;
}

export interface ResumoCalibracao {
  /** Instrumentos em uso (base dos percentuais). */
  emUso: number;
  vencidos: number;
  vencemEmBreve: number;
  reprovados: number;
  semCalibracao: number;
}
