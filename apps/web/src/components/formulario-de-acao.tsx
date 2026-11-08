"use client";

import { useActionState, type ReactNode } from "react";
import type { ErroPadrao } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { cabecalhoDoPainel, painel, tituloDoPainel } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Botao } from "@/components/botao";

export type EstadoDeFormulario = {
  erro?: ErroPadrao;
  valores?: Record<string, string>;
};
type Acao = (
  estado: EstadoDeFormulario,
  form: FormData,
) => Promise<EstadoDeFormulario>;

type PropsDoFormulario = {
  acao: Acao;
  versao: string;
  rotuloDoBotao: string;
  perigo?: boolean;
  children: (
    erros: Record<string, string>,
    valores: Record<string, string>,
    estado: EstadoDeFormulario,
  ) => ReactNode;
};

/**
 * Formulário de uma ação de registro: erro geral no topo, erros de campo nos campos, versão lida enviada junto.
 * Recomeça do zero quando a versão do registro muda: outra ação na mesma tela (ex.: formalizar a NC) não deixa
 * aqui um erro que já não vale (ex.: "formalize a NC pendente").
 */
export function Formulario(props: PropsDoFormulario) {
  return <FormularioDaVersao key={props.versao} {...props} />;
}

function FormularioDaVersao({
  acao,
  versao,
  rotuloDoBotao,
  perigo = false,
  children,
}: PropsDoFormulario) {
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
        <Botao
          type="submit"
          variante={perigo ? "perigo" : "primario"}
          carregando={enviando}
          textoCarregando="Salvando…"
        >
          {rotuloDoBotao}
        </Botao>
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
    <section className={`${painel} mt-6`}>
      <header className={cabecalhoDoPainel}>
        <div className="min-w-0">
          <h2 className={tituloDoPainel}>{titulo}</h2>
          <p className="text-sm text-texto-2">{descricao}</p>
        </div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
