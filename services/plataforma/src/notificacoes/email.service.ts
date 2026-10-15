import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import type { EmailParaEnviar } from '@davinci/types';
import { montarEmail } from './layout.js';

/**
 * Envio por SMTP (qualquer provedor em produção: Amazon SES, Brevo, Resend, Google Workspace…).
 * Em desenvolvimento, o Mailpit (compose) captura tudo: http://localhost:5554.
 * .env: SMTP_HOST, SMTP_PORTA, SMTP_SEGURO (true = TLS direto), SMTP_USUARIO, SMTP_SENHA, EMAIL_REMETENTE.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger('E-mail');
  private transporte?: Transporter;

  constructor(transporte?: Transporter) {
    this.transporte = transporte;
  }

  private obterTransporte(): Transporter {
    this.transporte ??= nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'localhost',
      port: Number(process.env.SMTP_PORTA ?? 5553),
      secure: process.env.SMTP_SEGURO === 'true',
      auth: process.env.SMTP_USUARIO
        ? { user: process.env.SMTP_USUARIO, pass: process.env.SMTP_SENHA ?? '' }
        : undefined,
      connectionTimeout: 10_000,
    });
    return this.transporte;
  }

  /** Nunca lança: falha de envio fica no log (quem pediu já respondeu ao usuário). */
  async enviar(e: EmailParaEnviar): Promise<boolean> {
    if (!e?.para || !/^[^\s@]+@[^\s@]+$/.test(e.para) || !e.assunto) {
      this.logger.warn('E-mail descartado: destinatário ou assunto inválido.');
      return false;
    }
    const { html, texto } = montarEmail(e);
    try {
      await this.obterTransporte().sendMail({
        from:
          process.env.EMAIL_REMETENTE ??
          'DaVinci Qualidade <nao-responda@davinci.local>',
        to: e.para,
        subject: e.assunto,
        text: texto,
        html,
      });
      this.logger.log(
        `E-mail "${e.assunto}" enviado para ${e.para.replace(/^(.).*@/, '$1***@')}.`,
      );
      return true;
    } catch (erro) {
      this.logger.error(
        `Falha ao enviar "${e.assunto}": ${(erro as Error).message}`,
      );
      return false;
    }
  }
}
