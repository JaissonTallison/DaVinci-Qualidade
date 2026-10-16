/**
 * Inspeções e modelos de inspeção (serviço qualidade): contratos e regras de validação. docs/05-modulos/inspecoes.md
 */
import { z } from 'zod';
import {
  NIVEIS_DE_INSPECAO,
  NQAS,
  type PlanoDeAmostragem,
} from './amostragem.js';
import {
  chaves,
  data,
  enumOpcional,
  opcional,
  texto,
  textoOpcional,
} from './validadores.js';

export const TIPOS_INSPECAO = {
  recebimento: 'Recebimento',
  processo: 'Processo',
  produto_final: 'Produto final',
  servico: 'Serviço',
  seguranca: 'Segurança',
  outra: 'Outra',
} as const;
export type TipoInspecao = keyof typeof TIPOS_INSPECAO;

export const STATUS_INSPECAO = {
  em_andamento: 'Em andamento',
  aprovada: 'Aprovada',
  reprovada: 'Reprovada',
  cancelada: 'Cancelada',
} as const;
export type StatusInspecao = keyof typeof STATUS_INSPECAO;
export const STATUS_FINAIS_INSPECAO: readonly StatusInspecao[] = [
  'aprovada',
  'reprovada',
  'cancelada',
];

export const RESPOSTAS_ITEM = { ok: 'OK', nok: 'NOK', na: 'N/A' } as const;
export type RespostaItem = keyof typeof RESPOSTAS_ITEM;

export const MAXIMO_DE_ITENS = 60;

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);

/** Item a verificar: o quê e, quando houver, o critério de aceitação. */
export const itemDeVerificacaoSchema = z.object({
  verificar: texto('o que verificar', 300, 3),
  criterio: textoOpcional(300),
});
export type ItemDeVerificacao = z.output<typeof itemDeVerificacaoSchema>;

const itens = z
  .array(itemDeVerificacaoSchema)
  .min(1, 'Inclua ao menos um item.')
  .max(MAXIMO_DE_ITENS, `Use no máximo ${MAXIMO_DE_ITENS} itens.`);

// ---------------------------------------------------------------- modelos

const camposDoModelo = {
  nome: texto('o nome do modelo', 120, 3),
  tipo: z.enum(chaves(TIPOS_INSPECAO), { error: 'Escolha o tipo.' }),
  itens,
};
export const novoModeloSchema = z.object(camposDoModelo);
export type NovoModelo = z.input<typeof novoModeloSchema>;
export const atualizarModeloSchema = z.object({ ...camposDoModelo, versao });
export const situacaoDoModeloSchema = z.object({ versao });

export const filtroModelosSchema = z.object({
  situacao: z.enum(['ativos', 'inativos', 'todos']).default('ativos'),
  tipo: enumOpcional(TIPOS_INSPECAO, 'Tipo desconhecido.'),
});

export interface ModeloDeInspecao {
  id: string;
  nome: string;
  tipo: TipoInspecao;
  itens: ItemDeVerificacao[];
  ativo: boolean;
  versao: string;
}

// ---------------------------------------------------------------- inspeções

export const novaInspecaoSchema = z
  .object({
    tipo: z.enum(chaves(TIPOS_INSPECAO), { error: 'Escolha o tipo.' }),
    objeto: texto('o que foi inspecionado', 200, 3),
    lote: textoOpcional(60),
    local: textoOpcional(120),
    quantidade: opcional(
      z.coerce
        .number({ error: 'Informe um número.' })
        .int('Use um número inteiro.')
        .min(1, 'Informe ao menos 1.')
        .max(10_000_000),
    ),
    inspetor: texto('o inspetor', 120, 3),
    data: data('a data da inspeção'),
    /** Modelo de onde copiar os itens. Sem modelo, os itens vêm no próprio pedido. */
    modeloId: opcional(z.uuid('Modelo inválido.')),
    itens: itens.optional(),
    /** Amostragem (NBR 5426): com NQA, a quantidade é o tamanho do lote e o plano é calculado. */
    nqa: enumOpcional(NQAS, 'NQA desconhecido.'),
    nivelInspecao: enumOpcional(NIVEIS_DE_INSPECAO, 'Nível desconhecido.'),
    /** Fornecedor do lote (cadastro do codex), na inspeção de recebimento. */
    fornecedorId: opcional(z.uuid('Fornecedor inválido.')),
  })
  .refine((d) => d.modeloId || d.itens?.length, {
    path: ['itens'],
    message: 'Escolha um modelo ou inclua os itens a verificar.',
  })
  .refine((d) => !d.nqa || d.quantidade, {
    path: ['quantidade'],
    message: 'Com amostragem, informe o tamanho do lote.',
  });
export type NovaInspecao = z.input<typeof novaInspecaoSchema>;

/** Salva respostas (parcial ou total) enquanto a inspeção está em andamento. */
export const responderInspecaoSchema = z.object({
  versao,
  respostas: z
    .array(
      z.object({
        itemId: z.uuid('Item inválido.'),
        resposta: opcional(
          z.enum(chaves(RESPOSTAS_ITEM), { error: 'Resposta desconhecida.' }),
        ),
        observacao: textoOpcional(1000),
      }),
    )
    .max(MAXIMO_DE_ITENS),
  observacoes: textoOpcional(2000),
});
export type ResponderInspecao = z.input<typeof responderInspecaoSchema>;

export const concluirInspecaoSchema = z.object({
  versao,
  /** Com amostragem: defeituosos encontrados na amostra (decide o lote). */
  defeituosos: opcional(
    z.coerce
      .number({ error: 'Informe um número.' })
      .int('Use um número inteiro.')
      .min(0, 'Não pode ser negativo.'),
  ),
});
export const cancelarInspecaoSchema = z.object({
  versao,
  motivo: texto('o motivo do cancelamento', 500, 10),
});

export const filtroInspecoesSchema = z.object({
  busca: opcional(z.string().trim().max(100, 'Use no máximo 100 caracteres.')),
  status: enumOpcional(STATUS_INSPECAO, 'Status desconhecido.'),
  tipo: enumOpcional(TIPOS_INSPECAO, 'Tipo desconhecido.'),
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

export interface ItemDaInspecao {
  id: string;
  ordem: number;
  verificar: string;
  criterio: string | null;
  resposta: RespostaItem | null;
  observacao: string | null;
}

export interface Inspecao {
  id: string;
  numero: string;
  tipo: TipoInspecao;
  objeto: string;
  lote: string | null;
  local: string | null;
  quantidade: number | null;
  inspetor: string;
  data: string;
  modeloId: string | null;
  modeloNome: string | null;
  observacoes: string | null;
  /** Plano de amostragem, quando a inspeção é por amostra (NBR 5426). */
  plano: PlanoDeAmostragem | null;
  /** Defeituosos na amostra, registrados ao concluir. */
  defeituosos: number | null;
  fornecedorId: string | null;
  fornecedorNome: string | null;
  status: StatusInspecao;
  itens: ItemDaInspecao[];
  respondidos: number;
  /** Quantos itens NOK. */
  naoConformes: number;
  concluidaEm: string | null;
  motivoCancelamento: string | null;
  criadoEm: string;
  versao: string;
}

export type InspecaoResumo = Pick<
  Inspecao,
  | 'id'
  | 'numero'
  | 'tipo'
  | 'objeto'
  | 'lote'
  | 'inspetor'
  | 'data'
  | 'status'
  | 'respondidos'
  | 'naoConformes'
  | 'fornecedorNome'
> & { totalDeItens: number };

/** Recebimento de um fornecedor nos últimos 12 meses: base para a nota de qualidade na avaliação. */
export interface RecebimentoDoFornecedor {
  fornecedorId: string;
  inspecoes: number;
  aprovadas: number;
  reprovadas: number;
  /** Aprovadas ÷ concluídas, em %; null sem inspeção concluída. */
  indiceDeAprovacao: number | null;
  ultimas: Pick<
    Inspecao,
    'id' | 'numero' | 'data' | 'objeto' | 'lote' | 'status'
  >[];
}

export const filtroDoFornecedorSchema = z.object({
  fornecedorId: z.uuid('Fornecedor inválido.'),
});

export interface ResumoInspecoes {
  emAndamento: number;
  /** Reprovadas nos últimos 30 dias. */
  reprovadas30Dias: number;
  /** Aprovadas ÷ concluídas (aprovadas + reprovadas) nos últimos 30 dias, 0–100; null sem inspeção concluída. */
  taxaDeAprovacao30Dias: number | null;
}
