import nodemailer from 'nodemailer';
import { EmailService } from './email.service.js';
import { escapar, montarEmail } from './layout.js';

const base = {
  para: 'ana@alfa.com.br',
  assunto: 'Criar nova senha',
  titulo: 'Criar nova senha',
  paragrafos: ['Olá, Ana.'],
};

describe('layout do e-mail', () => {
  it('escapa todo texto (ninguém injeta HTML pelo nome, por exemplo)', () => {
    const { html } = montarEmail({
      ...base,
      paragrafos: ['<script>alert(1)</script> & "x"'],
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain(
      '&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;x&quot;',
    );
    expect(escapar("O'Brien")).toBe('O&#39;Brien');
  });

  it('botão só com http(s); a versão em texto puro traz o link inteiro', () => {
    expect(
      montarEmail({
        ...base,
        botao: { texto: 'Abrir', url: 'javascript:alert(1)' },
      }).html,
    ).not.toContain('javascript:alert(1)"');
    const r = montarEmail({
      ...base,
      botao: {
        texto: 'Criar nova senha',
        url: 'http://localhost:3170/redefinir-senha?token=abc',
      },
      rodape: 'Se não foi você, ignore.',
    });
    expect(r.html).toContain(
      'href="http://localhost:3170/redefinir-senha?token=abc"',
    );
    expect(r.texto).toContain(
      'Criar nova senha: http://localhost:3170/redefinir-senha?token=abc',
    );
    expect(r.texto).toContain('Se não foi você, ignore.');
  });
});

describe('envio', () => {
  it('monta remetente, assunto, texto e HTML; falha de SMTP não derruba (fica no log)', async () => {
    const transporte = nodemailer.createTransport({ jsonTransport: true });
    const espia = vi.spyOn(transporte, 'sendMail');
    const servico = new EmailService(transporte);
    expect(await servico.enviar(base)).toBe(true);
    expect(espia.mock.calls[0]![0]).toMatchObject({
      to: 'ana@alfa.com.br',
      subject: 'Criar nova senha',
      from: expect.stringContaining('DaVinci Qualidade'),
    });

    const quebrado = new EmailService({
      sendMail: () => Promise.reject(new Error('SMTP fora')),
    } as never);
    expect(await quebrado.enviar(base)).toBe(false);
    expect(await servico.enviar({ ...base, para: 'sem-arroba' })).toBe(false);
  });
});
