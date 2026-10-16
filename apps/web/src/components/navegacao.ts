import type { Permissao, Recurso } from "@davinci/types";

export interface ItemDoMenu {
  rotulo: string;
  href: string;
  permissao: Permissao;
}

export interface GrupoDoMenu {
  titulo: string;
  /** Módulo contratado que o grupo exige; sem ele, o grupo não aparece. Sem recurso: sempre ligado (cadastros). */
  recurso?: Recurso;
  itens: ItemDoMenu[];
}

/**
 * Os grupos do QSSMA, na ordem do documento de domínio. Só entram telas que existem:
 * item sem tela é link quebrado, e grupo vazio não aparece.
 */
export const GRUPOS_DO_MENU: GrupoDoMenu[] = [
  {
    titulo: "Painéis",
    itens: [
      {
        rotulo: "Vencimentos",
        href: "/paineis/vencimentos",
        permissao: "paineis.ver",
      },
    ],
  },
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
      {
        rotulo: "Biblioteca de evidências",
        href: "/auditorias/biblioteca",
        permissao: "auditorias.ver",
      },
      {
        rotulo: "Banco de NCs",
        href: "/auditorias/banco-de-ncs",
        permissao: "auditorias.ver",
      },
      {
        rotulo: "Prompts de IA",
        href: "/auditorias/prompts",
        permissao: "auditorias.ver",
      },
      {
        rotulo: "Minha biblioteca",
        href: "/auditorias/minha-biblioteca",
        permissao: "auditorias.ver",
      },
      {
        rotulo: "Log do Auditor",
        href: "/auditorias/log",
        permissao: "auditorias.ver",
      },
      {
        rotulo: "Manual de uso",
        href: "/auditorias/manual",
        permissao: "auditorias.ver",
      },
    ],
  },
  {
    titulo: "Gestão do SGI",
    recurso: "sgi",
    itens: [
      {
        rotulo: "Riscos e oportunidades",
        href: "/sgi/riscos-e-oportunidades",
        permissao: "sgi.ver",
      },
      {
        rotulo: "Objetivos da qualidade",
        href: "/sgi/objetivos",
        permissao: "sgi.ver",
      },
      {
        rotulo: "Análise crítica",
        href: "/sgi/analises-criticas",
        permissao: "sgi.ver",
      },
      {
        rotulo: "Gestão de mudanças",
        href: "/sgi/mudancas",
        permissao: "sgi.ver",
      },
    ],
  },
  {
    titulo: "Serviços",
    recurso: "servicos",
    itens: [
      {
        rotulo: "Ordens de serviço",
        href: "/servicos/ordens",
        permissao: "servicos.ver",
      },
      {
        rotulo: "Satisfação do cliente (NPS)",
        href: "/servicos/nps",
        permissao: "servicos.ver",
      },
      {
        rotulo: "Avaliação de fornecedores",
        href: "/servicos/fornecedores",
        permissao: "servicos.ver",
      },
    ],
  },
  {
    titulo: "Segurança do Trabalho",
    recurso: "seguranca",
    itens: [
      {
        rotulo: "Acidentes",
        href: "/seguranca/acidentes",
        permissao: "seguranca.ver",
      },
      {
        rotulo: "Indicadores de SST",
        href: "/seguranca/indicadores",
        permissao: "seguranca.ver",
      },
      {
        rotulo: "PGR · Inventário de riscos",
        href: "/seguranca/pgr",
        permissao: "seguranca.ver",
      },
      {
        rotulo: "Permissões de trabalho",
        href: "/seguranca/permissoes-de-trabalho",
        permissao: "seguranca.ver",
      },
      {
        rotulo: "DDS, APR, CIPA e simulados",
        href: "/seguranca/registros",
        permissao: "seguranca.ver",
      },
      {
        rotulo: "Terceiros",
        href: "/seguranca/terceiros",
        permissao: "seguranca.ver",
      },
      {
        rotulo: "Vencimentos de ASO e treinamentos",
        href: "/seguranca/vencimentos",
        permissao: "funcionarios.ver",
      },
      {
        rotulo: "Entregas de EPI",
        href: "/seguranca/entregas-de-epi",
        permissao: "seguranca.ver",
      },
      {
        rotulo: "Catálogo de EPIs",
        href: "/seguranca/epis",
        permissao: "seguranca.ver",
      },
    ],
  },
  {
    titulo: "Meio Ambiente",
    recurso: "ambiental",
    itens: [
      {
        rotulo: "Aspectos e impactos",
        href: "/ambiental/aspectos",
        permissao: "ambiental.ver",
      },
      {
        rotulo: "Requisitos legais",
        href: "/ambiental/requisitos",
        permissao: "ambiental.ver",
      },
      {
        rotulo: "Licenças",
        href: "/ambiental/licencas",
        permissao: "ambiental.ver",
      },
      {
        rotulo: "Resíduos",
        href: "/ambiental/residuos",
        permissao: "ambiental.ver",
      },
      {
        rotulo: "Produtos químicos",
        href: "/ambiental/produtos-quimicos",
        permissao: "ambiental.ver",
      },
      {
        rotulo: "Consumo de água e energia",
        href: "/ambiental/consumo",
        permissao: "ambiental.ver",
      },
      {
        rotulo: "Inventário de GEE",
        href: "/ambiental/gee",
        permissao: "ambiental.ver",
      },
      {
        rotulo: "Monitoramentos",
        href: "/ambiental/monitoramentos",
        permissao: "ambiental.ver",
      },
    ],
  },
  {
    titulo: "Agenda ESG",
    recurso: "esg",
    itens: [
      { rotulo: "Painel ESG", href: "/esg/painel", permissao: "esg.ver" },
      { rotulo: "Temas ESG", href: "/esg/temas", permissao: "esg.ver" },
      {
        rotulo: "Matriz de materialidade",
        href: "/esg/materialidade",
        permissao: "esg.ver",
      },
      { rotulo: "ODS", href: "/esg/ods", permissao: "esg.ver" },
    ],
  },
  {
    titulo: "Cadastros",
    itens: [
      {
        rotulo: "Clientes e fornecedores",
        href: "/cadastros/clientes-e-fornecedores",
        permissao: "parceiros.ver",
      },
      {
        rotulo: "Funcionários",
        href: "/cadastros/funcionarios",
        permissao: "funcionarios.ver",
      },
      {
        rotulo: "Treinamentos",
        href: "/cadastros/treinamentos",
        permissao: "funcionarios.ver",
      },
      {
        rotulo: "Setores e funções",
        href: "/cadastros/setores-e-funcoes",
        permissao: "funcionarios.ver",
      },
    ],
  },
  {
    titulo: "Administração",
    itens: [
      {
        rotulo: "Usuários",
        href: "/administracao/usuarios",
        permissao: "usuarios.gerenciar",
      },
      {
        rotulo: "Perfis de acesso",
        href: "/administracao/perfis",
        permissao: "perfis.gerenciar",
      },
      {
        rotulo: "Módulos contratados",
        href: "/administracao/modulos",
        permissao: "empresa.gerenciar",
      },
    ],
  },
];

/** Grupos visíveis para quem está logado: módulo ligado na empresa e ao menos um item permitido. */
export function gruposVisiveis(
  permissoes: readonly Permissao[],
  recursos: readonly Recurso[],
): GrupoDoMenu[] {
  return GRUPOS_DO_MENU.filter(
    (g) => !g.recurso || recursos.includes(g.recurso),
  )
    .map((g) => ({
      ...g,
      itens: g.itens.filter((i) => permissoes.includes(i.permissao)),
    }))
    .filter((g) => g.itens.length > 0);
}

export interface AtalhoDeCriacao {
  rotulo: string;
  href: string;
  permissao: Permissao;
  /** Módulo que precisa estar ligado; sem recurso, sempre (cadastros). */
  recurso?: Recurso;
}

/** O que o botão "+ Novo" da barra superior cria, na ordem dos grupos do menu. */
export const ATALHOS_DE_CRIACAO: AtalhoDeCriacao[] = [
  {
    rotulo: "Não conformidade",
    href: "/qualidade/nao-conformidades/nova",
    permissao: "qualidade.editar",
    recurso: "qualidade",
  },
  {
    rotulo: "Inspeção",
    href: "/qualidade/inspecoes/nova",
    permissao: "qualidade.editar",
    recurso: "qualidade",
  },
  {
    rotulo: "Plano de ação",
    href: "/qualidade/planos-de-acao/novo",
    permissao: "qualidade.editar",
    recurso: "qualidade",
  },
  {
    rotulo: "Auditoria",
    href: "/auditorias/nova",
    permissao: "auditorias.editar",
    recurso: "auditorias",
  },
  {
    rotulo: "Risco ou oportunidade",
    href: "/sgi/riscos-e-oportunidades/novo",
    permissao: "sgi.editar",
    recurso: "sgi",
  },
  {
    rotulo: "Mudança",
    href: "/sgi/mudancas/nova",
    permissao: "sgi.editar",
    recurso: "sgi",
  },
  {
    rotulo: "Ordem de serviço",
    href: "/servicos/ordens/nova",
    permissao: "servicos.editar",
    recurso: "servicos",
  },
  {
    rotulo: "Acidente ou incidente",
    href: "/seguranca/acidentes/novo",
    permissao: "seguranca.editar",
    recurso: "seguranca",
  },
  {
    rotulo: "Permissão de trabalho",
    href: "/seguranca/permissoes-de-trabalho/nova",
    permissao: "seguranca.editar",
    recurso: "seguranca",
  },
  {
    rotulo: "DDS, APR, CIPA ou simulado",
    href: "/seguranca/registros/novo",
    permissao: "seguranca.editar",
    recurso: "seguranca",
  },
  {
    rotulo: "Entrega de EPI",
    href: "/seguranca/entregas-de-epi/nova",
    permissao: "seguranca.editar",
    recurso: "seguranca",
  },
  {
    rotulo: "Risco no PGR",
    href: "/seguranca/pgr/novo",
    permissao: "seguranca.editar",
    recurso: "seguranca",
  },
  {
    rotulo: "Funcionário",
    href: "/cadastros/funcionarios/novo",
    permissao: "funcionarios.editar",
  },
  {
    rotulo: "Aspecto ambiental",
    href: "/ambiental/aspectos/novo",
    permissao: "ambiental.editar",
    recurso: "ambiental",
  },
  {
    rotulo: "Requisito legal",
    href: "/ambiental/requisitos/novo",
    permissao: "ambiental.editar",
    recurso: "ambiental",
  },
  {
    rotulo: "Licença",
    href: "/ambiental/licencas/nova",
    permissao: "ambiental.editar",
    recurso: "ambiental",
  },
  {
    rotulo: "Produto químico",
    href: "/ambiental/produtos-quimicos/novo",
    permissao: "ambiental.editar",
    recurso: "ambiental",
  },
  {
    rotulo: "Monitoramento ambiental",
    href: "/ambiental/monitoramentos/novo",
    permissao: "ambiental.editar",
    recurso: "ambiental",
  },
  {
    rotulo: "Tema ESG",
    href: "/esg/temas/novo",
    permissao: "esg.editar",
    recurso: "esg",
  },
];

export function atalhosVisiveis(
  permissoes: readonly Permissao[],
  recursos: readonly Recurso[],
): AtalhoDeCriacao[] {
  return ATALHOS_DE_CRIACAO.filter(
    (a) =>
      permissoes.includes(a.permissao) &&
      (!a.recurso || recursos.includes(a.recurso)),
  );
}
