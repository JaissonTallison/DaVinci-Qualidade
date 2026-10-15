"use client";

import type { Mudanca } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Bloco, Formulario } from "@/components/formulario-de-acao";
import { decidirMudanca, implementarMudanca } from "@/lib/acoes-sgi";
import { campo } from "@/lib/estilos";

export function DecidirMudanca({ mudanca }: { mudanca: Mudanca }) {
  return (
    <Bloco
      titulo="Decidir"
      descricao="Confira se os impactos foram tratados antes de aprovar."
    >
      <Formulario
        acao={decidirMudanca.bind(null, mudanca.id)}
        versao={mudanca.versao}
        rotuloDoBotao="Registrar decisão"
      >
        {(erros, v) => (
          <>
            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-sm font-semibold text-texto-2">
                Decisão
              </legend>
              <div className="flex gap-6 text-base">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="decisao"
                    value="aprovar"
                    defaultChecked={v.decisao === "aprovar"}
                  />{" "}
                  Aprovar
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="decisao"
                    value="rejeitar"
                    defaultChecked={v.decisao === "rejeitar"}
                  />{" "}
                  Rejeitar
                </label>
              </div>
              {erros.aprovar && (
                <p className="text-sm text-nao-conforme">{erros.aprovar}</p>
              )}
            </fieldset>
            <Campo id="parecer" rotulo="Parecer" erro={erros.parecer}>
              <input
                id="parecer"
                name="parecer"
                maxLength={500}
                defaultValue={v.parecer}
                className={campo}
              />
            </Campo>
          </>
        )}
      </Formulario>
    </Bloco>
  );
}

export function ImplementarMudanca({ mudanca }: { mudanca: Mudanca }) {
  return (
    <Bloco
      titulo="Registrar a implementação"
      descricao="Diga como foi verificado que a mudança funcionou sem efeitos indesejados."
    >
      <Formulario
        acao={implementarMudanca.bind(null, mudanca.id)}
        versao={mudanca.versao}
        rotuloDoBotao="Marcar como implementada"
      >
        {(erros, v) => (
          <Campo id="verificacao" rotulo="Verificação" erro={erros.verificacao}>
            <input
              id="verificacao"
              name="verificacao"
              maxLength={500}
              defaultValue={v.verificacao}
              className={campo}
            />
          </Campo>
        )}
      </Formulario>
    </Bloco>
  );
}
