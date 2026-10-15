"use client";

import type { Epi } from "@davinci/types";
import { Formulario, Recolhido } from "@/components/formulario-de-acao";
import { mudarSituacaoDoEpi } from "@/lib/acoes-epis";

export function SituacaoDoEpi({ epi }: { epi: Epi }) {
  return (
    <Recolhido titulo={epi.ativo ? "Inativar" : "Reativar"}>
      <p className="text-base text-texto-2">
        {epi.ativo
          ? "Inativo, o EPI sai da escolha na entrega. As entregas antigas continuam na ficha."
          : "Ativo, o EPI volta para a escolha na entrega."}
      </p>
      <Formulario
        acao={mudarSituacaoDoEpi.bind(null, epi.id)}
        versao={epi.versao}
        rotuloDoBotao={epi.ativo ? "Inativar EPI" : "Reativar EPI"}
        perigo={epi.ativo}
      >
        {() => (
          <input type="hidden" name="ativo" value={epi.ativo ? "nao" : "sim"} />
        )}
      </Formulario>
    </Recolhido>
  );
}
