/**
 * Permissão de Trabalho (PT) para atividades de risco: altura (NR-35), espaço confinado (NR-33), trabalho a quente,
 * eletricidade (NR-10). Serviço seguranca. docs/05-modulos/permissoes-de-trabalho.md
 */
import { z } from 'zod';
import { chaves, enumOpcional, texto, textoOpcional } from './validadores.js';

export const TIPOS_PT = {
  altura: 'Trabalho em altura (NR-35)',
  espaco_confinado: 'Espaço confinado (NR-33)',
  quente: 'Trabalho a quente',
  eletricidade: 'Eletricidade (NR-10)',
  outros: 'Outros serviços de risco',
} as const;
export type TipoPt = keyof typeof TIPOS_PT;

export const STATUS_PT = {
  solicitada: 'Solicitada',
  liberada: 'Liberada',
  encerrada: 'Encerrada',
  cancelada: 'Cancelada',
} as const;
export type StatusPt = keyof typeof STATUS_PT;

/** Uma PT vale no máximo por uma jornada. */
export const DURACAO_MAXIMA_PT_HORAS = 12;

const momento = (rotulo: string) =>
  z
    .string({ error: `Informe ${rotulo}.` })
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
      `Informe ${rotulo} (data e hora).`,
    );
const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);
const horas = (de: string, ate: string) =>
  (Date.parse(`${ate}:00Z`) - Date.parse(`${de}:00Z`)) / 3_600_000;

export const novaPtSchema = z
  .object({
    tipo: z.enum(chaves(TIPOS_PT), { error: 'Escolha o tipo de trabalho.' }),
    local: texto('o local', 120, 3),
    servico: texto('o serviço a executar', 500, 10),
    executantes: texto('quem executa (nomes e empresa)', 500, 3),
    inicio: momento('o início'),
    fim: momento('o fim'),
    riscos: texto('os riscos e as medidas de controle', 1000, 10),
    epis: textoOpcional(500),
  })
  .refine((p) => p.fim > p.inicio, {
    path: ['fim'],
    message: 'O fim vem depois do início.',
  })
  .refine(
    (p) =>
      p.fim <= p.inicio || horas(p.inicio, p.fim) <= DURACAO_MAXIMA_PT_HORAS,
    {
      path: ['fim'],
      message: `Uma PT vale no máximo ${DURACAO_MAXIMA_PT_HORAS} horas (uma jornada). Emita outra para o dia seguinte.`,
    },
  );
export type NovaPt = z.input<typeof novaPtSchema>;

export const liberarPtSchema = z.object({ versao });
export const encerrarPtSchema = z.object({
  versao,
  observacao: textoOpcional(500),
});
export const cancelarPtSchema = z.object({
  versao,
  motivo: texto('o motivo do cancelamento', 300, 10),
});

export const filtroPtsSchema = z.object({
  status: enumOpcional(STATUS_PT, 'Status desconhecido.'),
  tipo: enumOpcional(TIPOS_PT, 'Tipo desconhecido.'),
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

export interface PermissaoDeTrabalho {
  id: string;
  numero: string;
  tipo: TipoPt;
  local: string;
  servico: string;
  executantes: string;
  /** AAAA-MM-DDTHH:mm, hora de Brasília. */
  inicio: string;
  fim: string;
  riscos: string;
  epis: string | null;
  status: StatusPt;
  /** Liberada e com o fim já passado: o serviço precisa ser encerrado. */
  vencida: boolean;
  solicitadaPorMim: boolean;
  liberadaEm: string | null;
  encerradaEm: string | null;
  observacaoEncerramento: string | null;
  motivoCancelamento: string | null;
  versao: string;
}

export interface ResumoPts {
  aguardandoLiberacao: number;
  emExecucao: number;
  vencidas: number;
}
