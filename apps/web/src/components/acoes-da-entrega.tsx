"use client";

import { useActionState, type ReactNode } from "react";
import type { EntregaEpi } from "@davinci/types";
import { anularEntrega, devolverEntrega } from "@/lib/acoes-epis";
import type { EstadoDaAcao } from "@/lib/acao";
import { hojeEmBrasilia } from "@/lib/datas";
import { botaoPerigo, botaoSecundario, campoCompacto } from "@/lib/estilos";

/** Devolver: o EPI saiu do uso e não vence mais. `voltar` é a tela para onde a ação retorna. */
export function DevolverEntrega({
  entrega,
  voltar,
}: {
  entrega: EntregaEpi;
  voltar: string;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    devolverEntrega.bind(null, entrega.id),
    {},
  );
  return (
    <Janela rotulo="Devolver" erro={estado}>
      <form action={enviar} className="flex flex-col gap-2">
        <input type="hidden" name="voltar" value={voltar} />
        <label
          htmlFor={`devolucao-${entrega.id}`}
          className="text-sm font-semibold text-texto-2"
        >
          Data da devolução
        </label>
        <input
          id={`devolucao-${entrega.id}`}
          name="data"
          type="date"
          min={entrega.data}
          max={hojeEmBrasilia()}
          defaultValue={estado.valores?.data ?? hojeEmBrasilia()}
          className={`${campoCompacto} w-full`}
        />
        <button type="submit" className={botaoSecundario} disabled={enviando}>
          Registrar devolução
        </button>
      </form>
    </Janela>
  );
}

/** Anular (gestor): a entrega fica na ficha, riscada, com o motivo. */
export function AnularEntrega({
  entrega,
  voltar,
}: {
  entrega: EntregaEpi;
  voltar: string;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    anularEntrega.bind(null, entrega.id),
    {},
  );
  return (
    <Janela rotulo="Anular" erro={estado}>
      <form action={enviar} className="flex flex-col gap-2">
        <input type="hidden" name="voltar" value={voltar} />
        <label
          htmlFor={`anulacao-${entrega.id}`}
          className="text-sm font-semibold text-texto-2"
        >
          Por que anular esta entrega?
        </label>
        <input
          id={`anulacao-${entrega.id}`}
          name="motivo"
          maxLength={300}
          defaultValue={estado.valores?.motivo}
          className={`${campoCompacto} w-full`}
        />
        <button type="submit" className={botaoPerigo} disabled={enviando}>
          Anular entrega
        </button>
      </form>
    </Janela>
  );
}

function Janela({
  rotulo,
  erro: estado,
  children,
}: {
  rotulo: string;
  erro: EstadoDaAcao;
  children: ReactNode;
}) {
  const erro =
    estado.erro &&
    (estado.erro.detalhes?.[0]?.mensagem ?? estado.erro.mensagem);
  return (
    <details className="relative inline-block text-left" open={Boolean(erro)}>
      <summary className="cursor-pointer list-none text-sm text-texto-2 hover:text-texto hover:underline">
        {rotulo}
      </summary>
      <div className="absolute right-0 z-10 mt-1 w-72 rounded-md border border-borda bg-superficie p-3 shadow-sm">
        {children}
        {erro && <p className="mt-2 text-sm text-nao-conforme">{erro}</p>}
      </div>
    </details>
  );
}
