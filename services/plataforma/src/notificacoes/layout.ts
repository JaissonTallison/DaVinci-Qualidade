import type { EmailParaEnviar } from '@davinci/types';

/**
 * Layout padrão dos e-mails do DaVinci: sóbrio, legível em qualquer cliente de e-mail
 * (tabelas e estilos inline; e-mail não aceita CSS externo nem variáveis). Cores da marca (docs/04-design/cores.md).
 */
const COR = {
  texto: '#1c2430',
  suave: '#5b6675',
  borda: '#d9dee5',
  fundo: '#f4f6f9',
  marca: '#0b3a66',
  botaoTexto: '#ffffff',
};

export function escapar(texto: string): string {
  return texto.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );
}

/** Só links http(s) no botão (nada de javascript: ou data:). */
const urlSegura = (url: string) => (/^https?:\/\//i.test(url) ? url : '#');

export function montarEmail(e: EmailParaEnviar): {
  html: string;
  texto: string;
} {
  const paragrafos = e.paragrafos
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:${COR.texto}">${escapar(p)}</p>`,
    )
    .join('');
  const botao = e.botao
    ? `<p style="margin:24px 0"><a href="${escapar(urlSegura(e.botao.url))}" style="display:inline-block;background:${COR.marca};color:${COR.botaoTexto};text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:6px">${escapar(e.botao.texto)}</a></p>
       <p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:${COR.suave}">Se o botão não funcionar, copie este endereço no navegador:<br><span style="word-break:break-all">${escapar(e.botao.url)}</span></p>`
    : '';
  const rodape = e.rodape
    ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:${COR.suave}">${escapar(e.rodape)}</p>`
    : '';
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapar(e.assunto)}</title></head>
<body style="margin:0;padding:0;background:${COR.fundo};font-family:'IBM Plex Sans',Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COR.fundo};padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${COR.borda};border-radius:8px">
<tr><td style="padding:20px 28px;border-bottom:1px solid ${COR.borda};font-size:16px;font-weight:700;color:${COR.marca}">DaVinci Qualidade</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:${COR.texto}">${escapar(e.titulo)}</h1>
${paragrafos}${botao}${rodape}
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid ${COR.borda};font-size:12px;color:${COR.suave}">Mensagem automática do DaVinci Qualidade. Não responda este e-mail.</td></tr>
</table></td></tr></table></body></html>`;
  const texto = [
    e.titulo,
    '',
    ...e.paragrafos.flatMap((p) => [p, '']),
    ...(e.botao ? [`${e.botao.texto}: ${e.botao.url}`, ''] : []),
    ...(e.rodape ? [e.rodape, ''] : []),
    '-- ',
    'Mensagem automática do DaVinci Qualidade. Não responda este e-mail.',
  ].join('\n');
  return { html, texto };
}
