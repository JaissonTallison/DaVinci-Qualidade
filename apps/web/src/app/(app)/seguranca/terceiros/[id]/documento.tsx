"use client";

import { TIPOS_DOC_TERCEIRO } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Formulario, Recolhido } from "@/components/formulario-de-acao";
import { Selecao } from "@/components/selecao";
import { registrarDocumentoDoTerceiro } from "@/lib/acoes-terceiros";
import { campo } from "@/lib/estilos";

export function RegistrarDocumento({
  id,
  versao,
}: {
  id: string;
  versao: string;
}) {
  return (
    <Recolhido titulo="Registrar documento">
      <p className="text-base text-texto-2">
        Documento novo do mesmo tipo substitui o anterior. O arquivo entra em
        Anexos, logo abaixo.
      </p>
      <Formulario
        acao={registrarDocumentoDoTerceiro.bind(null, id)}
        versao={versao}
        rotuloDoBotao="Registrar documento"
      >
        {(erros, v) => (
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo id="tipo" rotulo="Tipo" erro={erros.tipo}>
              <Selecao
                id="tipo"
                name="tipo"
                defaultValue={v.tipo ?? ""}
                className={campo}
                aria-invalid={Boolean(erros.tipo)}
              >
                <option value="">Escolha</option>
                {Object.entries(TIPOS_DOC_TERCEIRO).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo id="validade" rotulo="Válido até" erro={erros.validade}>
              <input
                id="validade"
                name="validade"
                type="date"
                defaultValue={v.validade}
                className={campo}
                aria-invalid={Boolean(erros.validade)}
              />
            </Campo>
            <Campo
              id="descricao"
              rotulo="Descrição (opcional)"
              erro={erros.descricao}
            >
              <input
                id="descricao"
                name="descricao"
                maxLength={150}
                defaultValue={v.descricao}
                className={campo}
              />
            </Campo>
          </div>
        )}
      </Formulario>
    </Recolhido>
  );
}
