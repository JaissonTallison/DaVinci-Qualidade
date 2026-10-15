import type { Permissao, Recurso } from "@davinci/types";

export interface ItemDoMenu {
  rotulo: string;
  href: string;
  permissao: Permissao;
}

export interface GrupoDoMenu {
  titulo: string;
  /** Módulo contratado que o grupo exige; sem ele, o grupo não aparece. */
  recurso: Recurso;
  itens: ItemDoMenu[];
}

/**
 * Os grupos do QSSMA, na ordem do documento de domínio. Só entram telas que existem:
 * item sem tela é link quebrado, e grupo vazio não aparece.
 */
export const GRUPOS_DO_MENU: GrupoDoMenu[] = [
  {
    titulo: "Qualidade",
    recurso: "qualidade",
    itens: [
      {
        rotulo: "Não conformidades",
        href: "/qualidade/nao-conformidades",
        permissao: "qualidade.ver",
      },
      {
        rotulo: "Inspeções",
        href: "/qualidade/inspecoes",
        permissao: "qualidade.ver",
      },
      {
        rotulo: "Planos de ação",
        href: "/qualidade/planos-de-acao",
        permissao: "qualidade.ver",
      },
      {
        rotulo: "Calibração",
        href: "/qualidade/calibracao",
        permissao: "qualidade.ver",
      },
      {
        rotulo: "Modelos de inspeção",
        href: "/qualidade/modelos-de-inspecao",
        permissao: "qualidade.ver",
      },
    ],
  },
  {
    titulo: "Auditorias",
    recurso: "auditorias",
    itens: [
      {
        rotulo: "Auditorias",
        href: "/auditorias",
        permissao: "auditorias.ver",
      },
    ],
  },
];

/** Grupos visíveis para quem está logado: módulo ligado na empresa e ao menos um item permitido. */
export function gruposVisiveis(
  permissoes: readonly Permissao[],
  recursos: readonly Recurso[],
): GrupoDoMenu[] {
  return GRUPOS_DO_MENU.filter((g) => recursos.includes(g.recurso))
    .map((g) => ({
      ...g,
      itens: g.itens.filter((i) => permissoes.includes(i.permissao)),
    }))
    .filter((g) => g.itens.length > 0);
}
