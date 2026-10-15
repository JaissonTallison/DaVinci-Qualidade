/**
 * Catálogo de permissões (docs/05-modulos/identidade.md). Definidas no código:
 * cada rota do gateway exige uma delas. Perfis (configuráveis por empresa) são
 * conjuntos destas permissões.
 */
export const PERMISSOES = {
  'parceiros.ver': 'Ver clientes e fornecedores',
  'parceiros.editar': 'Cadastrar e editar clientes e fornecedores',
  'parceiros.inativar': 'Inativar e reativar clientes e fornecedores',
  'funcionarios.ver':
    'Ver funcionários, setores, funções, exames e treinamentos',
  'funcionarios.editar':
    'Cadastrar e editar funcionários, setores, funções, exames e treinamentos',
  'qualidade.ver':
    'Ver Qualidade: inspeções, checklists, não conformidades, planos de ação e calibração',
  'qualidade.editar': 'Criar e editar registros de Qualidade',
  'qualidade.excluir': 'Excluir registros de Qualidade',
  'auditorias.ver':
    'Ver Auditorias: auditorias, kit pré-auditoria e entrevistas',
  'auditorias.editar': 'Criar e editar registros de Auditorias',
  'auditorias.excluir': 'Excluir registros de Auditorias',
  'auditorias.conteudo':
    'Gerenciar o conteúdo próprio da empresa: roteiros, evidências, modelos de NC, prompts e auditores',
  'sgi.ver': 'Ver Gestão do SGI: riscos, objetivos, análise crítica e mudanças',
  'sgi.editar': 'Criar e editar registros de Gestão do SGI',
  'sgi.excluir': 'Excluir registros de Gestão do SGI',
  'servicos.ver':
    'Ver Serviços: ordens de serviço, avaliações, satisfação do cliente e fornecedores',
  'servicos.editar': 'Criar e editar registros de Serviços',
  'servicos.excluir': 'Excluir registros de Serviços',
  'seguranca.ver':
    'Ver Segurança do Trabalho: acidentes, PGR, inspeções, EPIs, CIPA/DDS/APR, emergência e terceiros',
  'seguranca.editar': 'Criar e editar registros de Segurança do Trabalho',
  'seguranca.excluir': 'Excluir registros de Segurança do Trabalho',
  'seguranca.liberar-pt': 'Liberar permissões de trabalho',
  'ambiental.ver':
    'Ver Meio Ambiente: aspectos, requisitos legais, licenças, resíduos, químicos, consumo, GEE e monitoramento',
  'ambiental.editar': 'Criar e editar registros de Meio Ambiente',
  'ambiental.excluir': 'Excluir registros de Meio Ambiente',
  'esg.ver': 'Ver Agenda ESG: temas materiais, materialidade e ODS',
  'esg.editar': 'Criar e editar registros de Agenda ESG',
  'esg.excluir': 'Excluir registros de Agenda ESG',
  'esg.importar-catalogo': 'Importar o catálogo de referência de temas ESG',
  'paineis.ver': 'Ver o dashboard de vencimentos e gerar relatórios em PDF',
  'historico.ver': 'Ver o histórico de alterações (trilha de auditoria)',
  'usuarios.gerenciar': 'Gerenciar usuários e seus acessos',
  'perfis.gerenciar': 'Gerenciar perfis de acesso',
  'empresa.gerenciar': 'Alterar os dados da empresa e os módulos contratados',
  'integracoes.gerenciar': 'Configurar integrações e criar chaves de API',
  'dados.importar': 'Importar planilhas',
  'sistema.status': 'Ver o status do sistema',
} as const;

export type Permissao = keyof typeof PERMISSOES;

/** Agrupamento para a tela de perfis (por módulo). Toda permissão nova entra em um grupo. */
export const GRUPOS_DE_PERMISSOES: {
  titulo: string;
  permissoes: Permissao[];
}[] = [
  {
    titulo: 'Cadastros · Clientes e fornecedores',
    permissoes: ['parceiros.ver', 'parceiros.editar', 'parceiros.inativar'],
  },
  {
    titulo: 'Cadastros · Funcionários',
    permissoes: ['funcionarios.ver', 'funcionarios.editar'],
  },
  {
    titulo: 'Qualidade',
    permissoes: ['qualidade.ver', 'qualidade.editar', 'qualidade.excluir'],
  },
  {
    titulo: 'Auditorias',
    permissoes: [
      'auditorias.ver',
      'auditorias.editar',
      'auditorias.excluir',
      'auditorias.conteudo',
    ],
  },
  {
    titulo: 'Gestão do SGI',
    permissoes: ['sgi.ver', 'sgi.editar', 'sgi.excluir'],
  },
  {
    titulo: 'Serviços',
    permissoes: ['servicos.ver', 'servicos.editar', 'servicos.excluir'],
  },
  {
    titulo: 'Segurança do Trabalho',
    permissoes: [
      'seguranca.ver',
      'seguranca.editar',
      'seguranca.excluir',
      'seguranca.liberar-pt',
    ],
  },
  {
    titulo: 'Meio Ambiente',
    permissoes: ['ambiental.ver', 'ambiental.editar', 'ambiental.excluir'],
  },
  {
    titulo: 'Agenda ESG',
    permissoes: [
      'esg.ver',
      'esg.editar',
      'esg.excluir',
      'esg.importar-catalogo',
    ],
  },
  {
    titulo: 'Painéis e relatórios',
    permissoes: ['paineis.ver', 'historico.ver'],
  },
  {
    titulo: 'Administração',
    permissoes: [
      'usuarios.gerenciar',
      'perfis.gerenciar',
      'empresa.gerenciar',
      'integracoes.gerenciar',
      'dados.importar',
    ],
  },
  { titulo: 'Sistema', permissoes: ['sistema.status'] },
];
export const TODAS_AS_PERMISSOES = Object.keys(PERMISSOES) as Permissao[];

export function ehPermissao(valor: unknown): valor is Permissao {
  return typeof valor === 'string' && valor in PERMISSOES;
}

const MODULOS = [
  'qualidade',
  'auditorias',
  'sgi',
  'servicos',
  'seguranca',
  'ambiental',
  'esg',
] as const;
const de = (acoes: readonly string[]) =>
  MODULOS.flatMap((m) => acoes.map((a) => `${m}.${a}` as Permissao));

/**
 * Perfis criados em toda empresa nova (podem ser ajustados depois, exceto o Administrador).
 * Regra do QSSMA: quem tem acesso cria e edita; excluir, liberar PT e importar o catálogo ESG é do gestor.
 */
export const PERFIS_PADRAO: {
  nome: string;
  descricao: string;
  permissoes: Permissao[];
}[] = [
  {
    nome: 'Administrador',
    descricao: 'Acesso total, inclusive usuários, perfis e módulos.',
    permissoes: TODAS_AS_PERMISSOES,
  },
  {
    nome: 'Gestor do SGI',
    descricao:
      'Coordena o sistema de gestão: registra, exclui, libera permissões de trabalho e importa o catálogo ESG.',
    permissoes: [
      'parceiros.ver',
      'parceiros.editar',
      'parceiros.inativar',
      'funcionarios.ver',
      'funcionarios.editar',
      ...de(['ver', 'editar', 'excluir']),
      'auditorias.conteudo',
      'seguranca.liberar-pt',
      'esg.importar-catalogo',
      'paineis.ver',
      'historico.ver',
      'dados.importar',
      'sistema.status',
    ],
  },
  {
    nome: 'Analista',
    descricao:
      'Registra e acompanha o dia a dia de todos os módulos, sem excluir.',
    permissoes: [
      'parceiros.ver',
      'parceiros.editar',
      'funcionarios.ver',
      'funcionarios.editar',
      ...de(['ver', 'editar']),
      'paineis.ver',
      'sistema.status',
    ],
  },
  {
    nome: 'Auditor',
    descricao: 'Conduz auditorias e consulta os demais módulos.',
    permissoes: [
      'parceiros.ver',
      'funcionarios.ver',
      ...de(['ver']),
      'auditorias.editar',
      'qualidade.editar',
      'paineis.ver',
      'historico.ver',
    ],
  },
  {
    nome: 'Consulta',
    descricao: 'Somente leitura.',
    permissoes: [
      'parceiros.ver',
      'funcionarios.ver',
      ...de(['ver']),
      'paineis.ver',
      'sistema.status',
    ],
  },
];
