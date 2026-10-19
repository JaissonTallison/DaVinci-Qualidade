/**
 * Acidentes, incidentes e indicadores de SST (serviço seguranca). docs/05-modulos/acidentes.md
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

export const TIPOS_ACIDENTE = {
  com_afastamento: 'Acidente com afastamento',
  sem_afastamento: 'Acidente sem afastamento',
  incidente: 'Incidente',
  quase_acidente: 'Quase-acidente',
} as const;
export type TipoAcidente = keyof typeof TIPOS_ACIDENTE;
/** Acidente com lesão: exige CAT (Lei 8.213 art. 22). */
export const ehAcidenteComLesao = (t: TipoAcidente) =>
  t === 'com_afastamento' || t === 'sem_afastamento';

export const STATUS_ACIDENTE = {
  registrado: 'Registrado',
  em_investigacao: 'Em investigação',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
} as const;
export type StatusAcidente = keyof typeof STATUS_ACIDENTE;

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);
const dias = (rotulo: string) =>
  z.coerce
    .number({ error: `Informe ${rotulo} em número.` })
    .int('Use um número inteiro de dias.')
    .min(0, 'Não pode ser negativo.')
    .max(6000, 'Use no máximo 6.000 dias (NBR 14280).')
    .default(0);

const camposDoAcidente = {
  tipo: z.enum(chaves(TIPOS_ACIDENTE), { error: 'Escolha o tipo.' }),
  data: data('a data do acidente'),
  hora: opcional(
    z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Informe a hora como 14:30.'),
  ),
  local: texto('o local', 150, 3),
  setor: textoOpcional(100),
  acidentado: textoOpcional(120),
  funcao: textoOpcional(100),
  descricao: texto('o que aconteceu', 4000, 10),
  lesao: textoOpcional(200),
  parteDoCorpo: textoOpcional(100),
  agenteCausador: textoOpcional(200),
  diasPerdidos: dias('os dias perdidos'),
  diasDebitados: dias('os dias debitados'),
  medidasImediatas: textoOpcional(2000),
  testemunhas: textoOpcional(500),
};

/** Afastamento coerente com o tipo; acidente com lesão identifica a pessoa. */
function coerencia(
  d: { tipo: TipoAcidente; diasPerdidos: number; acidentado: string | null },
  ctx: z.RefinementCtx,
) {
  if (d.tipo === 'com_afastamento' && d.diasPerdidos < 1)
    ctx.addIssue({
      code: 'custom',
      path: ['diasPerdidos'],
      message: 'Acidente com afastamento tem ao menos 1 dia perdido.',
    });
  if (d.tipo !== 'com_afastamento' && d.diasPerdidos > 0)
    ctx.addIssue({
      code: 'custom',
      path: ['diasPerdidos'],
      message: 'Só acidente com afastamento tem dias perdidos.',
    });
  if (ehAcidenteComLesao(d.tipo) && !d.acidentado)
    ctx.addIssue({
      code: 'custom',
      path: ['acidentado'],
      message: 'Informe quem se acidentou.',
    });
}

export const novoAcidenteSchema = z
  .object(camposDoAcidente)
  .superRefine(coerencia);
export type NovoAcidente = z.input<typeof novoAcidenteSchema>;
export const atualizarAcidenteSchema = z
  .object({ ...camposDoAcidente, versao })
  .superRefine(coerencia);

export const registrarCatSchema = z.object({
  versao,
  numero: z
    .string({ error: 'Informe o número da CAT.' })
    .trim()
    .min(5, 'Informe o número da CAT como emitido.')
    .max(30, 'Use no máximo 30 caracteres.'),
  data: data('a data de emissão da CAT'),
});
export const iniciarInvestigacaoSchema = z.object({ versao });
export const concluirInvestigacaoSchema = z.object({
  versao,
  causas: texto('as causas encontradas', 4000, 10),
  medidas: texto('as medidas para evitar a repetição', 4000, 10),
});
export const cancelarAcidenteSchema = z.object({
  versao,
  motivo: texto('o motivo do cancelamento', 500, 10),
});

export const filtroAcidentesSchema = z.object({
  busca: opcional(z.string().trim().max(100, 'Use no máximo 100 caracteres.')),
  tipo: enumOpcional(TIPOS_ACIDENTE, 'Tipo desconhecido.'),
  status: enumOpcional(STATUS_ACIDENTE, 'Status desconhecido.'),
  ordenar: z.enum(['numero', 'data', 'tipo', 'status']).optional(),
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

/** Horas-homem trabalhadas de um mês, base da TF e da TG. */
export const registrarHorasSchema = z.object({
  competencia: z
    .string({ error: 'Informe o mês.' })
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Informe o mês como 2026-10.'),
  horas: z.coerce
    .number({ error: 'Informe as horas em número.' })
    .positive('As horas precisam ser maiores que zero.')
    .max(1_000_000_000),
});
export const indicadoresSchema = z.object({
  ano: z.coerce.number().int().min(2000).max(2100),
});

export interface Acidente {
  id: string;
  numero: string;
  tipo: TipoAcidente;
  data: string;
  hora: string | null;
  local: string;
  setor: string | null;
  acidentado: string | null;
  funcao: string | null;
  descricao: string;
  lesao: string | null;
  parteDoCorpo: string | null;
  agenteCausador: string | null;
  diasPerdidos: number;
  diasDebitados: number;
  medidasImediatas: string | null;
  testemunhas: string | null;
  catNumero: string | null;
  catData: string | null;
  /** Primeiro dia útil seguinte ao acidente (sem feriados). Só para acidente com lesão. */
  prazoCat: string | null;
  catAtrasada: boolean;
  status: StatusAcidente;
  causas: string | null;
  medidas: string | null;
  motivoCancelamento: string | null;
  investigacao: InvestigacaoDoAcidente;
  /** Complemento do S-2210 (eSocial). */
  dadosCat: import('./esocial.js').DadosDaCat | null;
  versao: string;
}

export type AcidenteResumo = Pick<
  Acidente,
  | 'id'
  | 'numero'
  | 'tipo'
  | 'data'
  | 'local'
  | 'acidentado'
  | 'diasPerdidos'
  | 'status'
  | 'catAtrasada'
>;

export interface IndicadorDoMes {
  competencia: string;
  horas: number | null;
  acidentesComAfastamento: number;
  diasPerdidosEDebitados: number;
  /** null quando não há horas lançadas no mês. */
  tf: number | null;
  tg: number | null;
}

export interface IndicadoresSst {
  ano: number;
  meses: IndicadorDoMes[];
  total: Omit<IndicadorDoMes, 'competencia'>;
  /** Dias desde o último acidente com afastamento; null se nunca houve. */
  diasSemAcidente: number | null;
  ultimoAcidenteComAfastamento: string | null;
}

export interface ResumoAcidentes {
  emAberto: number;
  catsAtrasadas: number;
  diasSemAcidente: number | null;
}

// ---------------------------------------------------------------- investigação estruturada

/** Método ITMa (árvore de causas): cada fato é do Indivíduo, da Tarefa, do Material ou do Meio. */
export const COMPONENTES_ITMA = {
  individuo: 'Indivíduo',
  tarefa: 'Tarefa',
  material: 'Material',
  meio: 'Meio',
} as const;
export type ComponenteItma = keyof typeof COMPONENTES_ITMA;

export const registrarInvestigacaoSchema = z.object({
  versao,
  testemunhas: z
    .array(
      z.object({
        nome: texto('o nome da testemunha', 120, 2),
        funcao: z.string().trim().max(100).default(''),
        relato: texto('o relato', 2000, 5),
      }),
    )
    .max(20)
    .default([]),
  porques: z.array(z.string().trim().max(300)).max(5).default([]),
  /** Árvore de causas: fatos numerados a partir de 1; `antecedentes` são os números dos fatos que levaram a este. */
  fatos: z
    .array(
      z.object({
        fato: texto('o fato', 300, 3),
        componente: z.enum(chaves(COMPONENTES_ITMA), {
          error: 'Escolha o componente.',
        }),
        antecedentes: z
          .array(z.coerce.number().int().min(1))
          .max(10)
          .default([]),
      }),
    )
    .max(60)
    .default([])
    .superRefine((fatos, ctx) => {
      fatos.forEach((f, i) => {
        for (const a of f.antecedentes)
          if (a > fatos.length || a === i + 1)
            ctx.addIssue({
              code: 'custom',
              path: [i, 'antecedentes'],
              message: `Fato ${i + 1}: o antecedente ${a} não existe (ou é o próprio fato).`,
            });
      });
    }),
});
export type RegistrarInvestigacao = z.input<typeof registrarInvestigacaoSchema>;

export interface InvestigacaoDoAcidente {
  testemunhas: { nome: string; funcao: string; relato: string }[];
  porques: string[];
  fatos: { fato: string; componente: ComponenteItma; antecedentes: number[] }[];
}
