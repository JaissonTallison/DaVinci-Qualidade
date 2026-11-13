/**
 * Modelagem de processos (serviço qualidade) — fase 1: cadastro e governança.
 * Fluxo: em elaboração → em revisão → aprovado → publicado → obsoleto (ou cancelado).
 * O diagrama (nós/conexões) entra na fase 2. docs/05-modulos/processos.md
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

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);

export const STATUS_PROCESSO = {
  em_elaboracao: 'Em elaboração',
  em_revisao: 'Em revisão',
  aprovado: 'Aprovado',
  publicado: 'Publicado',
  obsoleto: 'Obsoleto',
  cancelado: 'Cancelado',
} as const;
export type StatusProcesso = keyof typeof STATUS_PROCESSO;

const camposProcesso = {
  codigo: texto('o código', 30, 2),
  nome: texto('o nome do processo', 150, 3),
  descricao: textoOpcional(2000),
  objetivo: textoOpcional(2000),
  escopo: textoOpcional(2000),
  unidade: textoOpcional(120),
  departamento: textoOpcional(120),
  gestor: textoOpcional(120),
  elaboradoPor: texto('o elaborador', 120, 3),
  normas: textoOpcional(300),
};
export const novoProcessoSchema = z.object(camposProcesso);
export type NovoProcesso = z.input<typeof novoProcessoSchema>;
export const atualizarProcessoSchema = z.object({ ...camposProcesso, versao });
export const enviarRevisaoProcessoSchema = z.object({ versao });
export const aprovarProcessoSchema = z.object({
  versao,
  dataProximaRevisao: opcional(data('a próxima revisão')),
  parecer: textoOpcional(500),
});

/** Ações registradas na trilha de auditoria do processo (fase 5). */
export const ACOES_PROCESSO = {
  criado: 'Criado',
  enviado_revisao: 'Enviado para revisão',
  aprovado: 'Aprovado',
  publicado: 'Publicado',
  nova_revisao: 'Nova revisão aberta',
  obsoleto: 'Tornado obsoleto',
  cancelado: 'Cancelado',
} as const;
export type AcaoProcesso = keyof typeof ACOES_PROCESSO;

export interface EventoDoProcesso {
  id: string;
  acao: AcaoProcesso;
  usuarioNome: string | null;
  comentario: string | null;
  criadoEm: string;
}
export const publicarProcessoSchema = z.object({ versao });
export const novaRevisaoProcessoSchema = z.object({
  versao,
  oQueMudou: texto('o que muda nesta revisão', 500, 5),
});
export const encerrarProcessoSchema = z.object({
  versao,
  motivo: texto('o motivo', 500, 5),
});
export const cancelarProcessoSchema = z.object({
  versao,
  motivo: texto('o motivo', 500, 5),
});

// ---- Diagrama (fase 2: editor React Flow). Conteúdo nativo: nós e conexões. ----
const noDoDiagrama = z
  .object({
    id: z.string(),
    position: z.object({ x: z.number(), y: z.number() }),
  })
  .catchall(z.unknown());
const arestaDoDiagrama = z
  .object({ id: z.string(), source: z.string(), target: z.string() })
  .catchall(z.unknown());
export const salvarDiagramaProcessoSchema = z.object({
  versao,
  conteudo: z.object({
    nodes: z.array(noDoDiagrama).max(1000, 'Diagrama grande demais.'),
    edges: z.array(arestaDoDiagrama).max(2000, 'Diagrama grande demais.'),
  }),
});
// ---- Vínculos: registros de outros módulos ligados ao processo (fase 6). ----
export const TIPOS_VINCULO = {
  nao_conformidade: 'Não conformidade',
  plano_de_acao: 'Plano de ação',
  inspecao: 'Inspeção',
  documento: 'Documento controlado',
  risco: 'Risco / oportunidade',
} as const;
export type TipoVinculo = keyof typeof TIPOS_VINCULO;

export const novoVinculoSchema = z.object({
  tipo: z.enum(chaves(TIPOS_VINCULO), { error: 'Escolha o tipo de registro.' }),
  registroId: z.uuid('Registro inválido.'),
  rotulo: texto('o registro', 200, 1),
});
export const removerVinculoSchema = z.object({
  vinculoId: z.uuid('Vínculo inválido.'),
});
export interface VinculoDoProcesso {
  id: string;
  tipo: TipoVinculo;
  registroId: string;
  rotulo: string;
}

/** Geração de diagrama a partir de texto por IA (fase 4). */
export const gerarIaDiagramaSchema = z.object({
  texto: texto('o texto do procedimento', 20000, 10),
});

export interface DiagramaProcesso {
  nodes: Array<{
    id: string;
    position: { x: number; y: number };
    [k: string]: unknown;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    [k: string]: unknown;
  }>;
}
export const filtroProcessosSchema = z.object({
  status: enumOpcional(STATUS_PROCESSO, 'Status desconhecido.'),
});

export interface RevisaoDoProcesso {
  revisao: number;
  oQueMudou: string;
  elaboradoPor: string;
  aprovadoPorNome: string | null;
  aprovadoEm: string;
}
export interface Processo {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  objetivo: string | null;
  escopo: string | null;
  unidade: string | null;
  departamento: string | null;
  gestor: string | null;
  elaboradoPor: string;
  normas: string | null;
  status: StatusProcesso;
  revisaoAtual: number;
  oQueMudouPendente: string | null;
  aprovadoPorNome: string | null;
  aprovadoEm: string | null;
  publicadoEm: string | null;
  dataProximaRevisao: string | null;
  motivoEncerramento: string | null;
  /** Conteúdo do diagrama (nós/conexões); null enquanto não desenhado. */
  conteudo: DiagramaProcesso | null;
  /** Publicado com a próxima revisão vencida. */
  revisaoVencida: boolean;
  /** Quem elaborou não aprova a própria revisão (segregação). */
  criadoPorMim: boolean;
  versao: string;
}
export interface ProcessoComRevisoes extends Processo {
  /** Mais recentes primeiro. */
  revisoes: RevisaoDoProcesso[];
  /** Registros de outros módulos ligados a este processo. */
  vinculos: VinculoDoProcesso[];
  /** Trilha de auditoria (mais recentes primeiro). */
  eventos: EventoDoProcesso[];
}
