"use client";

import type { Inspecao } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Formulario, Recolhido } from "@/components/formulario-de-acao";
import { cancelarInspecao } from "@/lib/acoes-inspecoes";
import { areaDeTexto } from "@/lib/estilos";

export function CancelarInspecao({ inspecao }: { inspecao: Inspecao }) {
  return (
    <Recolhido titulo="Cancelar esta inspeção">
      <p className="text-base text-texto-2">
        Use para inspeção criada por engano ou em duplicidade. Ela não é
        apagada: fica cancelada, com o motivo.
      </p>
      <Formulario
        acao={cancelarInspecao.bind(null, inspecao.id)}
        versao={inspecao.versao}
        rotuloDoBotao={`Cancelar ${inspecao.numero}`}
        perigo
      >
        {(erros, v) => (
          <Campo
            id="motivo"
            rotulo="Motivo do cancelamento"
            erro={erros.motivo}
          >
            <textarea
              id="motivo"
              name="motivo"
              rows={2}
              defaultValue={v.motivo}
              className={areaDeTexto}
              aria-invalid={Boolean(erros.motivo)}
            />
          </Campo>
        )}
      </Formulario>
    </Recolhido>
  );
}
