"use client";

import { useActionState } from "react";
import {
  LISTAS_CADASTRO,
  type ItemDeLista,
  type ListaCadastro,
} from "@davinci/types";
import type { EstadoDaAcao } from "@/lib/acao";
import { mudarSituacaoDoItem, salvarItemDeLista } from "@/lib/acoes-listas";
import {
  botaoPerigo,
  botaoPrimario,
  botaoSecundario,
  campoCompacto,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

/** Nome numa linha: cadastrar no topo da lista, renomear dentro da linha. */
export function FormularioDoItem({
  lista,
  item,
}: {
  lista: ListaCadastro;
  item?: ItemDeLista;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    salvarItemDeLista.bind(null, lista, item?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const erro =
    erros.nome ??
    (estado.erro && !estado.erro.detalhes?.length
      ? estado.erro.mensagem
      : undefined);
  const sufixo = item?.id ?? "novo";
  return (
    <form action={enviar} noValidate className="flex flex-col gap-1.5">
      {item && <input type="hidden" name="versao" value={item.versao} />}
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="nome"
          aria-label={`Nome · ${LISTAS_CADASTRO[lista].singular}`}
          placeholder={`Ex.: ${lista === "processo" ? "Produção" : "Falha humana"}`}
          defaultValue={estado.valores?.nome ?? item?.nome}
          maxLength={100}
          id={`nome-${lista}-${sufixo}`}
          className={`${campoCompacto} min-w-0 flex-1`}
          aria-invalid={Boolean(erros.nome)}
        />
        <button
          type="submit"
          className={item ? botaoSecundario : botaoPrimario}
          disabled={enviando}
        >
          {item ? "Salvar" : "Cadastrar"}
        </button>
      </div>
      {erro && <p className="text-sm text-nao-conforme">{erro}</p>}
    </form>
  );
}

export function SituacaoDoItem({
  lista,
  item,
}: {
  lista: ListaCadastro;
  item: ItemDeLista;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    mudarSituacaoDoItem.bind(null, lista, item.id),
    {},
  );
  return (
    <form action={enviar} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="versao" value={item.versao} />
      <input type="hidden" name="ativo" value={item.ativo ? "nao" : "sim"} />
      <button
        type="submit"
        className={`${item.ativo ? botaoPerigo : botaoSecundario} h-8 px-3 text-sm`}
        disabled={enviando}
      >
        {item.ativo ? "Inativar" : "Reativar"}
      </button>
      {estado.erro && (
        <p className="max-w-xs text-right text-sm text-nao-conforme">
          {estado.erro.mensagem}
        </p>
      )}
    </form>
  );
}
