import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import type { EmailParaEnviar } from '@davinci/types';
import { montarEmail } from './layout.js';

const REMETENTE_PADRAO = 'DaVinci Qualidade <nao-responda@davinci.local>';
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

/** "DaVinci Qualidade <nao-responda@davinci.local>" → { nome, email }. */
function lerRemetente(valor: string): { nome: string; email: string } {
  const m = valor.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  if (m) return { nome: m[1] || 'DaVinci Qualidade', email: m[2]! };
  return { nome: 'DaVinci Qualidade', email: valor.trim() };
}

/**
 * Envio de e-mail. Em produção, pelo provedor HTTP (Brevo) quando `BREVO_API_KEY` está definida:
 * o Railway bloqueia SMTP de saída, por isso o SMTP cai calado lá (ERR-02). Sem a chave, usa SMTP —
 * em desenvolvimento o Mailpit (compose) captura tudo: http://localhost:5554.
 * .env Brevo: BREVO_API_KEY, EMAIL_REMETENTE (o remetente precisa estar verificado no Brevo).
 * .env SMTP: SMTP_HOST, SMTP_PORTA, SMTP_SEGURO (true = TLS direto), SMTP_USUARIO, SMTP_SENHA, EMAIL_REMETENTE.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger('E-mail');
  private transporte?: Transporter;
  private avisouSemProvedor = false;

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
    this.avisarSeSemProvedor();
    const { html, texto } = montarEmail(e);
    return process.env.BREVO_API_KEY
      ? this.enviarPorBrevo(e, html, texto)
      : this.enviarPorSmtp(e, html, texto);
  }

  /** Alerta uma vez, no primeiro envio, se em produção não há provedor de e-mail configurado. */
  private avisarSeSemProvedor(): void {
    if (this.avisouSemProvedor) return;
    this.avisouSemProvedor = true;
    const semBrevo = !process.env.BREVO_API_KEY;
    const semSmtp = !process.env.SMTP_HOST;
    if (process.env.NODE_ENV === 'production' && semBrevo && semSmtp)
      this.logger.error(
        'Nenhum provedor de e-mail configurado (defina BREVO_API_KEY ou SMTP_HOST): ' +
          'recuperação de senha e avisos não serão entregues.',
      );
  }

  private async enviarPorBrevo(
    e: EmailParaEnviar,
    html: string,
    texto: string,
  ): Promise<boolean> {
    const remetente = lerRemetente(
      process.env.EMAIL_REMETENTE ?? REMETENTE_PADRAO,
    );
    try {
      const resposta = await fetch(BREVO_URL, {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY!,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: remetente.nome, email: remetente.email },
          to: [{ email: e.para }],
          subject: e.assunto,
          htmlContent: html,
          textContent: texto,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!resposta.ok) {
        const corpo = await resposta.text().catch(() => '');
        this.logger.error(
          `Brevo recusou "${e.assunto}" (HTTP ${resposta.status}): ${corpo.slice(0, 300)}`,
        );
        return false;
      }
      this.logger.log(
        `E-mail "${e.assunto}" enviado por Brevo para ${this.oculto(e.para)}.`,
      );
      return true;
    } catch (erro) {
      this.logger.error(
        `Falha ao enviar "${e.assunto}" por Brevo: ${(erro as Error).message}`,
      );
      return false;
    }
  }

  private async enviarPorSmtp(
    e: EmailParaEnviar,
    html: string,
    texto: string,
  ): Promise<boolean> {
    try {
      await this.obterTransporte().sendMail({
        from: process.env.EMAIL_REMETENTE ?? REMETENTE_PADRAO,
        to: e.para,
        subject: e.assunto,
        text: texto,
        html,
      });
      this.logger.log(
        `E-mail "${e.assunto}" enviado para ${this.oculto(e.para)}.`,
      );
      return true;
    } catch (erro) {
      this.logger.error(
        `Falha ao enviar "${e.assunto}": ${(erro as Error).message}`,
      );
      return false;
    }
  }

  private oculto(email: string): string {
    return email.replace(/^(.).*@/, '$1***@');
  }
}
