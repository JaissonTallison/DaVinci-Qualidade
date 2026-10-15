"use client";

import type { PermissaoDeTrabalho } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Bloco, Formulario, Recolhido } from "@/components/formulario-de-acao";
import { cancelarPt, encerrarPt, liberarPt } from "@/lib/acoes-pgr-pt";
import { campo } from "@/lib/estilos";

export function LiberarPt({ pt }: { pt: PermissaoDeTrabalho }) {
  return (
    <Bloco
      titulo="Liberar a PT"
      descricao="Confira no local que as medidas de controle estão no lugar antes de liberar. Quem solicitou não pode liberar."
    >
      <Formulario
        acao={liberarPt.bind(null, pt.id)}
        versao={pt.versao}
        rotuloDoBotao="Liberar PT"
      >
        {() => null}
      </Formulario>
    </Bloco>
  );
}

export function EncerrarPt({ pt }: { pt: PermissaoDeTrabalho }) {
  return (
    <Bloco
      titulo="Encerrar a PT"
      descricao={
        pt.vencida
          ? "O horário da PT passou. Encerre assim que a área estiver liberada; se o serviço continua, emita outra PT."
          : "Ao terminar o serviço, encerre com a área limpa e liberada."
      }
    >
      <Formulario
        acao={encerrarPt.bind(null, pt.id)}
        versao={pt.versao}
        rotuloDoBotao="Encerrar PT"
      >
        {(erros, v) => (
          <Campo
            id="observacao"
            rotulo="Observação (opcional)"
            erro={erros.observacao}
          >
            <input
              id="observacao"
              name="observacao"
              maxLength={500}
              defaultValue={v.observacao}
              className={campo}
            />
          </Campo>
        )}
      </Formulario>
    </Bloco>
  );
}

export function CancelarPt({ pt }: { pt: PermissaoDeTrabalho }) {
  return (
    <Recolhido titulo="Cancelar a PT">
      <Formulario
        acao={cancelarPt.bind(null, pt.id)}
        versao={pt.versao}
        rotuloDoBotao="Cancelar PT"
        perigo
      >
        {(erros, v) => (
          <Campo id="motivo" rotulo="Motivo" erro={erros.motivo}>
            <input
              id="motivo"
              name="motivo"
              maxLength={300}
              defaultValue={v.motivo}
              className={campo}
            />
          </Campo>
        )}
      </Formulario>
    </Recolhido>
  );
}
