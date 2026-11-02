/**
 * Base legal do PGR: a NR-01 (GRO) e os itens da norma que cada parte do módulo atende.
 * Referência exibida na tela do PGR e no documento gerado.
 */
export const BASE_LEGAL_PGR = {
  norma: "NR-01 — Disposições Gerais e Gerenciamento de Riscos Ocupacionais",
  ementa:
    "Estabelece as disposições gerais e os requisitos para o gerenciamento de riscos ocupacionais (GRO) e as medidas de prevenção em Segurança e Saúde no Trabalho (SST).",
  fonte:
    "Ministério do Trabalho e Emprego — Portaria MTb nº 3.214/1978, com as atualizações posteriores.",
  itens: [
    {
      item: "1.5",
      titulo: "Gerenciamento de riscos ocupacionais (GRO)",
      comoAtende:
        "O PGR reúne o inventário de riscos e o plano de ação da organização.",
    },
    {
      item: "1.5.4",
      titulo: "Identificação de perigos e avaliação de riscos",
      comoAtende:
        "Cada risco registra o perigo, os possíveis danos e o grupo (físico, químico, biológico, ergonômico, psicossocial ou acidente).",
    },
    {
      item: "1.5.4.4.2",
      titulo: "Determinação do nível de risco",
      comoAtende:
        "Calculado pela matriz severidade × probabilidade (4×4): baixo, moderado, alto ou crítico.",
    },
    {
      item: "1.5.4.4.6",
      titulo: "Revisão a cada 2 anos",
      comoAtende:
        "O sistema calcula a próxima revisão (última avaliação + 24 meses) e alerta quando vence.",
    },
    {
      item: "1.4.1 g / 1.5.5",
      titulo: "Controle dos riscos e hierarquia das medidas",
      comoAtende:
        "Cada risco indica a hierarquia de controle: eliminação, proteção coletiva, medida administrativa ou EPI.",
    },
    {
      item: "1.5.5.2",
      titulo: "Plano de ação",
      comoAtende:
        "Medidas a implementar com responsável e prazo; obrigatório para risco alto ou crítico.",
    },
    {
      item: "1.5.7",
      titulo: "Documentação (inventário de riscos e plano de ação)",
      comoAtende:
        "O documento do PGR reúne o inventário e o plano de ação, datado e assinado.",
    },
  ],
} as const;
