"use client";

import type { RiscoOuOportunidade } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Formulario, Recolhido } from "@/components/formulario-de-acao";
import { encerrarRo } from "@/lib/acoes-sgi";
import { campo } from "@/lib/estilos";

export function EncerrarRo({ ro }: { ro: RiscoOuOportunidade }) {
  return (
    <Recolhido titulo="Encerrar com o resultado">
      <Formulario
        acao={encerrarRo.bind(null, ro.id)}
        versao={ro.versao}
        rotuloDoBotao="Encerrar"
      >
        {(erros, v) => (
          <Campo
            id="resultado"
            rotulo="Resultado do tratamento"
            erro={erros.resultado}
          >
            <input
              id="resultado"
              name="resultado"
              maxLength={500}
              defaultValue={v.resultado}
              className={campo}
            />
          </Campo>
        )}
      </Formulario>
    </Recolhido>
  );
}
