import type { MomentoDoKit } from '@davinci/types';

/** Telas do sistema que os itens do kit indicam ("Ir para"). */
const ATALHOS = {
  requisitos: { rotulo: 'Requisitos legais', href: '/ambiental/requisitos' },
  aspectos: { rotulo: 'Aspectos e impactos', href: '/ambiental/aspectos' },
  licencas: { rotulo: 'Licenças', href: '/ambiental/licencas' },
  residuos: { rotulo: 'Resíduos', href: '/ambiental/residuos' },
  ncs: { rotulo: 'Não conformidades', href: '/qualidade/nao-conformidades' },
  planos: { rotulo: 'Planos de ação', href: '/qualidade/planos-de-acao' },
  calibracao: { rotulo: 'Calibração', href: '/qualidade/calibracao' },
  pgr: { rotulo: 'PGR', href: '/seguranca/pgr' },
  vencimentos: { rotulo: 'ASO e treinamentos', href: '/seguranca/vencimentos' },
  auditorias: { rotulo: 'Auditorias', href: '/auditorias' },
  analise: { rotulo: 'Análise crítica', href: '/sgi/analises-criticas' },
  objetivos: { rotulo: 'Objetivos', href: '/sgi/objetivos' },
  riscos: {
    rotulo: 'Riscos e oportunidades',
    href: '/sgi/riscos-e-oportunidades',
  },
  mudancas: { rotulo: 'Gestão de mudanças', href: '/sgi/mudancas' },
} as const;
type Atalho = (typeof ATALHOS)[keyof typeof ATALHOS];

/**
 * Kit pré-auditoria externa (material de referência, docs/06-referencias/auditexpert.md §3), sem os itens repetidos
 * do original. O código é estável: o status de cada auditoria é gravado por ele.
 */
export const KIT_PRE_AUDITORIA: {
  codigo: string;
  momento: MomentoDoKit;
  descricao: string;
  responsavel: string;
  atalho: Atalho | null;
}[] = [
  {
    codigo: 'K90-01',
    momento: 'd90',
    descricao:
      'Confirmar escopo, sítios e normas da auditoria com o organismo certificador',
    responsavel: 'Coordenador de Qualidade / SGI',
    atalho: null,
  },
  {
    codigo: 'K90-02',
    momento: 'd90',
    descricao:
      'Revisar o planejamento anual de auditorias internas e reagendar pendências',
    responsavel: 'Coordenador de Qualidade',
    atalho: ATALHOS.auditorias,
  },
  {
    codigo: 'K90-03',
    momento: 'd90',
    descricao:
      'Revisar o manual do SGI e a política, garantindo aderência à versão vigente das normas',
    responsavel: 'Coordenador de Qualidade',
    atalho: null,
  },
  {
    codigo: 'K90-04',
    momento: 'd90',
    descricao:
      'Atualizar a matriz de requisitos legais (Qualidade, Meio Ambiente e SSO)',
    responsavel: 'Coordenador do SGI',
    atalho: ATALHOS.requisitos,
  },
  {
    codigo: 'K90-05',
    momento: 'd90',
    descricao:
      'Levantar mudanças significativas desde a última auditoria (processos, layout, produtos)',
    responsavel: 'Gerentes de área',
    atalho: ATALHOS.mudancas,
  },
  {
    codigo: 'K90-06',
    momento: 'd90',
    descricao: 'Iniciar a análise crítica preliminar de indicadores e riscos',
    responsavel: 'Alta Direção',
    atalho: ATALHOS.riscos,
  },
  {
    codigo: 'K90-07',
    momento: 'd90',
    descricao:
      'Iniciar o programa completo de auditorias internas cobrindo 100% do escopo',
    responsavel: 'Auditores internos',
    atalho: ATALHOS.auditorias,
  },
  {
    codigo: 'K30-01',
    momento: 'd30',
    descricao:
      'Realizar auditoria interna cruzada em todos os processos do escopo',
    responsavel: 'Coordenador de Qualidade',
    atalho: ATALHOS.auditorias,
  },
  {
    codigo: 'K30-02',
    momento: 'd30',
    descricao:
      'Consolidar os indicadores de desempenho dos últimos 12 meses por processo',
    responsavel: 'Donos dos processos',
    atalho: ATALHOS.objetivos,
  },
  {
    codigo: 'K30-03',
    momento: 'd30',
    descricao:
      'Atualizar a matriz de requisitos legais aplicáveis à 14001 e à 45001',
    responsavel: 'Meio Ambiente / SSO',
    atalho: ATALHOS.requisitos,
  },
  {
    codigo: 'K30-04',
    momento: 'd30',
    descricao:
      'Revisar o tratamento de todas as NCs abertas nos últimos 12 meses',
    responsavel: 'Coordenador do SGI',
    atalho: ATALHOS.ncs,
  },
  {
    codigo: 'K30-05',
    momento: 'd30',
    descricao: 'Revisar a matriz de aspectos e impactos ambientais',
    responsavel: 'Meio Ambiente',
    atalho: ATALHOS.aspectos,
  },
  {
    codigo: 'K30-06',
    momento: 'd30',
    descricao: 'Revisar a matriz de perigos e riscos ocupacionais',
    responsavel: 'SSO',
    atalho: ATALHOS.pgr,
  },
  {
    codigo: 'K30-07',
    momento: 'd30',
    descricao:
      'Simular perguntas de auditoria com os donos de processo usando os roteiros de entrevista',
    responsavel: 'Coordenador do SGI',
    atalho: null,
  },
  {
    codigo: 'K30-08',
    momento: 'd30',
    descricao: 'Confirmar a vigência de treinamentos de NR e das calibrações',
    responsavel: 'RH / Manutenção',
    atalho: ATALHOS.vencimentos,
  },
  {
    codigo: 'K15-01',
    momento: 'd15',
    descricao: 'Fechar todas as NCs abertas com evidência objetiva de eficácia',
    responsavel: 'Responsáveis por processo',
    atalho: ATALHOS.ncs,
  },
  {
    codigo: 'K15-02',
    momento: 'd15',
    descricao:
      'Preparar a apresentação de abertura (escopo, política, indicadores, plano de melhoria)',
    responsavel: 'Alta Direção',
    atalho: null,
  },
  {
    codigo: 'K15-03',
    momento: 'd15',
    descricao:
      'Consolidar as evidências objetivas por cláusula em pasta única, física ou digital',
    responsavel: 'Coordenador de Qualidade',
    atalho: null,
  },
  {
    codigo: 'K15-04',
    momento: 'd15',
    descricao: 'Revisar a disponibilidade e a agenda dos entrevistados-chave',
    responsavel: 'Coordenador de Qualidade',
    atalho: null,
  },
  {
    codigo: 'K15-05',
    momento: 'd15',
    descricao:
      'Verificar a documentação legal ambiental vigente (licenças, MTR e CDF)',
    responsavel: 'Meio Ambiente',
    atalho: ATALHOS.licencas,
  },
  {
    codigo: 'K07-01',
    momento: 'd7',
    descricao:
      'Realizar a reunião de análise crítica com a pauta completa da cláusula 9.3',
    responsavel: 'Alta Direção',
    atalho: ATALHOS.analise,
  },
  {
    codigo: 'K07-02',
    momento: 'd7',
    descricao:
      'Comunicar o plano de auditoria a todos os colaboradores envolvidos',
    responsavel: 'RH / Comunicação',
    atalho: null,
  },
  {
    codigo: 'K07-03',
    momento: 'd7',
    descricao:
      'Verificar intérpretes, EPIs para o auditor e crachás de visitante',
    responsavel: 'Facilities / SESMT',
    atalho: null,
  },
  {
    codigo: 'K07-04',
    momento: 'd7',
    descricao:
      'Fazer o briefing com os auditados: postura, o que apresentar, como responder',
    responsavel: 'Coordenador de Qualidade',
    atalho: null,
  },
  {
    codigo: 'K07-05',
    momento: 'd7',
    descricao: 'Simular perguntas críticas com os gestores de processo',
    responsavel: 'Coordenador de Qualidade',
    atalho: null,
  },
  {
    codigo: 'K07-06',
    momento: 'd7',
    descricao:
      'Testar o acesso do auditor externo aos sistemas (leitura) e organizar as credenciais',
    responsavel: 'TI',
    atalho: null,
  },
  {
    codigo: 'K00-01',
    momento: 'd0',
    descricao:
      'Disponibilizar sala, acesso ao sistema e organograma atualizado',
    responsavel: 'RH / Facilities',
    atalho: null,
  },
  {
    codigo: 'K00-02',
    momento: 'd0',
    descricao:
      'Designar acompanhante fixo do auditor, com autonomia para acessar documentos',
    responsavel: 'Coordenador de Qualidade',
    atalho: null,
  },
  {
    codigo: 'K00-03',
    momento: 'd0',
    descricao:
      'Manter equipe de resposta rápida para localizar as evidências pedidas',
    responsavel: 'Donos dos processos',
    atalho: null,
  },
  {
    codigo: 'K00-04',
    momento: 'd0',
    descricao: 'Ter um guia designado para acompanhar o auditor em campo',
    responsavel: 'Coordenador de Qualidade',
    atalho: null,
  },
  {
    codigo: 'K00-05',
    momento: 'd0',
    descricao: 'Ter um escriba registrando em tempo real os pontos levantados',
    responsavel: 'Coordenador de Qualidade',
    atalho: null,
  },
  {
    codigo: 'K00-06',
    momento: 'd0',
    descricao:
      'Manter o kit de evidências digital acessível para consulta rápida',
    responsavel: 'Coordenador de Qualidade',
    atalho: null,
  },
  {
    codigo: 'K00-07',
    momento: 'd0',
    descricao:
      'Realizar a reunião de fechamento diária para alinhar os achados',
    responsavel: 'Coordenador de Qualidade / Alta Direção',
    atalho: null,
  },
];
