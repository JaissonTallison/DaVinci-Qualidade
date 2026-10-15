import Link from "next/link";
import { IconeDaTela } from "./icones-do-menu";

/** Tela cujo ícone representa cada tipo de prazo (o ícone diz o assunto; o selo diz a situação). */
const TELA_DO_TIPO: Record<string, string> = {
  NC: "/qualidade/nao-conformidades",
  "Tarefa de plano": "/qualidade/planos-de-acao",
  Calibração: "/qualidade/calibracao",
  CAT: "/seguranca/acidentes",
  "Troca de EPI": "/seguranca/entregas-de-epi",
  "CA de EPI": "/seguranca/epis",
  "Ação do PGR": "/seguranca/pgr",
  "PT sem encerramento": "/seguranca/permissoes-de-trabalho",
  "Documento de terceiro": "/seguranca/terceiros",
  ASO: "/seguranca/vencimentos",
  Treinamento: "/cadastros/treinamentos",
  Risco: "/sgi/riscos-e-oportunidades",
  Oportunidade: "/sgi/riscos-e-oportunidades",
  Mudança: "/sgi/mudancas",
  "Análise crítica": "/sgi/analises-criticas",
  "Ordem de serviço": "/servicos/ordens",
  "Avaliação de fornecedor": "/servicos/fornecedores",
  "Renovação de licença": "/ambiental/licencas",
  "Validade de licença": "/ambiental/licencas",
  Condicionante: "/ambiental/licencas",
  "Avaliação de requisito legal": "/ambiental/requisitos",
  "Ação de aspecto ambiental": "/ambiental/aspectos",
  "CDF de resíduo": "/ambiental/residuos",
};

export type TomDoSelo = "vencido" | "proximo" | "aguardando";

const COR_DO_SELO: Record<TomDoSelo, string> = {
  vencido: "bg-nao-conforme/10 text-nao-conforme",
  proximo: "bg-atencao/10 text-atencao",
  aguardando: "bg-superficie-2 text-texto-2",
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
 * Linha de prazo ou pendência, igual no início, no sino e no painel de vencimentos: ícone do assunto em cinza (sem moldura),
 * título e contexto, selo de texto com a situação. A linha inteira é o link.
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
  return (
    <Link
      href={href}
      onClick={aoClicar}
      className={`flex items-center gap-3 transition-colors hover:bg-superficie-2 ${compacta ? "px-4 py-2" : "px-5 py-3"}`}
    >
      <span className="flex w-5 shrink-0 justify-center text-texto-3">
        <IconeDaTela href={icone} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base text-texto">{titulo}</span>
        {detalhe && (
          <span className="block truncate text-sm text-texto-2">{detalhe}</span>
        )}
      </span>
      <span
        className={`shrink-0 rounded-xs px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${COR_DO_SELO[tom]}`}
      >
        {selo}
      </span>
    </Link>
  );
}

/** "venceu há 61 dias" → "Venceu há 61 dias" (o selo começa com maiúscula). */
export function textoDoSelo(relativo: string): string {
  return relativo.charAt(0).toUpperCase() + relativo.slice(1);
}
