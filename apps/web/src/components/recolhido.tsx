import type { ReactNode } from "react";
import {
  Ban,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  KeyRound,
  type LucideIcon,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Trash2,
} from "@/components/icones";
import { painel } from "@/lib/estilos";

/**
 * Seção recolhível (interface.md §8): ações secundárias e formulários que não competem com o conteúdo
 * principal. Card com cabeçalho clicável: ícone da ação à esquerda, título de 15 px, descrição opcional e o
 * chevron num quadrado à direita (para baixo fechado, para cima aberto). Sem o triângulo do navegador.
 * `aberto` abre ao carregar (lista vazia, pendência a resolver); `fixo` não recolhe: vira um card normal,
 * para conteúdo que a pessoa sempre precisa ver.
 */

type Tipo =
  | "criar"
  | "editar"
  | "perigo"
  | "reativar"
  | "enviar"
  | "chave"
  | "avaliar"
  | "leitura";

/** O ícone sai do verbo do título: Cadastrar cria, Editar edita, Cancelar/Inativar é perigo… */
function tipoDoTitulo(titulo: string): Tipo {
  const t = titulo.toLowerCase();
  if (
    /^(cancelar|inativar|tirar|desligar|remover|desativar|encerrar|risco eliminado)/.test(
      t,
    )
  )
    return "perigo";
  if (/^(reativar|readmitir|devolver|voltar)/.test(t)) return "reativar";
  if (
    /^(editar|corrigir|revisar|reavaliar|alterar|trocar|situação|informar)/.test(
      t,
    )
  )
    return "editar";
  if (/^enviar/.test(t)) return "enviar";
  if (/^gerar senha/.test(t)) return "chave";
  if (/^avaliar/.test(t)) return "avaliar";
  if (/^(como funciona|base legal|assistente|descrição)/.test(t))
    return "leitura";
  return "criar";
}

const ICONES: Record<Tipo, LucideIcon> = {
  criar: Plus,
  editar: Pencil,
  perigo: Ban,
  reativar: RotateCcw,
  enviar: Send,
  chave: KeyRound,
  avaliar: ClipboardCheck,
  leitura: BookOpen,
};

function Titulo({
  titulo,
  descricao,
  tipo,
}: {
  titulo: string;
  descricao?: string;
  tipo: Tipo;
}) {
  const Icone =
    tipo === "perigo" && /^remover/i.test(titulo) ? Trash2 : ICONES[tipo];
  return (
    <>
      <Icone
        aria-hidden
        size={18}
        strokeWidth={1.75}
        className={`shrink-0 ${tipo === "perigo" ? "text-nao-conforme-texto" : "text-texto-2"}`}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-md font-semibold text-texto">{titulo}</span>
        {descricao && (
          <span className="mt-0.5 block text-sm text-texto-2">{descricao}</span>
        )}
      </span>
    </>
  );
}

export function Recolhido({
  titulo,
  descricao,
  aberto = false,
  fixo = false,
  children,
}: {
  titulo: string;
  /** Uma linha do que se faz ali (aparece mesmo fechado). */
  descricao?: string;
  /** Abre ao carregar a tela. */
  aberto?: boolean;
  /** Sempre aberto, sem chevron: card normal com o mesmo cabeçalho. */
  fixo?: boolean;
  children: ReactNode;
}) {
  const tipo = tipoDoTitulo(titulo);
  if (fixo)
    return (
      <section className={`${painel} mt-4`}>
        <header className="flex min-h-13 items-center gap-3 border-b border-borda px-5 py-3">
          <Titulo titulo={titulo} descricao={descricao} tipo={tipo} />
        </header>
        <div className="p-5">{children}</div>
      </section>
    );
  return (
    <details className={`${painel} group mt-4`} open={aberto || undefined}>
      <summary className="flex min-h-13 cursor-pointer list-none items-center gap-3 rounded-md px-5 py-3 transition-colors select-none hover:bg-superficie-2 focus-visible:outline-2 focus-visible:outline-foco group-open:rounded-b-none [&::-webkit-details-marker]:hidden">
        <Titulo titulo={titulo} descricao={descricao} tipo={tipo} />
        <span
          aria-hidden
          className="grid size-7 shrink-0 place-items-center rounded-campo border border-borda-campo bg-superficie text-texto-2 shadow-xs group-hover:border-borda-forte group-hover:text-texto"
        >
          <ChevronDown
            size={16}
            strokeWidth={1.75}
            className="group-open:hidden"
          />
          <ChevronUp
            size={16}
            strokeWidth={1.75}
            className="hidden group-open:block"
          />
        </span>
      </summary>
      <div className="border-t border-borda p-5">{children}</div>
    </details>
  );
}
