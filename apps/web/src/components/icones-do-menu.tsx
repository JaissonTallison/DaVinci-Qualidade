import {
  Activity,
  BadgeCheck,
  Blocks,
  BookMarked,
  BookOpen,
  BookOpenCheck,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarClock,
  ChartColumn,
  ChartPie,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  CloudFog,
  Crosshair,
  Droplets,
  Earth,
  Factory,
  FileBadge,
  FileCode,
  FileKey,
  FileSignature,
  FileWarning,
  FireExtinguisher,
  FlaskConical,
  Gauge,
  GitPullRequestArrow,
  Globe,
  GraduationCap,
  Grid3x3,
  HardHat,
  House,
  IdCard,
  KeyRound,
  Layers,
  LayoutTemplate,
  Leaf,
  Library,
  LifeBuoy,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  MessageSquareWarning,
  MessagesSquare,
  Network,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Recycle,
  Scale,
  ScanSearch,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Shirt,
  Siren,
  Smile,
  Sprout,
  Star,
  Target,
  TestTubeDiagonal,
  TriangleAlert,
  Truck,
  UserCog,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/*
 * Ícones do sistema: Lucide (um conjunto só, mesmo traço). Grupos: 18 px em ouro claro (o menu é marinho).
 * Telas: 16 px na cor do texto
 * (interface.md §4: ícone pequeno, alinhado ao rótulo, nunca dentro de círculo colorido).
 */

export const ICONE_DO_GRUPO: Record<string, LucideIcon> = {
  Favoritos: Star,
  Início: House,
  Painéis: ChartColumn,
  Qualidade: ShieldCheck,
  Auditorias: ClipboardList,
  "Gestão do SGI": Target,
  Serviços: Briefcase,
  "Segurança do Trabalho": HardHat,
  "Meio Ambiente": Leaf,
  "Agenda ESG": Globe,
  Cadastros: Users,
  Administração: Settings,
};

export const ICONE_DA_TELA: Record<string, LucideIcon> = {
  "/paineis/vencimentos": CalendarClock,
  "/qualidade/nao-conformidades": TriangleAlert,
  "/qualidade/inspecoes": ScanSearch,
  "/qualidade/planos-de-acao": ListChecks,
  "/qualidade/calibracao": Gauge,
  "/qualidade/modelos-de-inspecao": LayoutTemplate,
  "/qualidade/fmea": Layers,
  "/qualidade/planos-de-controle": ClipboardList,
  "/qualidade/ppap": FileBadge,
  "/auditorias": ClipboardCheck,
  "/cadastros/competencias": BadgeCheck,
  "/auditorias/biblioteca": Library,
  "/auditorias/banco-de-ncs": FileWarning,
  "/auditorias/prompts": MessageSquareText,
  "/auditorias/minha-biblioteca": BookMarked,
  "/auditorias/log": IdCard,
  "/auditorias/manual": BookOpen,
  "/sgi/riscos-e-oportunidades": Lightbulb,
  "/sgi/objetivos": Crosshair,
  "/sgi/analises-criticas": CalendarCheck,
  "/sgi/mudancas": GitPullRequestArrow,
  "/servicos/ordens": Wrench,
  "/servicos/nps": Smile,
  "/servicos/fornecedores": Factory,
  "/servicos/reclamacoes": MessageSquareWarning,
  "/servicos/contratos": FileSignature,
  "/servicos/catalogo": BookOpenCheck,
  "/seguranca/acidentes": Siren,
  "/seguranca/esocial": FileCode,
  "/seguranca/equipamentos": FireExtinguisher,
  "/seguranca/emergencia": LifeBuoy,
  "/seguranca/indicadores": Activity,
  "/seguranca/pgr": ShieldAlert,
  "/seguranca/permissoes-de-trabalho": FileKey,
  "/seguranca/registros": MessagesSquare,
  "/seguranca/terceiros": Truck,
  "/seguranca/vencimentos": BadgeCheck,
  "/seguranca/entregas-de-epi": Shirt,
  "/seguranca/epis": Package,
  "/ambiental/aspectos": Sprout,
  "/ambiental/ocorrencias": TriangleAlert,
  "/ambiental/obrigacoes": CalendarCheck,
  "/ambiental/destinadores": Truck,
  "/ambiental/ecoeficiencia": Gauge,
  "/ambiental/programas": Crosshair,
  "/ambiental/requisitos": Scale,
  "/ambiental/licencas": FileBadge,
  "/ambiental/residuos": Recycle,
  "/ambiental/produtos-quimicos": FlaskConical,
  "/ambiental/consumo": Droplets,
  "/ambiental/gee": CloudFog,
  "/ambiental/monitoramentos": TestTubeDiagonal,
  "/esg/painel": ChartPie,
  "/esg/temas": Layers,
  "/esg/materialidade": Grid3x3,
  "/esg/ods": Earth,
  "/cadastros/clientes-e-fornecedores": Building2,
  "/cadastros/funcionarios": Users,
  "/cadastros/treinamentos": GraduationCap,
  "/cadastros/setores-e-funcoes": Network,
  "/cadastros/listas": ListChecks,
  "/administracao/usuarios": UserCog,
  "/administracao/perfis": KeyRound,
  "/administracao/modulos": Blocks,
};

export function IconeDoGrupo({ titulo }: { titulo: string }) {
  const I = ICONE_DO_GRUPO[titulo] ?? Building2;
  return (
    <I
      aria-hidden
      size={18}
      strokeWidth={1.75}
      className="shrink-0 text-ouro-claro"
    />
  );
}

/** Ícone de uma tela ou de qualquer endereço dentro dela (ex.: /qualidade/calibracao/novo usa o de Calibração). */
export function IconeDaTela({ href, size = 16 }: { href: string; size?: number }) {
  const caminho = href.split("?")[0]!;
  const chave = ICONE_DA_TELA[caminho]
    ? caminho
    : Object.keys(ICONE_DA_TELA)
        .filter((k) => caminho.startsWith(`${k}/`))
        .sort((x, y) => y.length - x.length)[0];
  const I = (chave ? ICONE_DA_TELA[chave] : undefined) ?? Wrench;
  return <I aria-hidden size={size} strokeWidth={1.75} className="shrink-0" />;
}

export function IconeSeta({ aberto }: { aberto: boolean }) {
  return (
    <ChevronRight
      aria-hidden
      size={16}
      strokeWidth={1.75}
      className={`shrink-0 ${aberto ? "rotate-90" : ""}`}
    />
  );
}

export function IconeRecolher({ compacto }: { compacto: boolean }) {
  const I = compacto ? PanelLeftOpen : PanelLeftClose;
  return <I aria-hidden size={18} strokeWidth={1.75} className="shrink-0" />;
}
