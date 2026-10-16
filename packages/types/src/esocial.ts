/**
 * eSocial SST (serviço seguranca): eventos S-2210 (CAT), S-2220 (monitoramento da saúde) e S-2240 (condições
 * ambientais), gerados no leiaute oficial para conferência e envio pelo transmissor da empresa (assinatura com
 * certificado ICP-Brasil e transmissão ficam fora). docs/05-modulos/esocial.md
 */
import { z } from 'zod';
import { cnpjValido, normalizarDocumento } from './documento.js';
import { data, opcional, texto, textoOpcional } from './validadores.js';

/** Versão do leiaute usada nos namespaces. Confira a vigente no portal do eSocial antes de enviar. */
export const LEIAUTE_ESOCIAL = 'v_S_01_03_00';

export const EVENTOS_SST = {
  'S-2210': 'S-2210 · Comunicação de acidente de trabalho',
  'S-2220': 'S-2220 · Monitoramento da saúde do trabalhador',
  'S-2240': 'S-2240 · Condições ambientais do trabalho',
} as const;
export type EventoSst = keyof typeof EVENTOS_SST;

export const AMBIENTES_ESOCIAL = {
  1: 'Produção',
  2: 'Produção restrita (testes)',
} as const;
export const ORGAOS_DE_CLASSE = { 1: 'CRM', 4: 'CREA', 9: 'Outro' } as const;
export const ORGAOS_DO_ATESTADO = { 1: 'CRM', 2: 'CRO', 3: 'RMS' } as const;

const uf = z
  .string({ error: 'Informe a UF.' })
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, 'Informe a UF com 2 letras (ex.: SP).');
const cpf = z
  .string()
  .transform(normalizarDocumento)
  .pipe(z.string().length(11, 'O CPF tem 11 dígitos.'));
const simNao = z.enum(['S', 'N'], { error: 'Escolha sim ou não.' });
const hhmm = (rotulo: string) =>
  z
    .string({ error: `Informe ${rotulo}.` })
    .regex(/^([01]\d|2[0-3])[0-5]\d$/, `Informe ${rotulo} como 0930.`);
/** Códigos de 9 dígitos das tabelas do eSocial (13, 14/15, 17). */
const codigo9 = (rotulo: string) =>
  z
    .string({ error: `Informe ${rotulo}.` })
    .trim()
    .regex(/^\d{9}$/, `${rotulo}: código de 9 dígitos da tabela do eSocial.`);

// ---------------------------------------------------------------- configuração

export const configuracaoEsocialSchema = z.object({
  cnpj: z
    .string({ error: 'Informe o CNPJ.' })
    .transform(normalizarDocumento)
    .pipe(
      z
        .string()
        .length(14, 'O CNPJ tem 14 dígitos.')
        .refine(cnpjValido, 'CNPJ inválido.'),
    ),
  ambiente: z.coerce
    .number()
    .refine((n) => n === 1 || n === 2, 'Escolha o ambiente.'),
  /** A partir de quando a empresa informa SST no eSocial (início da condição no S-2240). */
  inicioSst: data('o início da obrigatoriedade de SST'),
  medicoNome: texto('o nome do médico responsável pelo PCMSO', 70, 3),
  medicoCpf: opcional(cpf),
  medicoCrm: z
    .string()
    .trim()
    .regex(/^\d{1,8}$/, 'Informe o número do CRM (só dígitos).'),
  medicoUf: uf,
  ambientalNome: texto('o responsável pelos registros ambientais', 70, 3),
  ambientalCpf: cpf,
  ambientalOrgao: z.coerce
    .number()
    .refine((n) => n === 1 || n === 4 || n === 9, 'Escolha o conselho.'),
  ambientalNumero: z
    .string()
    .trim()
    .min(1, 'Informe o número no conselho.')
    .max(14),
  ambientalUf: uf,
  /** Declaração da empresa sobre os EPIs (exigida no S-2240 quando há EPI). */
  epiDeclaracao: z
    .object({
      medProtecao: simNao,
      condFuncto: simNao,
      usoInint: simNao,
      przValid: simNao,
      periodicTroca: simNao,
      higienizacao: simNao,
    })
    .default({
      medProtecao: 'S',
      condFuncto: 'S',
      usoInint: 'S',
      przValid: 'S',
      periodicTroca: 'S',
      higienizacao: 'S',
    }),
});
export type ConfiguracaoEsocial = z.output<typeof configuracaoEsocialSchema>;

export const PERGUNTAS_DO_EPI = {
  medProtecao:
    'Foi tentada a implementação de medidas de proteção coletiva antes do EPI?',
  condFuncto:
    'Foram observadas as condições de funcionamento do EPI ao longo do tempo?',
  usoInint: 'Foi observado o uso ininterrupto do EPI ao longo do tempo?',
  przValid: 'Foi observado o prazo de validade do CA no momento da compra?',
  periodicTroca:
    'Foi observada a periodicidade de troca definida pelo fabricante ou programas ambientais?',
  higienizacao:
    'Foi observada a higienização conforme orientação do fabricante?',
} as const;

// ---------------------------------------------------------------- dados do S-2210 (no acidente)

export const TIPOS_DE_ACIDENTE_ESOCIAL = {
  1: 'Típico',
  2: 'Doença',
  3: 'Trajeto',
} as const;
export const LOCAIS_DO_ACIDENTE = {
  1: 'Estabelecimento do empregador no Brasil',
  2: 'Estabelecimento do empregador no exterior',
  3: 'Estabelecimento de terceiros onde presta serviço',
  4: 'Via pública',
  5: 'Área rural',
  6: 'Embarcação',
  9: 'Outros',
} as const;
export const LATERALIDADES = {
  0: 'Não aplicável',
  1: 'Esquerda',
  2: 'Direita',
  3: 'Ambas',
} as const;

export const dadosDaCatSchema = z.object({
  acidentadoId: z.uuid('Escolha o funcionário acidentado.'),
  tpAcid: z.coerce.number().refine((n) => n >= 1 && n <= 3, 'Escolha o tipo.'),
  hrAcid: hhmm('a hora do acidente'),
  hrsTrab: hhmm('as horas trabalhadas antes do acidente'),
  tpLocal: z.coerce
    .number()
    .refine((n) => [1, 2, 3, 4, 5, 6, 9].includes(n), 'Escolha o local.'),
  dscLocal: textoOpcional(255),
  dscLograd: texto('o logradouro do local', 100, 2),
  nrLograd: z.string().trim().min(1, 'Informe o número (ou S/N).').max(10),
  codMunic: opcional(
    z.string().regex(/^\d{7}$/, 'Código IBGE do município com 7 dígitos.'),
  ),
  uf: opcional(uf),
  codSitGeradora: codigo9('a situação geradora (tabela 15)'),
  codParteAting: codigo9('a parte do corpo atingida (tabela 13)'),
  lateralidade: z.coerce
    .number()
    .refine((n) => n >= 0 && n <= 3, 'Escolha a lateralidade.'),
  codAgntCausador: codigo9('o agente causador (tabela 14 ou 15)'),
  indCatObito: simNao,
  dtObito: opcional(data('a data do óbito')),
  indComunPolicia: simNao,
  dtAtendimento: data('a data do atendimento'),
  hrAtendimento: hhmm('a hora do atendimento'),
  indInternacao: simNao,
  durTrat: z.coerce.number().int().min(0).max(999),
  dscLesao: codigo9('a natureza da lesão (tabela 17)'),
  codCID: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]\d{2,3}$/, 'CID como S610 (letra e 2 ou 3 dígitos).'),
  nmEmit: texto('o nome do médico do atestado', 70, 3),
  ideOC: z.coerce
    .number()
    .refine((n) => n >= 1 && n <= 3, 'Escolha o conselho.'),
  nrOC: z.string().trim().min(1, 'Informe o número no conselho.').max(14),
  ufOC: opcional(uf),
});
export type DadosDaCat = z.output<typeof dadosDaCatSchema>;

// ---------------------------------------------------------------- dados do S-2240 (no risco do PGR)

export const TIPOS_DE_AVALIACAO = {
  1: 'Quantitativa',
  2: 'Qualitativa',
} as const;
/** Código da tabela 24 para "ausência de agente nocivo". */
export const SEM_AGENTE_NOCIVO = '09.01.001';

export const dadosEsocialDoRiscoSchema = z
  .object({
    codAgNoc: z
      .string()
      .trim()
      .regex(/^\d{2}\.\d{2}\.\d{3}$/, 'Código da tabela 24 como 01.01.021.'),
    tpAval: z.coerce
      .number()
      .refine((n) => n === 1 || n === 2, 'Escolha o tipo de avaliação.'),
    intConc: opcional(z.coerce.number().nonnegative()),
    limTol: opcional(z.coerce.number().nonnegative()),
    unMed: opcional(z.coerce.number().int().min(1).max(99)),
    tecMedicao: textoOpcional(40),
  })
  .refine(
    (r) =>
      r.tpAval !== 1 ||
      (r.intConc !== null && r.unMed !== null && r.tecMedicao),
    {
      path: ['intConc'],
      message:
        'Avaliação quantitativa: informe a intensidade, a unidade e a técnica de medição.',
    },
  );
export type DadosEsocialDoRisco = z.output<typeof dadosEsocialDoRiscoSchema>;

// ---------------------------------------------------------------- exames do ASO (S-2220)

/** Exame do ASO com o procedimento da tabela 27 (4 dígitos). */
export const exameDoAsoSchema = z.object({
  data: data('a data do exame'),
  procedimento: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'Procedimento da tabela 27 com 4 dígitos.'),
});
export type ExameDoAso = z.output<typeof exameDoAsoSchema>;

// ---------------------------------------------------------------- eventos

export const STATUS_DO_EVENTO = {
  gerado: 'Gerado',
  enviado: 'Enviado',
} as const;

export const gerarEventoSchema = z.object({
  evento: z.enum(['S-2210', 'S-2220', 'S-2240'], {
    error: 'Evento desconhecido.',
  }),
  /** Acidente (S-2210), ASO (S-2220) ou funcionário (S-2240). */
  referenciaId: z.uuid('Registro inválido.'),
});
export const marcarEnviadoSchema = z.object({
  recibo: texto('o número do recibo do eSocial', 40, 5),
});

export interface CandidatoAoEvento {
  evento: EventoSst;
  referenciaId: string;
  descricao: string;
  funcionarioNome: string | null;
  data: string;
  /** O que falta para gerar; vazio = pronto. */
  pendencias: string[];
  /** Último evento gerado para este registro. */
  geradoId: string | null;
}

export interface EventoEsocial {
  id: string;
  evento: EventoSst;
  referenciaId: string;
  descricao: string;
  funcionarioNome: string | null;
  idDoEvento: string;
  status: keyof typeof STATUS_DO_EVENTO;
  recibo: string | null;
  geradoEm: string;
  enviadoEm: string | null;
}

export interface PainelEsocial {
  configurado: boolean;
  configuracao: ConfiguracaoEsocial | null;
  candidatos: CandidatoAoEvento[];
  eventos: EventoEsocial[];
}
