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
