/** Colunas da planilha de importação da Minha biblioteca, na ordem do modelo para baixar. */
export const COLUNAS_DA_PLANILHA = {
  pergunta: [
    "processo",
    "norma",
    "clausula",
    "pergunta",
    "objetivo",
    "respostaEsperada",
    "sinalDeAlerta",
  ],
  evidencia: [
    "norma",
    "clausula",
    "titulo",
    "tipo",
    "risco",
    "oQuePedir",
    "exemplo",
  ],
  modelo: [
    "norma",
    "clausula",
    "tipo",
    "titulo",
    "descricao",
    "causaRaiz",
    "acaoCorretiva",
    "evidenciaFechamento",
  ],
} as const;

export const NOMES_DA_PLANILHA = {
  pergunta: "Perguntas de entrevista",
  evidencia: "Evidências",
  modelo: "Modelos de NC",
} as const;
