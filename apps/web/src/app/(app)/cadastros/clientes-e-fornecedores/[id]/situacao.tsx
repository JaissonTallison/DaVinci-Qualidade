"use client";

import type { Parceiro } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Formulario, Recolhido } from "@/components/formulario-de-acao";
import { inativarParceiro, reativarParceiro } from "@/lib/acoes-parceiros";
import { campo } from "@/lib/estilos";

export function SituacaoDoParceiro({ parceiro }: { parceiro: Parceiro }) {
  if (!parceiro.ativo)
    return (
      <Recolhido titulo="Reativar">
        <Formulario
          acao={reativarParceiro.bind(null, parceiro.id)}
          versao={parceiro.versao}
          rotuloDoBotao="Reativar"
        >
          {() => null}
        </Formulario>
      </Recolhido>
    );
  return (
    <Recolhido titulo="Inativar">
      <p className="text-base text-texto-2">
        Inativo, sai das listas de escolha. O histórico (ordens de serviço,
        avaliações) continua.
      </p>
      <Formulario
        acao={inativarParceiro.bind(null, parceiro.id)}
        versao={parceiro.versao}
        rotuloDoBotao="Inativar"
        perigo
      >
        {(erros, v) => (
          <Campo id="motivo" rotulo="Motivo" erro={erros.motivo}>
            <input
              id="motivo"
              name="motivo"
              maxLength={500}
              defaultValue={v.motivo}
              className={campo}
            />
          </Campo>
        )}
      </Formulario>
    </Recolhido>
  );
}
