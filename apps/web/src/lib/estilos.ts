/*
 * Classes compartilhadas, só com tokens (docs/04-design/interface.md). Componente novo reaproveita daqui
 * em vez de inventar outro tamanho, outra cor ou outro canto.
 */

export const rotulo = "text-sm font-semibold text-texto-2";
/** Campo sem largura: para filtros e linhas de controles, onde cada campo tem a sua. */
export const campoCompacto =
  "h-9 rounded-sm border border-borda-forte bg-superficie px-3 text-base text-texto placeholder:text-texto-3 aria-invalid:border-nao-conforme disabled:bg-superficie-2";
/** Campo de formulário: ocupa a coluna. */
export const campo = `${campoCompacto} w-full`;
export const areaDeTexto =
  "min-h-24 w-full rounded-sm border border-borda-forte bg-superficie px-3 py-2 text-base text-texto aria-invalid:border-nao-conforme";
export const erroDoCampo = "text-sm text-nao-conforme";
export const ajudaDoCampo = "text-sm text-texto-3";

const botao =
  "inline-flex h-9 items-center justify-center gap-2 rounded-sm px-4 text-base font-semibold transition-colors disabled:opacity-60";
export const botaoPrimario = `${botao} bg-primaria text-primaria-texto hover:opacity-90`;
export const botaoSecundario = `${botao} border border-borda-forte bg-superficie text-texto hover:bg-superficie-2`;
export const botaoPerigo = `${botao} border border-nao-conforme bg-superficie text-nao-conforme hover:bg-nao-conforme/10`;
export const botaoLink =
  "text-base font-semibold text-info underline-offset-2 hover:underline";

export const painel = "rounded-md border border-borda bg-superficie";
export const tituloDaPagina = "text-2xl text-texto";
export const tituloDaSecao = "text-xl text-texto";
