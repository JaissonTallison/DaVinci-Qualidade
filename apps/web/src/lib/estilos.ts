/*
 * Classes compartilhadas, só com tokens (docs/04-design/interface.md). Componente novo reaproveita daqui
 * em vez de inventar outro tamanho, outra cor ou outro canto.
 */

export const rotulo = "text-base font-medium text-texto";

/** Contorno, fundo e estados de todo controle de digitação: borda leve, sombra mínima, escurece no hover. */
const controle =
  "rounded-campo border border-borda-campo bg-superficie px-3 text-base text-texto shadow-xs transition-colors placeholder:text-texto-3 hover:border-borda-forte focus:border-foco aria-invalid:border-nao-conforme disabled:cursor-not-allowed disabled:bg-afundado disabled:text-texto-2 disabled:shadow-none read-only:bg-afundado";
/** Campo sem largura, 36 px: para filtros e barras de ferramentas, onde cada campo tem a sua. */
export const campoCompacto = `h-9 ${controle}`;
/** Campo de formulário, 40 px: ocupa a coluna. */
export const campo = `h-10 w-full ${controle}`;
export const areaDeTexto = `min-h-24 w-full py-2 ${controle}`;
export const erroDoCampo = "text-sm text-nao-conforme";
export const ajudaDoCampo = "text-sm text-texto-3";

/**
 * Botões (interface.md §8). Use o componente `Botao`; as classes abaixo ficam para os poucos casos em que o
 * elemento não pode ser o componente (gatilho do `Suspenso`, `<label>` de arquivo, `<summary>`).
 */
export type VarianteDoBotao =
  | "primario"
  | "secundario"
  | "fantasma"
  | "perigo"
  | "link";
/** Pequeno 30 px (card e tabela), médio 36 px (corpo, modal, filtro), grande 40 px (cabeçalho e barra do cadastro). */
export type TamanhoDoBotao = "pequeno" | "medio" | "grande";

const BASE_DO_BOTAO =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-campo border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";
const TAMANHOS_DO_BOTAO: Record<TamanhoDoBotao, string> = {
  pequeno: "h-7.5 gap-1.5 px-3 text-sm",
  medio: "h-9 gap-2 px-4 text-base",
  grande: "h-10 gap-2 px-5 text-base",
};
const SO_ICONE: Record<TamanhoDoBotao, string> = {
  pequeno: "size-7.5",
  medio: "size-9",
  grande: "size-10",
};
const VARIANTES_DO_BOTAO: Record<Exclude<VarianteDoBotao, "link">, string> = {
  /** Um por área: a ação que conclui a tarefa. Azul da marca. */
  primario:
    "border-transparent bg-acao text-primaria-texto shadow-xs hover:bg-acao-escuro",
  /** Ações de apoio: Exportar, Imprimir, Editar, Cancelar no cadastro. */
  secundario:
    "border-borda-campo bg-superficie text-texto shadow-xs hover:border-borda-forte hover:bg-superficie-2",
  /** Sem moldura: descartar, ações de linha, botão só com ícone na barra. */
  fantasma:
    "border-transparent bg-transparent text-texto-2 hover:bg-superficie-2 hover:text-texto",
  /** Excluir, anular, cancelar registro: vermelho cheio, sempre com confirmação. */
  perigo:
    "border-transparent bg-nao-conforme text-primaria-texto shadow-xs hover:bg-nao-conforme-texto",
};

/** Classe do botão por variante e tamanho; `soIcone` deixa quadrado (36 × 36 no médio). */
export function estiloDoBotao(
  variante: VarianteDoBotao = "secundario",
  tamanho: TamanhoDoBotao = "medio",
  soIcone = false,
): string {
  if (variante === "link")
    return `inline-flex items-center gap-1.5 font-medium text-info underline-offset-2 hover:underline ${tamanho === "pequeno" ? "text-sm" : "text-base"}`;
  return `${BASE_DO_BOTAO} ${soIcone ? `${SO_ICONE[tamanho]} px-0` : TAMANHOS_DO_BOTAO[tamanho]} ${VARIANTES_DO_BOTAO[variante]}`;
}

export const botaoPrimario = estiloDoBotao("primario");
export const botaoSecundario = estiloDoBotao("secundario");
export const botaoFantasma = estiloDoBotao("fantasma");
export const botaoPerigo = estiloDoBotao("perigo");
export const botaoPequeno = estiloDoBotao("secundario", "pequeno");
export const botaoIcone = estiloDoBotao("secundario", "medio", true);
export const botaoLink = estiloDoBotao("link");

/** Link de texto neutro para ações secundárias da tela ("Limpar filtros", "Inativar"). */
export const linkDiscreto =
  "text-sm font-semibold text-texto-2 underline-offset-2 hover:text-texto hover:underline";
/** Card e painel: sem borda visível, a sombra do cartão já traz o contorno de 1 px. */
export const painel = "rounded-md bg-superficie shadow-cartao";
/** Cabeçalho de card: título de 15 px e a linha de baixo. */
export const cabecalhoDoPainel =
  "flex min-h-14 items-center gap-3 border-b border-borda px-5 py-3";
export const tituloDoPainel = "text-md font-semibold text-texto";
export const tituloDaPagina = "text-2xl font-semibold text-texto";
/** Linha abaixo do título da página: explica, em cinza, para que serve a tela. */
export const subtituloDaPagina = "mt-1 text-base text-texto-2";
export const tituloDaSecao = "text-xl font-semibold text-texto";
/** Rótulo pequeno em caixa alta (cabeçalho de tabela, título de grupo de campos). */
export const sobretitulo =
  "text-xs font-semibold uppercase tracking-[0.04em] text-texto-2";

/**
 * Abas e seletores (período, filtro por situação): trilho cinza-gelo com a opção ativa em branco, sombra leve e
 * texto em azul petróleo. O mesmo desenho em todo o sistema.
 */
export const trilho =
  "inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-campo border border-borda bg-afundado p-0.5";
export const aba = (ativa: boolean, pequena = false) =>
  `inline-flex items-center gap-1.5 rounded-xs whitespace-nowrap font-medium transition-colors ${pequena ? "h-7 px-3 text-sm" : "h-8 px-3.5 text-base"} ${ativa ? "bg-superficie text-texto shadow-xs ring-1 ring-borda-campo" : "text-texto-2 hover:text-texto"}`;

/** Opção do seletor segmentado feito com rádio (`<input className="peer sr-only">` + este `<span>`), dentro do `trilho`. */
export const opcaoSegmentada =
  "flex h-8 cursor-pointer items-center justify-center rounded-xs px-3.5 text-base font-medium text-texto-2 transition-colors hover:text-texto peer-checked:bg-superficie peer-checked:text-texto peer-checked:shadow-xs peer-checked:ring-1 peer-checked:ring-borda-campo peer-focus-visible:outline-2 peer-focus-visible:outline-foco";

/** Abas de página (seções de um registro, situação de uma lista): sublinhado na cor da marca. */
export const linhaDeAbas = "flex gap-1 overflow-x-auto border-b border-borda";
export const abaDePagina = (ativa: boolean) =>
  `-mb-px inline-flex h-10 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-base font-medium transition-colors ${ativa ? "border-acao text-texto" : "border-transparent text-texto-2 hover:text-texto"}`;

/**
 * Selo de status (badge): retângulo de 22 px, canto de 4 px, só texto, sem ponto colorido.
 * Perigo: pendência, vencido, reprovado. Atenção: vence em breve, atrasado. Sucesso: conforme, válido.
 * Info: em andamento, em análise. Neutro: rascunho, encerrado, não se aplica.
 */
export type TomDoSelo = "perigo" | "atencao" | "sucesso" | "info" | "neutro";
const TONS: Record<TomDoSelo, string> = {
  perigo:
    "border-nao-conforme-borda bg-nao-conforme-suave text-nao-conforme-texto",
  atencao: "border-atencao-borda bg-atencao-suave text-atencao-texto",
  sucesso: "border-conforme-borda bg-conforme-suave text-conforme-texto",
  info: "border-info-borda bg-info-suave text-info",
  neutro: "border-borda bg-superficie-2 text-texto-2",
};
export const selo = (tom: TomDoSelo = "neutro") =>
  `inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-xs border px-2 align-middle text-xs font-medium ${TONS[tom]}`;
