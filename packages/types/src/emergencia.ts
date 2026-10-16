/**
 * Emergência e equipamentos (serviço seguranca): equipamentos com inspeção, recarga e teste hidrostático
 * (NR-23, NBR 12962, NBR 12779), brigada de emergência (NBR 14276) e plano de emergência. Ordem de serviço de
 * segurança por função (NR-1, 1.4.1 c). docs/05-modulos/emergencia.md
 */
import { z } from 'zod';
import { chaves, data, opcional, texto, textoOpcional } from './validadores.js';

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);
const dias = z.coerce.number().int().min(1, 'Ao menos 1 dia.').max(3650);

/** Categorias com a periodicidade padrão: inspeção (dias), recarga (meses) e teste hidrostático (meses). */
export const CATEGORIAS_DE_EQUIPAMENTO = {
  extintor: {
    nome: 'Extintor',
    inspecaoDias: 30,
    recargaMeses: 12,
    testeMeses: 60,
  },
  hidrante: {
    nome: 'Hidrante',
    inspecaoDias: 30,
    recargaMeses: null,
    testeMeses: null,
  },
  mangueira: {
    nome: 'Mangueira de incêndio',
    inspecaoDias: 180,
    recargaMeses: null,
    testeMeses: 12,
  },
  alarme: {
    nome: 'Alarme de incêndio',
    inspecaoDias: 30,
    recargaMeses: null,
    testeMeses: null,
  },
  iluminacao: {
    nome: 'Iluminação de emergência',
    inspecaoDias: 30,
    recargaMeses: null,
    testeMeses: null,
  },
  lava_olhos: {
    nome: 'Chuveiro e lava-olhos',
    inspecaoDias: 7,
    recargaMeses: null,
    testeMeses: null,
  },
  porta_corta_fogo: {
    nome: 'Porta corta-fogo',
    inspecaoDias: 30,
    recargaMeses: null,
    testeMeses: null,
  },
  maquina_nr12: {
    nome: 'Máquina (NR-12)',
    inspecaoDias: 30,
    recargaMeses: null,
    testeMeses: null,
  },
  outro: {
    nome: 'Outro',
    inspecaoDias: 30,
    recargaMeses: null,
    testeMeses: null,
  },
} as const;
export type CategoriaDeEquipamento = keyof typeof CATEGORIAS_DE_EQUIPAMENTO;
export const NOMES_DAS_CATEGORIAS = Object.fromEntries(
  Object.entries(CATEGORIAS_DE_EQUIPAMENTO).map(([k, c]) => [k, c.nome]),
) as Record<CategoriaDeEquipamento, string>;

const camposDoEquipamento = {
  categoria: z.enum(chaves(NOMES_DAS_CATEGORIAS), {
    error: 'Escolha a categoria.',
  }),
  identificacao: texto('a identificação (número, patrimônio)', 60, 1),
  local: texto('o local', 150, 2),
  detalhes: textoOpcional(300),
  inspecaoDias: opcional(dias),
  ultimaInspecao: opcional(data('a última inspeção')),
  ultimaRecarga: opcional(data('a última recarga')),
  ultimoTeste: opcional(data('o último teste hidrostático')),
};
export const novoEquipamentoSchema = z.object(camposDoEquipamento);
export type NovoEquipamento = z.input<typeof novoEquipamentoSchema>;
export const atualizarEquipamentoSchema = z.object({
  ...camposDoEquipamento,
  versao,
});
export const situacaoDoEquipamentoSchema = z.object({
  versao,
  ativo: z.boolean(),
});

export const RESULTADOS_DA_INSPECAO = {
  conforme: 'Conforme',
  nao_conforme: 'Não conforme',
} as const;
export const inspecionarEquipamentoSchema = z
  .object({
    versao,
    data: data('a data da inspeção'),
    resultado: z.enum(chaves(RESULTADOS_DA_INSPECAO), {
      error: 'Escolha o resultado.',
    }),
    responsavel: texto('quem inspecionou', 120, 3),
    observacao: textoOpcional(500),
    /** Junto da inspeção: recarga e teste feitos nesta data. */
    recarregado: z.boolean().default(false),
    testado: z.boolean().default(false),
  })
  .refine((i) => i.resultado === 'conforme' || i.observacao, {
    path: ['observacao'],
    message: 'Descreva o que está fora do conforme.',
  });

export interface InspecaoDeEquipamento {
  data: string;
  resultado: keyof typeof RESULTADOS_DA_INSPECAO;
  responsavel: string;
  observacao: string | null;
}

export interface Equipamento {
  id: string;
  categoria: CategoriaDeEquipamento;
  identificacao: string;
  local: string;
  detalhes: string | null;
  inspecaoDias: number;
  ultimaInspecao: string | null;
  proximaInspecao: string | null;
  ultimaRecarga: string | null;
  proximaRecarga: string | null;
  ultimoTeste: string | null;
  proximoTeste: string | null;
  /** O que vence primeiro e quando. */
  proximoVencimento: { o: string; data: string } | null;
  vencido: boolean;
  /** Última inspeção não conforme: fora de condição até nova inspeção conforme. */
  pendencia: string | null;
  inspecoes: InspecaoDeEquipamento[];
  ativo: boolean;
  versao: string;
}

// ---------------------------------------------------------------- brigada de emergência

export const PAPEIS_NA_BRIGADA = {
  coordenador: 'Coordenador',
  lider: 'Líder',
  brigadista: 'Brigadista',
} as const;
/** Reciclagem do treinamento de brigada (NBR 14276): 12 meses. */
export const MESES_DE_VALIDADE_DA_BRIGADA = 12;

export const novoBrigadistaSchema = z.object({
  funcionarioId: z.uuid('Escolha o funcionário.'),
  papel: z.enum(chaves(PAPEIS_NA_BRIGADA), { error: 'Escolha o papel.' }),
  turno: textoOpcional(40),
  treinadoEm: data('a data do treinamento de brigada'),
});
export const atualizarBrigadistaSchema = z.object({
  versao,
  papel: z.enum(chaves(PAPEIS_NA_BRIGADA), { error: 'Escolha o papel.' }),
  turno: textoOpcional(40),
  treinadoEm: data('a data do treinamento de brigada'),
});

export interface Brigadista {
  id: string;
  funcionarioId: string;
  nome: string;
  setor: string;
  papel: keyof typeof PAPEIS_NA_BRIGADA;
  turno: string | null;
  treinadoEm: string;
  validade: string;
  vencido: boolean;
  versao: string;
}

// ---------------------------------------------------------------- plano de emergência

export const planoDeEmergenciaSchema = z.object({
  versao: z.string().default(''),
  cenarios: texto('os cenários de emergência', 4000, 10),
  alarme: textoOpcional(1000),
  rotasDeFuga: texto('as rotas de fuga', 2000, 5),
  pontoDeEncontro: texto('o ponto de encontro', 300, 3),
  procedimentos: texto('os procedimentos', 4000, 10),
  contatos: z
    .array(
      z.object({
        nome: texto('o nome do contato', 120, 2),
        telefone: texto('o telefone', 30, 3),
      }),
    )
    .max(30)
    .default([]),
});
export type PlanoDeEmergenciaEntrada = z.input<typeof planoDeEmergenciaSchema>;

export interface PlanoDeEmergencia {
  cenarios: string;
  alarme: string | null;
  rotasDeFuga: string;
  pontoDeEncontro: string;
  procedimentos: string;
  contatos: { nome: string; telefone: string }[];
  revisadoEm: string;
  versao: string;
}

// ---------------------------------------------------------------- ordem de serviço de segurança (NR-1)

export const ordemDeServicoSstSchema = z.object({
  funcaoId: z.uuid('Função inválida.'),
  versao: z.string().default(''),
  atividades: texto('as atividades da função', 2000, 5),
  procedimentos: texto('os procedimentos seguros', 4000, 5),
  proibicoes: texto('o que é proibido', 2000, 5),
  emergencia: textoOpcional(2000),
});

export interface OrdemDeServicoSst {
  funcaoId: string;
  atividades: string;
  procedimentos: string;
  proibicoes: string;
  emergencia: string | null;
  /** Riscos do PGR ligados à função. */
  riscos: {
    id: string;
    perigo: string;
    danos: string;
    controles: string | null;
  }[];
  revisadaEm: string;
  versao: string;
}

/** Riscos do PGR a que a função se expõe (base do S-2240 e da ordem de serviço). */
export const definirRiscosDaFuncaoSchema = z.object({
  funcaoId: z.uuid('Função inválida.'),
  riscoIds: z.array(z.uuid('Risco inválido.')).max(60).default([]),
});
