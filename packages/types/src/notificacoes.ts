import type { ModuloDaBusca } from './busca.js';

/**
 * Notificações (serviço Plataforma). Quem envia dá o CONTEÚDO; a Plataforma aplica o
 * layout padrão do DaVinci (HTML + texto puro) e entrega pelo SMTP configurado.
 */
export interface EmailParaEnviar {
  para: string;
  assunto: string;
  /** Título dentro do e-mail. */
  titulo: string;
  /** Parágrafos em texto simples (sem HTML: a Plataforma escapa). */
  paragrafos: string[];
  /** Botão principal (ex.: "Criar nova senha"). */
  botao?: { texto: string; url: string };
  /** Linha final menor (ex.: "Se não foi você, ignore este e-mail."). */
  rodape?: string;
}

// ---------------------------------------------------------------- feed de notificações (central)

export const TIPOS_DE_NOTIFICACAO = {
  alerta: 'Alerta',
  prazo: 'Prazo',
  evento: 'Evento',
  mencao: 'Menção',
} as const;
export type TipoDeNotificacao = keyof typeof TIPOS_DE_NOTIFICACAO;

/** Uma notificação do centro de avisos (sino da barra superior). */
export interface Notificacao {
  id: string;
  tipo: TipoDeNotificacao;
  titulo: string;
  descricao: string | null;
  /** Módulo de origem, para o rótulo e o ícone. */
  modulo: ModuloDaBusca | null;
  /** Para onde leva ao clicar. */
  href: string | null;
  lida: boolean;
  criadaEm: string;
}

/** Abas do centro: não lidas, todas, menções. */
export type FiltroDeNotificacoes = 'nao-lidas' | 'todas' | 'mencoes';
export const FILTROS_DE_NOTIFICACOES: FiltroDeNotificacoes[] = [
  'nao-lidas',
  'todas',
  'mencoes',
];

export interface ResumoDeNotificacoes {
  itens: Notificacao[];
  /** Total de não lidas (para o contador do sino). */
  naoLidas: number;
}

/** O que um módulo emite para criar uma notificação (evento `notificacoes.criar`). */
export interface NovaNotificacao {
  empresaId: string;
  /** Destinatária. Uma notificação é sempre de um usuário (o estado de leitura é dele). */
  usuarioId: string;
  tipo: TipoDeNotificacao;
  titulo: string;
  descricao?: string | null;
  modulo?: ModuloDaBusca | null;
  href?: string | null;
  /** É uma menção à pessoa? (entra na aba Menções). */
  mencao?: boolean;
}
