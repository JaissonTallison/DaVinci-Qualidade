"use client";

import { useActionState } from "react";
import type { ParceiroResumo } from "@davinci/types";
import { Campo } from "@/components/campo";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import type { EstadoDaAcao } from "@/lib/acao";
import { criarConvite } from "@/lib/acoes-servicos";
import { EscolhaDeParceiro } from "../escolha-de-parceiro";
import { Botao } from "@/components/botao";

/** Gera o link da pesquisa para um cliente (sem OS). */
export function NovoConvite({ clientes }: { clientes: ParceiroResumo[] }) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    criarConvite.bind(null, "/servicos/nps"),
    {},
  );
  return (
    <form action={enviar} className="flex flex-wrap items-end gap-3">
      {estado.erro && <AvisoDeErro erro={estado.erro} />}
      <Campo id="convite-cliente" rotulo="Cliente" className="min-w-72 flex-1">
        <EscolhaDeParceiro
          id="clienteId"
          parceiros={clientes}
          valor={estado.valores?.clienteId}
          invalido={false}
        />
      </Campo>
      <Botao
        type="submit"
        carregando={enviando}
        textoCarregando="Gerando…"
        variante="primario"
      >
        Gerar link
      </Botao>
    </form>
  );
}
