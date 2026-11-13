/** Biblioteca de elementos do editor de processos. Cada elemento vira um nó no canvas. */

export type FormaDoNo =
  | "terminal"
  | "processo"
  | "subprocesso"
  | "decisao"
  | "documento"
  | "dados"
  | "armazenamento"
  | "anotacao"
  | "qualidade";

export interface DadosDoNo {
  forma: FormaDoNo;
  /** Chave do elemento da paleta (ex.: "decisao", "nao_conformidade"). */
  categoria: string;
  /** Tipo do elemento (ex.: "Decisão"). */
  rotulo: string;
  /** Texto editável mostrado no nó. */
  nome: string;
  codigo?: string;
  responsavel?: string;
  departamento?: string;
  descricao?: string;
  pergunta?: string;
  [k: string]: unknown;
}

export interface ElementoDaPaleta {
  chave: string;
  rotulo: string;
  forma: FormaDoNo;
}
export interface GrupoDaPaleta {
  categoria: string;
  elementos: ElementoDaPaleta[];
}

export const PALETA: GrupoDaPaleta[] = [
  {
    categoria: "Fluxograma",
    elementos: [
      { chave: "inicio", rotulo: "Início", forma: "terminal" },
      { chave: "fim", rotulo: "Fim", forma: "terminal" },
      { chave: "processo", rotulo: "Processo", forma: "processo" },
      { chave: "subprocesso", rotulo: "Subprocesso", forma: "subprocesso" },
      { chave: "decisao", rotulo: "Decisão", forma: "decisao" },
      { chave: "documento", rotulo: "Documento", forma: "documento" },
      { chave: "dados", rotulo: "Entrada de dados", forma: "dados" },
      {
        chave: "armazenamento",
        rotulo: "Banco de dados",
        forma: "armazenamento",
      },
      { chave: "anotacao", rotulo: "Anotação", forma: "anotacao" },
    ],
  },
  {
    categoria: "Gestão da qualidade",
    elementos: [
      { chave: "responsavel", rotulo: "Responsável", forma: "qualidade" },
      { chave: "departamento", rotulo: "Departamento", forma: "qualidade" },
      {
        chave: "documento_controlado",
        rotulo: "Documento controlado",
        forma: "qualidade",
      },
      { chave: "registro", rotulo: "Registro da qualidade", forma: "qualidade" },
      {
        chave: "nao_conformidade",
        rotulo: "Não conformidade",
        forma: "qualidade",
      },
      { chave: "acao_corretiva", rotulo: "Ação corretiva", forma: "qualidade" },
      { chave: "risco", rotulo: "Risco", forma: "qualidade" },
      { chave: "controle", rotulo: "Controle operacional", forma: "qualidade" },
      { chave: "indicador", rotulo: "Indicador", forma: "qualidade" },
      { chave: "inspecao", rotulo: "Inspeção", forma: "qualidade" },
      { chave: "aprovacao", rotulo: "Aprovação", forma: "qualidade" },
    ],
  },
];

export function dadosPadrao(el: ElementoDaPaleta): DadosDoNo {
  return { forma: el.forma, categoria: el.chave, rotulo: el.rotulo, nome: el.rotulo };
}

/** Tamanho fixo de cada nó (usado no editor e na exportação). */
export const LARGURA_DO_NO: Record<FormaDoNo, number> = {
  terminal: 150,
  processo: 170,
  subprocesso: 170,
  decisao: 160,
  documento: 172,
  dados: 184,
  armazenamento: 150,
  anotacao: 170,
  qualidade: 184,
};
export const ALTURA_DO_NO: Record<FormaDoNo, number> = {
  terminal: 46,
  processo: 58,
  subprocesso: 58,
  decisao: 108,
  documento: 66,
  dados: 58,
  armazenamento: 68,
  anotacao: 58,
  qualidade: 66,
};

/** Cor de destaque por tipo de elemento (editor e exportação). */
export const ACENTO_DO_NO: Record<string, string> = {
  inicio: "#0F766E",
  fim: "#334155",
  decisao: "#B45309",
  nao_conformidade: "#B45309",
  risco: "#B45309",
  acao_corretiva: "#0F766E",
  aprovacao: "#0F766E",
  inspecao: "#0F766E",
  anotacao: "#94A3B8",
};
export const ACENTO_PADRAO = "#102A43";
