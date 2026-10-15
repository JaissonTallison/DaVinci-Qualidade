"use client";

import type { AspectoAmbiental } from "@davinci/types";
import { Formulario, Recolhido } from "@/components/formulario-de-acao";
import { situacaoDoAspecto } from "@/lib/acoes-ambiental";

/** Inativar tira o aspecto do levantamento sem apagar o histórico. Gestor (ambiental.excluir). */
export function SituacaoDoAspecto({ aspecto }: { aspecto: AspectoAmbiental }) {
  return (
    <Recolhido
      titulo={aspecto.ativo ? "Inativar o aspecto" : "Reativar o aspecto"}
    >
      <p className="text-base text-texto-2">
        {aspecto.ativo
          ? "Use quando a atividade deixou de existir. O registro fica guardado e pode ser reativado."
          : "Volta para o levantamento e para os prazos."}
      </p>
      <Formulario
        acao={situacaoDoAspecto.bind(null, aspecto.id, !aspecto.ativo)}
        versao={aspecto.versao}
        rotuloDoBotao={aspecto.ativo ? "Inativar" : "Reativar"}
        perigo={aspecto.ativo}
      >
        {() => null}
      </Formulario>
    </Recolhido>
  );
}
