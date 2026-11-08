"use client";

import { useActionState } from "react";
import type { ModeloDeInspecao } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import {
  mudarSituacaoDoModelo,
  type EstadoDaAcao,
} from "@/lib/acoes-inspecoes";
import { Botao } from "@/components/botao";

/** Modelo não se apaga: inativar tira da escolha ao criar inspeção; as inspeções feitas com ele continuam. */
export function SituacaoDoModelo({ modelo }: { modelo: ModeloDeInspecao }) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    mudarSituacaoDoModelo.bind(null, modelo.id),
    {},
  );
  return (
    <Recolhido
      titulo={modelo.ativo ? "Inativar este modelo" : "Reativar este modelo"}
    >
      <form action={enviar} className="flex flex-col items-start gap-3">
        <input type="hidden" name="versao" value={modelo.versao} />
        {estado.erro && <AvisoDeErro erro={estado.erro} />}
        <p className="text-base text-texto-2">
          {modelo.ativo
            ? "Inativo, o modelo some da escolha ao criar uma inspeção. As inspeções já feitas com ele não mudam."
            : "Reativado, o modelo volta a aparecer na escolha."}
        </p>
        <Botao
          type="submit"
          name="acao"
          value={modelo.ativo ? "inativar" : "reativar"}
          variante={modelo.ativo ? "perigo" : "secundario"}
          carregando={enviando}
        >
          {modelo.ativo ? "Inativar modelo" : "Reativar modelo"}
        </Botao>
      </form>
    </Recolhido>
  );
}
