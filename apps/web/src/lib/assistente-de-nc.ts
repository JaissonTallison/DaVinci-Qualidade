/**
 * Assistente de NC: três prompts para colar numa ferramenta de IA, montados com a NC que o auditor escreveu.
 * O prompt acelera a redação; a evidência e a decisão continuam sendo do auditor.
 */
export interface PromptDoAssistente {
  titulo: string;
  uso: string;
  texto: string;
}

export function promptsDoAssistente(
  nc: string,
  requisito: string,
): PromptDoAssistente[] {
  const contexto = `Requisito auditado: ${requisito || "(informe a norma e a cláusula)"}\nRascunho da não conformidade: ${nc || "(cole aqui o que foi visto)"}`;
  return [
    {
      titulo: "Reescrever a NC no padrão",
      uso: "Quando o rascunho mistura opinião, causa e fato.",
      texto: `Você é auditor líder de sistemas de gestão. Reescreva a não conformidade abaixo em três partes: (1) requisito: o que a norma ou o procedimento exige, citando a cláusula; (2) fato: o que foi constatado, sem adjetivos nem suposição de causa; (3) evidência: documento, registro, local, data ou pessoa que comprova. Use linguagem neutra e verificável, em até 80 palavras. Não invente dados: onde faltar informação, escreva [completar].\n\n${contexto}`,
    },
    {
      titulo: "Causa raiz pelos 5 porquês",
      uso: "Para a análise de causa com o dono do processo.",
      texto: `Conduza uma análise de causa raiz pelo método dos 5 porquês para a não conformidade abaixo. Para cada porquê, proponha a pergunta e as respostas plausíveis a confirmar com o responsável do processo. Pare quando chegar a uma causa sobre a qual a organização tem controle (processo, método, recurso, competência). Não aceite "falha humana" como causa final. Termine com a causa raiz provável em uma frase e as evidências que a confirmariam.\n\n${contexto}`,
    },
    {
      titulo: "Correção, ação corretiva e eficácia (5W2H)",
      uso: "Para montar o plano de ação da NC.",
      texto: `Para a não conformidade abaixo, proponha: (1) correção imediata, que trata o caso encontrado; (2) ação corretiva, que elimina a causa para não se repetir, em 5W2H (o quê, por quê, onde, quando, quem, como, quanto custa); (3) evidência de fechamento esperada (documento revisado, registro, lista de presença, print do sistema); (4) como e quando verificar a eficácia, com critério objetivo. Evite ações genéricas como "orientar a equipe" sem mudança de processo ou documento.\n\n${contexto}`,
    },
  ];
}
