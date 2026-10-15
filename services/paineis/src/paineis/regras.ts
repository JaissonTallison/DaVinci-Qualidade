import {
  MODULOS_DO_PAINEL,
  type EmailParaEnviar,
  type Prazo,
} from '@davinci/types';

const br = (d: string) => d.split('-').reverse().join('/');
/** No e-mail, até este número de itens; o resto fica no painel. */
export const ITENS_NO_EMAIL = 15;

/** O aviso só sai quando há algo vencido ou vencendo em até 7 dias: e-mail diário sem novidade vira ruído. */
export function itensDoAviso(prazos: Prazo[], hoje: string): Prazo[] {
  const seteDias = new Date(`${hoje}T12:00:00Z`);
  seteDias.setUTCDate(seteDias.getUTCDate() + 7);
  const limite = seteDias.toISOString().slice(0, 10);
  return prazos
    .filter((p) => p.situacao === 'vencido' || p.data <= limite)
    .sort((a, b) => a.data.localeCompare(b.data));
}

export function montarAviso(
  para: string,
  nome: string,
  empresa: string,
  itens: Prazo[],
  appUrl: string,
): EmailParaEnviar {
  const vencidos = itens.filter((p) => p.situacao === 'vencido').length;
  const linhas = itens
    .slice(0, ITENS_NO_EMAIL)
    .map(
      (p) =>
        `${p.situacao === 'vencido' ? 'Venceu' : 'Vence'} em ${br(p.data)} · ${MODULOS_DO_PAINEL[p.modulo]} · ${p.tipo}: ${p.descricao}`,
    );
  if (itens.length > ITENS_NO_EMAIL)
    linhas.push(`E mais ${itens.length - ITENS_NO_EMAIL} no painel.`);
  return {
    para,
    assunto: `${empresa}: ${vencidos} ${vencidos === 1 ? 'prazo vencido' : 'prazos vencidos'}, ${itens.length - vencidos} nos próximos 7 dias`,
    titulo: 'Prazos do sistema de gestão',
    paragrafos: [
      `Olá, ${nome.split(' ')[0]}. Estes são os prazos dos módulos que você acompanha:`,
      ...linhas,
    ],
    botao: {
      texto: 'Abrir o painel de vencimentos',
      url: `${appUrl.replace(/\/$/, '')}/paineis/vencimentos`,
    },
    rodape:
      'Aviso diário do DaVinci Qualidade. Só chega quando há prazo vencido ou nos próximos 7 dias.',
  };
}
