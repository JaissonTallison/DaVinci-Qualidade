/**
 * Serviços (serviço servicos): ordens de serviço com avaliação, satisfação do cliente (NPS) e avaliação de
 * fornecedores. ISO 9001 8.5, 9.1.2 e 8.4. docs/05-modulos/servicos.md
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
import { GRAVIDADES_NC } from './nao-conformidades.js';

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);
const nota = (de: number, ate: number, rotulo: string) =>
  z.coerce
    .number({ error: `Informe ${rotulo}.` })
    .int(`Use um número inteiro.`)
    .min(de, `De ${de} a ${ate}.`)
    .max(ate, `De ${de} a ${ate}.`);

// ---------------------------------------------------------------- ordens de serviço

export const STATUS_OS = {
  aberta: 'Aberta',
  em_execucao: 'Em execução',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
} as const;
export type StatusOs = keyof typeof STATUS_OS;

export const novaOsSchema = z
  .object({
    clienteId: z.uuid('Escolha o cliente.'),
    titulo: texto('o título', 150, 5),
    descricao: texto('o que será feito', 2000, 10),
    responsavel: texto('o responsável', 120, 3),
    /** Com contrato e sem prazo, o prazo vem do SLA do contrato. */
    prazo: opcional(data('o prazo')),
    contratoId: opcional(z.uuid('Contrato inválido.')),
    /** Serviço do catálogo: copia o checklist de execução. */
    servicoId: opcional(z.uuid('Serviço inválido.')),
  })
  .refine((o) => o.prazo || o.contratoId, {
    path: ['prazo'],
    message: 'Informe o prazo.',
  });
export type NovaOs = z.input<typeof novaOsSchema>;
export const iniciarOsSchema = z.object({ versao });
export const concluirOsSchema = z.object({
  versao,
  relatorio: texto('o relatório do que foi feito', 2000, 10),
  /** Quem recebeu o serviço pelo cliente (aceite). */
  recebidoPor: textoOpcional(120),
});

export const STATUS_DO_PASSO = {
  pendente: 'Pendente',
  feito: 'Feito',
  nao_aplicavel: 'Não se aplica',
} as const;
export type StatusDoPasso = keyof typeof STATUS_DO_PASSO;

/** Execução da OS: checklist, horas por técnico e materiais. Grava a lista inteira enquanto a OS está em execução. */
export const registrarExecucaoSchema = z.object({
  versao,
  checklist: z
    .array(
      z.object({
        item: texto('o passo', 200, 2),
        status: z.enum(chaves(STATUS_DO_PASSO)).default('pendente'),
        observacao: z.string().trim().max(300).default(''),
      }),
    )
    .max(60)
    .default([]),
  apontamentos: z
    .array(
      z.object({
        data: data('a data do apontamento'),
        tecnico: texto('o técnico', 120, 2),
        horas: z.coerce
          .number({ error: 'Informe as horas.' })
          .positive('Horas acima de zero.')
          .max(24, 'No máximo 24 horas por apontamento.'),
        descricao: z.string().trim().max(300).default(''),
      }),
    )
    .max(200)
    .default([]),
  materiais: z
    .array(
      z.object({
        descricao: texto('o material', 150, 2),
        quantidade: z.coerce
          .number({ error: 'Informe a quantidade.' })
          .positive('Quantidade acima de zero.'),
        unidade: z.string().trim().max(10).default('un'),
      }),
    )
    .max(200)
    .default([]),
});
export type RegistrarExecucao = z.input<typeof registrarExecucaoSchema>;
export const cancelarOsSchema = z.object({
  versao,
  motivo: texto('o motivo', 300, 10),
});
/** Avaliação do serviço pelo cliente, depois de concluída: uma só por OS. */
export const avaliarOsSchema = z.object({
  versao,
  nota: nota(1, 5, 'a nota de 1 a 5'),
  comentario: textoOpcional(500),
});
export const filtroOsSchema = z.object({
  status: enumOpcional(STATUS_OS, 'Status desconhecido.'),
  clienteId: opcional(z.uuid()),
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

export interface OrdemDeServico {
  id: string;
  numero: string;
  clienteId: string;
  clienteNome: string;
  titulo: string;
  descricao: string;
  responsavel: string;
  prazo: string;
  status: StatusOs;
  atrasada: boolean;
  iniciadaEm: string | null;
  concluidaEm: string | null;
  relatorio: string | null;
  motivoCancelamento: string | null;
  nota: number | null;
  comentario: string | null;
  contratoId: string | null;
  contratoNumero: string | null;
  servicoId: string | null;
  servicoNome: string | null;
  checklist: { item: string; status: StatusDoPasso; observacao: string }[];
  apontamentos: {
    data: string;
    tecnico: string;
    horas: number;
    descricao: string;
  }[];
  materiais: { descricao: string; quantidade: number; unidade: string }[];
  horasTotais: number;
  recebidoPor: string | null;
  /** Concluída até o prazo; null enquanto aberta ou cancelada. */
  noPrazo: boolean | null;
  versao: string;
}

// ---------------------------------------------------------------- NPS

/** 9–10 promotor, 7–8 neutro, 0–6 detrator. NPS = % promotores − % detratores. */
export function categoriaNps(nota: number): 'promotor' | 'neutro' | 'detrator' {
  return nota >= 9 ? 'promotor' : nota >= 7 ? 'neutro' : 'detrator';
}

export const registrarRespostaNpsSchema = z.object({
  clienteId: z.uuid('Escolha o cliente.'),
  data: data('a data da resposta'),
  nota: nota(0, 10, 'a nota de 0 a 10'),
  comentario: textoOpcional(1000),
  osId: opcional(z.uuid()),
});
export type RegistrarRespostaNps = z.input<typeof registrarRespostaNpsSchema>;
export const filtroNpsSchema = z.object({
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
});

export interface RespostaNps {
  id: string;
  clienteId: string;
  clienteNome: string;
  data: string;
  nota: number;
  categoria: 'promotor' | 'neutro' | 'detrator';
  comentario: string | null;
}

export interface ResultadoNps {
  respostas: RespostaNps[];
  promotores: number;
  neutros: number;
  detratores: number;
  /** null sem respostas. */
  nps: number | null;
}

// ---------------------------------------------------------------- avaliação de fornecedores

export const CRITERIOS_FORNECEDOR = {
  qualidade: 'Qualidade do produto ou serviço',
  prazo: 'Cumprimento de prazo',
  atendimento: 'Atendimento e comunicação',
  documentacao: 'Documentação (certificados, notas, laudos)',
} as const;
export type CriterioFornecedor = keyof typeof CRITERIOS_FORNECEDOR;

export const CLASSIFICACOES_FORNECEDOR = {
  aprovado: 'Aprovado',
  aprovado_com_restricao: 'Aprovado com restrição',
  reprovado: 'Reprovado',
} as const;
export type ClassificacaoFornecedor = keyof typeof CLASSIFICACOES_FORNECEDOR;

/** Média ≥ 4 aprovado (reavaliar em 12 meses); ≥ 3 com restrição (6 meses); abaixo, reprovado (3 meses). */
export function classificarFornecedor(media: number): {
  classificacao: ClassificacaoFornecedor;
  mesesAteReavaliar: number;
} {
  if (media >= 4) return { classificacao: 'aprovado', mesesAteReavaliar: 12 };
  if (media >= 3)
    return { classificacao: 'aprovado_com_restricao', mesesAteReavaliar: 6 };
  return { classificacao: 'reprovado', mesesAteReavaliar: 3 };
}

export const avaliarFornecedorSchema = z.object({
  fornecedorId: z.uuid('Escolha o fornecedor.'),
  data: data('a data da avaliação'),
  qualidade: nota(1, 5, 'a nota de qualidade'),
  prazo: nota(1, 5, 'a nota de prazo'),
  atendimento: nota(1, 5, 'a nota de atendimento'),
  documentacao: nota(1, 5, 'a nota de documentação'),
  observacao: textoOpcional(1000),
});
export type AvaliarFornecedor = z.input<typeof avaliarFornecedorSchema>;

export interface AvaliacaoDeFornecedor {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  data: string;
  notas: Record<CriterioFornecedor, number>;
  media: number;
  classificacao: ClassificacaoFornecedor;
  proximaAvaliacao: string;
  /** Só na última avaliação de cada fornecedor. */
  vigente: boolean;
  observacao: string | null;
}

export interface ResumoServicos {
  osAbertas: number;
  osAtrasadas: number;
  /** NPS dos últimos 12 meses; null sem respostas. */
  nps12Meses: number | null;
  fornecedoresReprovados: number;
  avaliacoesVencidas: number;
}

// ---------------------------------------------------------------- catálogo de serviços

const passos = z
  .array(texto('o passo', 200, 2))
  .max(60, 'No máximo 60 passos.')
  .default([]);
const camposDoServico = {
  nome: texto('o nome do serviço', 120, 3),
  descricao: textoOpcional(1000),
  horasPadrao: opcional(
    z.coerce.number().positive('Horas acima de zero.').max(1000),
  ),
  checklist: passos,
};
export const novoServicoDoCatalogoSchema = z.object(camposDoServico);
export type NovoServicoDoCatalogo = z.input<typeof novoServicoDoCatalogoSchema>;
export const atualizarServicoDoCatalogoSchema = z.object({
  ...camposDoServico,
  versao,
});
export const situacaoDoServicoSchema = z.object({ versao, ativo: z.boolean() });

export interface ServicoDoCatalogo {
  id: string;
  nome: string;
  descricao: string | null;
  horasPadrao: number | null;
  checklist: string[];
  ativo: boolean;
  versao: string;
}

// ---------------------------------------------------------------- contratos e SLA

export const SITUACOES_DO_CONTRATO = {
  vigente: 'Vigente',
  vence_em_breve: 'Vence em até 60 dias',
  vencido: 'Vencido',
  encerrado: 'Encerrado',
} as const;
export type SituacaoDoContrato = keyof typeof SITUACOES_DO_CONTRATO;
export const DIAS_DE_AVISO_DO_CONTRATO = 60;

const camposDoContrato = {
  objeto: texto('o objeto do contrato', 300, 5),
  inicio: data('o início da vigência'),
  fim: data('o fim da vigência'),
  /** SLA: dias corridos para concluir cada OS do contrato. */
  prazoAtendimentoDias: z.coerce
    .number({ error: 'Informe o prazo de atendimento em dias.' })
    .int()
    .min(1, 'Ao menos 1 dia.')
    .max(365),
  /** Meta: % das OS concluídas no prazo. */
  metaNoPrazo: z.coerce
    .number()
    .int()
    .min(50, 'Meta de 50% a 100%.')
    .max(100, 'Meta de 50% a 100%.')
    .default(95),
  valorMensal: opcional(
    z
      .string()
      .trim()
      .regex(
        /^\d{1,13}(\.\d{1,2})?$/,
        'Informe o valor em reais (ex.: 1250.00).',
      ),
  ),
  observacoes: textoOpcional(1000),
};
const fimDepois = (c: { inicio: string; fim: string }) => c.fim >= c.inicio;
const ERRO_FIM = {
  path: ['fim'],
  message: 'O fim não pode ser anterior ao início.',
};
export const novoContratoSchema = z
  .object({ clienteId: z.uuid('Escolha o cliente.'), ...camposDoContrato })
  .refine(fimDepois, ERRO_FIM);
export type NovoContrato = z.input<typeof novoContratoSchema>;
export const atualizarContratoSchema = z
  .object({ ...camposDoContrato, versao })
  .refine(fimDepois, ERRO_FIM);
export const encerrarContratoSchema = z.object({
  versao,
  motivo: texto('o motivo do encerramento', 300, 5),
});

export interface IndicadorDoSla {
  /** OS do contrato concluídas nos últimos 12 meses. */
  concluidas: number;
  noPrazo: number;
  /** % no prazo; null sem OS concluída. */
  percentual: number | null;
  atendeMeta: boolean | null;
}

export interface Contrato {
  id: string;
  numero: string;
  clienteId: string;
  clienteNome: string;
  objeto: string;
  inicio: string;
  fim: string;
  prazoAtendimentoDias: number;
  metaNoPrazo: number;
  valorMensal: string | null;
  observacoes: string | null;
  situacao: SituacaoDoContrato;
  motivoEncerramento: string | null;
  sla: IndicadorDoSla;
  osAbertas: number;
  versao: string;
}

/** Cumprimento do SLA: concluídas no prazo ÷ concluídas. */
export function indicadorDoSla(
  concluidas: { noPrazo: boolean }[],
  meta: number,
): IndicadorDoSla {
  const noPrazo = concluidas.filter((c) => c.noPrazo).length;
  const percentual = concluidas.length
    ? Math.round((noPrazo / concluidas.length) * 100)
    : null;
  return {
    concluidas: concluidas.length,
    noPrazo,
    percentual,
    atendeMeta: percentual === null ? null : percentual >= meta,
  };
}

// ---------------------------------------------------------------- reclamações de clientes

export const CANAIS_DE_RECLAMACAO = {
  telefone: 'Telefone',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  presencial: 'Presencial',
  site: 'Site ou formulário',
  rede_social: 'Rede social',
  outro: 'Outro',
} as const;

export const STATUS_DA_RECLAMACAO = {
  aberta: 'Aberta',
  analisada: 'Analisada',
  respondida: 'Respondida',
  encerrada: 'Encerrada',
} as const;
export type StatusDaReclamacao = keyof typeof STATUS_DA_RECLAMACAO;

/** Prazo padrão para responder ao cliente, em dias corridos (ISO 10002: resposta pronta e comunicada). */
export const DIAS_PARA_RESPONDER = 7;

export const novaReclamacaoSchema = z.object({
  clienteId: z.uuid('Escolha o cliente.'),
  canal: z.enum(chaves(CANAIS_DE_RECLAMACAO), { error: 'Escolha o canal.' }),
  recebidaEm: data('a data de recebimento'),
  descricao: texto('o que o cliente relatou', 2000, 10),
  produto: textoOpcional(150),
  osId: opcional(z.uuid('OS inválida.')),
  prazoResposta: opcional(data('o prazo de resposta')),
});
export type NovaReclamacao = z.input<typeof novaReclamacaoSchema>;

/** Procedente pode abrir a NC na Qualidade (origem Reclamação de cliente). */
export const analisarReclamacaoSchema = z
  .object({
    versao,
    procedente: z.boolean({ error: 'Diga se a reclamação procede.' }),
    analise: texto('a análise', 2000, 10),
    abrirNc: z.boolean().default(false),
    responsavelNc: textoOpcional(120),
    gravidadeNc: enumOpcional(GRAVIDADES_NC, 'Gravidade desconhecida.'),
  })
  .refine((a) => !a.abrirNc || (a.procedente && a.responsavelNc), {
    path: ['responsavelNc'],
    message:
      'Para abrir a NC, a reclamação precisa proceder e ter um responsável.',
  });
export const responderReclamacaoSchema = z.object({
  versao,
  resposta: texto('a resposta dada ao cliente', 2000, 10),
});
export const encerrarReclamacaoSchema = z.object({
  versao,
  clienteSatisfeito: z.boolean({
    error: 'Diga se o cliente ficou satisfeito.',
  }),
  observacao: textoOpcional(500),
});
export const filtroReclamacoesSchema = z.object({
  status: enumOpcional(STATUS_DA_RECLAMACAO, 'Status desconhecido.'),
  clienteId: opcional(z.uuid()),
});

export interface Reclamacao {
  id: string;
  numero: string;
  clienteId: string;
  clienteNome: string;
  canal: keyof typeof CANAIS_DE_RECLAMACAO;
  recebidaEm: string;
  descricao: string;
  produto: string | null;
  osId: string | null;
  osNumero: string | null;
  prazoResposta: string;
  /** Sem resposta e prazo passado. */
  atrasada: boolean;
  status: StatusDaReclamacao;
  procedente: boolean | null;
  analise: string | null;
  ncId: string | null;
  ncNumero: string | null;
  resposta: string | null;
  respondidaEm: string | null;
  clienteSatisfeito: boolean | null;
  observacaoEncerramento: string | null;
  versao: string;
}

export interface ResumoReclamacoes {
  abertas: number;
  atrasadas: number;
  /** % procedentes entre as analisadas nos últimos 12 meses. */
  procedentes: number | null;
  /** Dias, em média, do recebimento à resposta (12 meses). */
  tempoMedioResposta: number | null;
  /** % de clientes satisfeitos com a solução, entre as encerradas. */
  satisfacao: number | null;
}

// ---------------------------------------------------------------- pesquisa por link

/** Convite de pesquisa: o cliente responde sem login por um link com token, que vale 30 dias e uma resposta. */
export const DIAS_DE_VALIDADE_DO_CONVITE = 30;
export const criarConviteSchema = z.object({
  clienteId: z.uuid('Escolha o cliente.'),
  osId: opcional(z.uuid('OS inválida.')),
});
export const tokenDaPesquisaSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{32,64}$/, 'Link inválido.'),
});
export const responderPesquisaSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{32,64}$/, 'Link inválido.'),
  nota: nota(0, 10, 'a nota de 0 a 10'),
  notaOs: opcional(nota(1, 5, 'a nota do serviço de 1 a 5')),
  comentario: textoOpcional(1000),
});

export interface ConviteDePesquisa {
  id: string;
  token: string;
  clienteId: string;
  clienteNome: string;
  osId: string | null;
  osNumero: string | null;
  criadoEm: string;
  expiraEm: string;
  respondidoEm: string | null;
}

/** O que a página pública mostra: nada além do necessário para responder. */
export interface PesquisaPublica {
  clienteNome: string;
  osNumero: string | null;
  osTitulo: string | null;
  situacao: 'aberta' | 'respondida' | 'expirada';
}
