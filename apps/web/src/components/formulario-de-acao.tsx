"use client";

import { useActionState, type ReactNode } from "react";
import type { ErroPadrao } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import {
  botaoPerigo,
  botaoPrimario,
  painel,
  tituloDaSecao,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

export type EstadoDeFormulario = {
  erro?: ErroPadrao;
  valores?: Record<string, string>;
};
type Acao = (
  estado: EstadoDeFormulario,
  form: FormData,
) => Promise<EstadoDeFormulario>;

/** Formulário de uma ação de registro: erro geral no topo, erros de campo nos campos, versão lida enviada junto. */
export function Formulario({
  acao,
  versao,
  rotuloDoBotao,
  perigo = false,
  children,
}: {
  acao: Acao;
  versao: string;
  rotuloDoBotao: string;
  perigo?: boolean;
  children: (
    erros: Record<string, string>,
    valores: Record<string, string>,
    estado: EstadoDeFormulario,
  ) => ReactNode;
}) {
  const [estado, enviar, enviando] = useActionState<
    EstadoDeFormulario,
    FormData
  >(acao, {});
  const erros = errosPorCampo(estado.erro?.detalhes);
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;
  return (
    <form action={enviar} noValidate className="mt-4 flex flex-col gap-5">
      {erroGeral && <AvisoDeErro erro={erroGeral} />}
      <input type="hidden" name="versao" value={versao} />
      {children(erros, estado.valores ?? {}, estado)}
      <div>
        <button
          type="submit"
          className={perigo ? botaoPerigo : botaoPrimario}
          disabled={enviando}
        >
          {enviando ? "Salvando…" : rotuloDoBotao}
        </button>
      </div>
    </form>
  );
}

/** A ação principal do momento, em destaque. */
export function Bloco({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: ReactNode;
}) {
  return (
    <section className={`${painel} mt-6 p-5`}>
      <h2 className={tituloDaSecao}>{titulo}</h2>
      <p className="mt-1 text-base text-texto-2">{descricao}</p>
      {children}
    </section>
  );
}

/** Ação secundária (revisar, cancelar): recolhida para não competir com a principal. */
export function Recolhido({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <details className={`${painel} mt-4 px-5 py-3`}>
      <summary className="cursor-pointer text-base font-semibold text-texto-2">
        {titulo}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
