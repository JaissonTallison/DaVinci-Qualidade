/**
 * Planos de ação (serviço qualidade): contratos e regras de validação. docs/05-modulos/planos-de-acao.md
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

export const TIPOS_PLANO = {
  corretiva: 'Corretiva',
  preventiva: 'Preventiva',
  melhoria: 'Melhoria',
} as const;
export type TipoPlano = keyof typeof TIPOS_PLANO;

export const ORIGENS_PLANO = {
  nc: 'Não conformidade',
  auditoria: 'Auditoria',
  risco: 'Risco',
  analise_critica: 'Análise crítica',
  acidente: 'Acidente ou incidente',
  melhoria: 'Melhoria',
  outra: 'Outra',
} as const;
export type OrigemPlano = keyof typeof ORIGENS_PLANO;

export const STATUS_PLANO = {
  em_execucao: 'Em execução',
  aguardando_eficacia: 'Aguardando eficácia',
  encerrado: 'Encerrado',
  cancelado: 'Cancelado',
} as const;
export type StatusPlano = keyof typeof STATUS_PLANO;
export const STATUS_FINAIS_PLANO: readonly StatusPlano[] = [
  'encerrado',
  'cancelado',
];
export const ehStatusFinalPlano = (s: StatusPlano) =>
  STATUS_FINAIS_PLANO.includes(s);

export const SITUACOES_TAREFA = {
  pendente: 'Pendente',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
} as const;
export type SituacaoTarefa = keyof typeof SITUACOES_TAREFA;

export const MAXIMO_DE_TAREFAS = 30;

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);
const dinheiro = opcional(
  z
    .string()
    .trim()
    .regex(
      /^\d{1,13}(\.\d{1,2})?$/,
      'Informe o valor em reais (ex.: 1250.00).',
    ),
);

/** Uma linha do 5W2H: o quê, quem, quando (obrigatórios), onde e como. */
export const tarefaSchema = z.object({
  oQue: texto('o que fazer', 300, 5),
  responsavel: texto('o responsável', 120, 3),
  prazo: data('o prazo'),
  onde: textoOpcional(150),
  como: textoOpcional(1000),
});
export type NovaTarefa = z.input<typeof tarefaSchema>;

const camposDoPlano = {
  titulo: texto('o título', 150, 5),
  objetivo: texto('o objetivo (o resultado esperado)', 2000, 10),
  tipo: z.enum(chaves(TIPOS_PLANO), { error: 'Escolha o tipo.' }),
  origem: z.enum(chaves(ORIGENS_PLANO), { error: 'Escolha a origem.' }),
  origemRef: textoOpcional(60),
  responsavel: texto('o responsável pelo plano', 120, 3),
  custoPrevisto: dinheiro,
};

export const novoPlanoSchema = z.object({
  ...camposDoPlano,
  /** NC deste sistema que o plano trata (opcional). */
  ncId: opcional(z.uuid('NC inválida.')),
  tarefas: z
    .array(tarefaSchema)
    .min(1, 'Inclua ao menos uma tarefa.')
    .max(MAXIMO_DE_TAREFAS, `Use no máximo ${MAXIMO_DE_TAREFAS} tarefas.`),
});
export type NovoPlano = z.input<typeof novoPlanoSchema>;

export const atualizarPlanoSchema = z.object({ ...camposDoPlano, versao });
export type AtualizarPlano = z.input<typeof atualizarPlanoSchema>;

export const incluirTarefaSchema = z.object({ versao, tarefa: tarefaSchema });
export type IncluirTarefa = z.input<typeof incluirTarefaSchema>;

const tarefaId = z.uuid('Tarefa inválida.');
export const concluirTarefaSchema = z.object({ versao, tarefaId });
export const reabrirTarefaSchema = z.object({ versao, tarefaId });
export const cancelarTarefaSchema = z.object({
  versao,
  tarefaId,
  motivo: texto('o motivo', 300, 5),
});

export const verificarEficaciaPlanoSchema = z.object({
  versao,
  eficaz: z.boolean({ error: 'Informe se o objetivo foi alcançado.' }),
  parecer: texto('o parecer da verificação', 2000, 10),
});
export type VerificarEficaciaPlano = z.input<
  typeof verificarEficaciaPlanoSchema
>;

export const cancelarPlanoSchema = z.object({
  versao,
  motivo: texto('o motivo do cancelamento', 500, 10),
});

export const filtroPlanosSchema = z.object({
  busca: opcional(z.string().trim().max(100, 'Use no máximo 100 caracteres.')),
  status: enumOpcional(STATUS_PLANO, 'Status desconhecido.'),
  origem: enumOpcional(ORIGENS_PLANO, 'Origem desconhecida.'),
  ncId: opcional(z.uuid('NC inválida.')),
  atrasados: z
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
export type FiltroPlanos = z.input<typeof filtroPlanosSchema>;

export interface Tarefa {
  id: string;
  ordem: number;
  oQue: string;
  responsavel: string;
  prazo: string;
  onde: string | null;
  como: string | null;
  situacao: SituacaoTarefa;
  concluidaEm: string | null;
  motivoCancelamento: string | null;
  /** Pendente com prazo anterior a hoje. */
  atrasada: boolean;
}

export interface PlanoDeAcao {
  id: string;
  numero: string;
  titulo: string;
  objetivo: string;
  tipo: TipoPlano;
  origem: OrigemPlano;
  origemRef: string | null;
  ncId: string | null;
  responsavel: string;
  custoPrevisto: string | null;
  status: StatusPlano;
  tarefas: Tarefa[];
  /** Concluídas ÷ não canceladas, de 0 a 100. */
  progresso: number;
  /** Maior prazo entre as tarefas não canceladas. */
  prazo: string;
  atrasado: boolean;
  eficaz: boolean | null;
  parecerEficacia: string | null;
  verificadoEm: string | null;
  motivoCancelamento: string | null;
  canceladoEm: string | null;
  criadoEm: string;
  versao: string;
}

export type PlanoResumo = Pick<
  PlanoDeAcao,
  | 'id'
  | 'numero'
  | 'titulo'
  | 'tipo'
  | 'origem'
  | 'origemRef'
  | 'responsavel'
  | 'status'
  | 'progresso'
  | 'prazo'
  | 'atrasado'
> & { tarefasPendentes: number };

export interface ResumoPlanos {
  emExecucao: number;
  atrasados: number;
  aguardandoEficacia: number;
}
