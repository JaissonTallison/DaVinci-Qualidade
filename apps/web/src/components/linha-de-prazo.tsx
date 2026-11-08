import { ChevronRight } from "@/components/icones";
import Link from "next/link";
import { IconeDaTela } from "./icones-do-menu";
import { Selo } from "./selo";

/** Tela cujo ícone representa cada tipo de prazo (o ícone diz o assunto; o selo diz a situação). */
const TELA_DO_TIPO: Record<string, string> = {
  NC: "/qualidade/nao-conformidades",
  "Tarefa de plano": "/qualidade/planos-de-acao",
  Calibração: "/qualidade/calibracao",
  CAT: "/seguranca/acidentes",
  "Troca de EPI": "/seguranca/entregas-de-epi",
  "CA de EPI": "/seguranca/epis",
  "Ação do PGR": "/seguranca/pgr",
  "Revisão do PGR": "/seguranca/pgr",
  "PT sem encerramento": "/seguranca/permissoes-de-trabalho",
  "Documento de terceiro": "/seguranca/terceiros",
  ASO: "/seguranca/vencimentos",
  Treinamento: "/cadastros/treinamentos",
  Risco: "/sgi/riscos",
  Oportunidade: "/sgi/oportunidades",
  Inovação: "/sgi/inovacao",
  "Análise crítica": "/sgi/analises-criticas",
  "Ordem de serviço": "/servicos/ordens",
  "Avaliação de fornecedor": "/servicos/fornecedores",
  "Renovação de licença": "/ambiental/licencas",
  "Validade de licença": "/ambiental/licencas",
  Condicionante: "/ambiental/licencas",
  "Avaliação de requisito legal": "/ambiental/requisitos",
  "Ação de aspecto ambiental": "/ambiental/aspectos",
  "CDF de resíduo": "/ambiental/residuos",
  "Revisão de FDS": "/ambiental/produtos-quimicos",
  "Coleta de monitoramento": "/ambiental/monitoramentos",
  "Meta ESG": "/esg/temas",
};

export type TomDoSelo = "vencido" | "proximo" | "aguardando";

const TOM: Record<TomDoSelo, "perigo" | "atencao" | "neutro"> = {
  vencido: "perigo",
  proximo: "atencao",
  aguardando: "neutro",
};
const COR_DO_ICONE: Record<TomDoSelo, string> = {
  vencido: "text-nao-conforme-texto",
  proximo: "text-atencao-texto",
  aguardando: "text-texto-2",
};

/** Ícone do assunto: pelo tipo do prazo ou, sem tipo, pela tela de destino. */
export function telaDoIcone(tipo: string | undefined, href: string): string {
  if (tipo && TELA_DO_TIPO[tipo]) return TELA_DO_TIPO[tipo];
  return (
    Object.values(TELA_DO_TIPO).find((t) => href.startsWith(t)) ??
    href.split("?")[0]!
  );
}

/**
 * Linha de prazo ou pendência, igual no início, no sino e no painel de vencimentos: o assunto em destaque, o tipo
 * e o módulo embaixo, a situação em selo. A linha inteira é o link. Compacta (painel do sino): notificação do
 * design system, com o ícone solto na cor da situação e textos de 13/12 px.
 */
export function LinhaDePrazo({
  href,
  icone,
  titulo,
  detalhe,
  selo,
  tom,
  compacta = false,
  aoClicar,
}: {
  href: string;
  /** Tela cujo ícone aparece (use `telaDoIcone`). */
  icone: string;
  titulo: string;
  detalhe?: string;
  selo: string;
  tom: TomDoSelo;
  compacta?: boolean;
  aoClicar?: () => void;
}) {
  // "Revisão de FDS: Thinner 2750" → assunto em destaque; o tipo desce para a linha de contexto
  const i = titulo.indexOf(": ");
  const assunto = i > 0 ? titulo.slice(i + 2) : titulo;
  const contexto = [i > 0 ? titulo.slice(0, i) : null, detalhe]
    .filter(Boolean)
    .join(" · ");
  if (compacta)
    return (
      <Link
        href={href}
        onClick={aoClicar}
        className="flex gap-3 rounded-md p-2.5 transition-colors hover:bg-superficie-2"
      >
        <span className={`flex pt-0.5 ${COR_DO_ICONE[tom]}`}>
          <IconeDaTela href={icone} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-texto">
            {assunto}
          </span>
          <span className="mt-0.5 block truncate text-xs text-texto-2">
            {[contexto, selo].filter(Boolean).join(" · ")}
          </span>
        </span>
      </Link>
    );
  return (
    <Link
      href={href}
      onClick={aoClicar}
      className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-superficie-2"
    >
      <span className="flex shrink-0 text-texto-2">
        <IconeDaTela href={icone} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-medium text-texto">
          {assunto}
        </span>
        {contexto && (
          <span className="block truncate text-sm text-texto-2">
            {contexto}
          </span>
        )}
      </span>
      <Selo tom={TOM[tom]}>{selo}</Selo>
      <ChevronRight
        aria-hidden
        size={16}
        strokeWidth={1.75}
        className="-ml-1 shrink-0 text-texto-3 opacity-0 transition-opacity group-hover:opacity-100"
      />
    </Link>
  );
}

/** "venceu há 61 dias" → "Venceu há 61 dias" (o selo começa com maiúscula). */
export function textoDoSelo(relativo: string): string {
  return relativo.charAt(0).toUpperCase() + relativo.slice(1);
}
