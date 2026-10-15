"use client";

import { useActionState } from "react";
import type { Funcao, SetorDaEmpresa } from "@davinci/types";
import type { EstadoDaAcao } from "@/lib/acao";
import {
  mudarSituacaoDaEstrutura,
  salvarEstrutura,
} from "@/lib/acoes-cadastros";
import {
  botaoPerigo,
  botaoPrimario,
  botaoSecundario,
  campoCompacto,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

type Tipo = "setor" | "funcao";
type Item = SetorDaEmpresa | Funcao;

/** Nome (e CBO, na função) numa linha: cadastrar no topo da lista, renomear dentro da linha. */
export function FormularioDeEstrutura({
  tipo,
  item,
}: {
  tipo: Tipo;
  item?: Item;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    salvarEstrutura.bind(null, tipo, item?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const erro =
    erros.nome ??
    erros.cbo ??
    (estado.erro && !estado.erro.detalhes?.length
      ? estado.erro.mensagem
      : undefined);
  const sufixo = item?.id ?? "novo";
  const cbo = item && "cbo" in item ? (item.cbo ?? "") : "";
  return (
    <form action={enviar} noValidate className="flex flex-col gap-1.5">
      {item && <input type="hidden" name="versao" value={item.versao} />}
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="nome"
          aria-label={tipo === "setor" ? "Nome do setor" : "Nome da função"}
          placeholder={
            tipo === "setor" ? "Ex.: Produção" : "Ex.: Operador de prensa"
          }
          defaultValue={estado.valores?.nome ?? item?.nome}
          maxLength={100}
          id={`nome-${tipo}-${sufixo}`}
          className={`${campoCompacto} min-w-0 flex-1`}
          aria-invalid={Boolean(erros.nome)}
        />
        {tipo === "funcao" && (
          <input
            name="cbo"
            aria-label="CBO (opcional)"
            placeholder="CBO"
            inputMode="numeric"
            defaultValue={estado.valores?.cbo ?? cbo}
            maxLength={7}
            className={`${campoCompacto} w-24 font-mono`}
            aria-invalid={Boolean(erros.cbo)}
          />
        )}
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

export function SituacaoDaEstrutura({
  tipo,
  item,
}: {
  tipo: Tipo;
  item: Item;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    mudarSituacaoDaEstrutura.bind(null, tipo, item.id),
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
