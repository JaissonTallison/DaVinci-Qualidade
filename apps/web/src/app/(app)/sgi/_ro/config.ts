import type { TipoRo } from "@davinci/types";

/** Escala 1–5 no feminino (probabilidade, viabilidade). */
export const ESCALA_F: Record<number, string> = {
  1: "1 · Muito baixa",
  2: "2 · Baixa",
  3: "3 · Média",
  4: "4 · Alta",
  5: "5 · Muito alta",
};
/** Escala 1–5 no masculino (impacto, benefício). */
export const ESCALA_M: Record<number, string> = {
  1: "1 · Muito baixo",
  2: "2 · Baixo",
  3: "3 · Médio",
  4: "4 · Alto",
  5: "5 · Muito alto",
};

/**
 * Risco e oportunidade são o mesmo registro (campo `tipo`), mas se avaliam
 * diferente: risco por probabilidade × impacto; oportunidade por benefício ×
 * viabilidade. A config carrega os rótulos e textos próprios de cada tela, sem
 * duplicar listagem, formulário e detalhe.
 */
export type ConfigRo = {
  tipo: TipoRo;
  base: string;
  titulo: string;
  singular: string;
  registrar: string;
  subtitulo: string;
  intro: string;
  /** Avaliação: os dois eixos 1–5 gravados em probabilidade/impacto. */
  eixoA: { rotulo: string; escala: Record<number, string> };
  eixoB: { rotulo: string; escala: Record<number, string> };
  classe: string;
  classeAjuda: string;
  /** Campos de texto. */
  contexto: string;
  controles?: string;
  acao: string;
  acaoAlta: string;
  resultado: string;
};

export const RISCO: ConfigRo = {
  tipo: "risco",
  base: "/sgi/riscos",
  titulo: "Riscos",
  singular: "risco",
  registrar: "Registrar risco",
  subtitulo:
    "Riscos dos processos do sistema de gestão (ISO 9001, 6.1). Os riscos de SST ficam no PGR.",
  intro:
    "Avalie por probabilidade × impacto. Nível alto exige ação de tratamento, responsável e prazo.",
  eixoA: { rotulo: "Probabilidade", escala: ESCALA_F },
  eixoB: { rotulo: "Impacto", escala: ESCALA_M },
  classe: "Nível",
  classeAjuda: "Probabilidade × impacto",
  contexto: "Contexto ou causa",
  controles: "Controles existentes",
  acao: "Ação de tratamento",
  acaoAlta: "Nível alto exige ação de tratamento, responsável e prazo.",
  resultado: "Resultado e eficácia do tratamento",
};

export const OPORTUNIDADE: ConfigRo = {
  tipo: "oportunidade",
  base: "/sgi/oportunidades",
  titulo: "Oportunidades",
  singular: "oportunidade",
  registrar: "Registrar oportunidade",
  subtitulo:
    "Oportunidades de melhoria dos processos do sistema de gestão (ISO 9001, 6.1).",
  intro:
    "Avalie por benefício × viabilidade. Prioridade alta exige ação de aproveitamento, responsável e prazo.",
  eixoA: { rotulo: "Benefício esperado", escala: ESCALA_M },
  eixoB: { rotulo: "Viabilidade", escala: ESCALA_F },
  classe: "Prioridade",
  classeAjuda: "Benefício × viabilidade",
  contexto: "Origem e benefício esperado",
  acao: "Ação de aproveitamento",
  acaoAlta: "Prioridade alta exige ação de aproveitamento, responsável e prazo.",
  resultado: "Resultado do aproveitamento",
};

export const caminhoDoRo = (tipo: TipoRo): string =>
  tipo === "risco" ? RISCO.base : OPORTUNIDADE.base;
