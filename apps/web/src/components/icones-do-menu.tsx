import {
  Activity,
  BadgeCheck,
  Biohazard,
  Blocks,
  BookMarked,
  BookOpen,
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
  FileKey,
  FileSignature,
  FileWarning,
  FireExtinguisher,
  FlaskConical,
  Gauge,
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
  Rocket,
  Scale,
  ScanSearch,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Shirt,
  Siren,
  Smile,
  Sparkles,
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
} from "@/components/icones";

/*
 * Ícones do sistema: Lucide (um conjunto só, mesmo traço).
 * Grupos: 16 px em branco dentro de um chip quadrado (cantos 8 px) com preenchimento translúcido do
 * próprio menu e um fio de luz no topo — tile discreto, sem degradê e sem cor própria. O interface.md §4
 * veta ícone em círculo colorido; um chip neutro quadrado no tom do menu não é isso.
 * Telas: 16 px na cor do texto, sem chip.
 */

export const ICONE_DO_GRUPO: Record<string, LucideIcon> = {
  Favoritos: Star,
  Início: House,
  Monitoramento: ChartColumn,
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
  "/paineis/indicadores": ChartPie,
  "/paineis/vencimentos": CalendarClock,
  "/qualidade/nao-conformidades": TriangleAlert,
  "/qualidade/inspecoes": ScanSearch,
  "/qualidade/planos-de-acao": ListChecks,
  "/qualidade/calibracao": Gauge,
  "/qualidade/modelos-de-inspecao": LayoutTemplate,
  "/qualidade/configuracoes": Settings,
  "/auditorias": ClipboardCheck,
  "/auditorias/programacao": CalendarClock,
  "/auditorias/biblioteca-do-auditor": Library,
  "/auditorias/biblioteca": Library,
  "/auditorias/banco-de-ncs": FileWarning,
  "/auditorias/prompts": MessageSquareText,
  "/auditorias/minha-biblioteca": BookMarked,
  "/auditorias/log": IdCard,
  "/auditorias/manual": BookOpen,
  "/sgi/riscos": ShieldAlert,
  "/sgi/oportunidades": Lightbulb,
  "/sgi/objetivos": Crosshair,
  "/sgi/analises-criticas": CalendarCheck,
  "/sgi/inovacao": Rocket,
  "/servicos/ordens": Wrench,
  "/servicos/nps": Smile,
  "/servicos/fornecedores": Factory,
  "/servicos/reclamacoes": MessageSquareWarning,
  "/servicos/contratos": FileSignature,
  "/seguranca/acidentes": Siren,
  "/seguranca/equipamentos": FireExtinguisher,
  "/seguranca/emergencia": LifeBuoy,
  "/seguranca/indicadores": Activity,
  "/seguranca/pgr": ShieldAlert,
  "/seguranca/requisitos-legais": Scale,
  "/seguranca/permissoes-de-trabalho": FileKey,
  "/seguranca/registros": MessagesSquare,
  "/seguranca/terceiros": Truck,
  "/seguranca/vencimentos": BadgeCheck,
  "/seguranca/entregas-de-epi": Shirt,
  "/seguranca/epis": Package,
  "/ambiental/aspectos": Sprout,
  "/ambiental/ocorrencias": Biohazard,
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
  "/integracoes": Network,
  "/ia": Sparkles,
};

export function IconeDoGrupo({ titulo }: { titulo: string }) {
  const I = ICONE_DO_GRUPO[titulo] ?? Building2;
  return (
    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-primaria-texto/15 shadow-[inset_0_1px_0_rgb(255_255_255/0.10)]">
      <I aria-hidden size={16} strokeWidth={1.75} className="text-white" />
    </span>
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
