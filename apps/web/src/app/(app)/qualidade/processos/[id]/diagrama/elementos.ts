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
