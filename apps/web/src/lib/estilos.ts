/*
 * Classes compartilhadas, só com tokens (docs/04-design/interface.md). Componente novo reaproveita daqui
 * em vez de inventar outro tamanho, outra cor ou outro canto.
 */

export const rotulo = "text-sm font-semibold text-texto-2";
/** Campo sem largura: para filtros e linhas de controles, onde cada campo tem a sua. */
export const campoCompacto =
  "h-9 rounded-campo border border-borda-campo bg-campo px-3 text-base text-texto placeholder:text-texto-3 focus:bg-superficie aria-invalid:border-nao-conforme disabled:bg-superficie-2";
/** Campo de formulário: ocupa a coluna. */
export const campo = `${campoCompacto} w-full`;
export const areaDeTexto =
  "min-h-24 w-full rounded-campo border border-borda-campo bg-campo px-3 py-2 text-base text-texto focus:bg-superficie aria-invalid:border-nao-conforme";
export const erroDoCampo = "text-sm text-nao-conforme";
export const ajudaDoCampo = "text-sm text-texto-3";

const botao =
  "inline-flex h-9 items-center justify-center gap-2 rounded-campo px-4 text-base font-semibold transition-colors disabled:opacity-60";
export const botaoPrimario = `${botao} bg-acao text-primaria-texto hover:bg-acao-escuro`;
export const botaoSecundario = `${botao} border border-borda-campo bg-superficie text-texto hover:bg-campo`;
export const botaoPerigo = `${botao} border border-nao-conforme bg-superficie text-nao-conforme hover:bg-nao-conforme/10`;
export const botaoLink =
  "text-base font-semibold text-info underline-offset-2 hover:underline";

export const painel = "rounded-md border border-borda bg-superficie shadow-cartao";
export const tituloDaPagina = "text-2xl text-texto";
export const tituloDaSecao = "text-xl text-texto";

/**
 * Abas e seletores (período, filtro por situação): trilho cinza-gelo com a opção ativa em branco, sombra leve e
 * texto em azul petróleo. O mesmo desenho em todo o sistema.
 */
export const trilho =
  "inline-flex max-w-full flex-wrap items-center gap-1 rounded-md border border-borda-campo bg-campo p-1";
export const aba = (ativa: boolean, pequena = false) =>
  `inline-flex items-center gap-1.5 rounded-sm whitespace-nowrap transition-colors ${pequena ? "px-3 py-1 text-sm" : "px-3.5 py-1.5 text-base"} ${ativa ? "bg-superficie font-semibold text-marinho shadow-sm" : "text-texto-2 hover:bg-superficie/70 hover:text-texto"}`;
