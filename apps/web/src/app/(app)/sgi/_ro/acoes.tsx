"use client";

import type { RiscoOuOportunidade } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Formulario, Recolhido } from "@/components/formulario-de-acao";
import { encerrarRo } from "@/lib/acoes-sgi";
import { areaDeTexto } from "@/lib/estilos";
import type { ConfigRo } from "./config";

export function EncerrarRo({
  cfg,
  ro,
}: {
  cfg: ConfigRo;
  ro: RiscoOuOportunidade;
}) {
  return (
    <Recolhido titulo="Encerrar com o resultado">
      <Formulario
        acao={encerrarRo.bind(null, cfg.base, ro.id)}
        versao={ro.versao}
        rotuloDoBotao="Encerrar"
      >
        {(erros, v) => (
          <Campo id="resultado" rotulo={cfg.resultado} erro={erros.resultado}>
            <textarea
              id="resultado"
              name="resultado"
              rows={2}
              maxLength={500}
              defaultValue={v.resultado}
              className={areaDeTexto}
            />
          </Campo>
        )}
      </Formulario>
    </Recolhido>
  );
}
