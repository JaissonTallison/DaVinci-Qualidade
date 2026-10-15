"use client";

import type { Risco } from "@davinci/types";
import { Formulario, Recolhido } from "@/components/formulario-de-acao";
import { mudarSituacaoDoRisco } from "@/lib/acoes-pgr-pt";

export function SituacaoDoRisco({ risco }: { risco: Risco }) {
  return (
    <Recolhido
      titulo={risco.ativo ? "Risco eliminado" : "Voltar ao inventário"}
    >
      <p className="text-base text-texto-2">
        {risco.ativo
          ? "Quando a fonte do perigo deixa de existir (máquina retirada, atividade encerrada), o risco sai do inventário. O registro fica guardado."
          : "O risco volta para o inventário ativo."}
      </p>
      <Formulario
        acao={mudarSituacaoDoRisco.bind(null, risco.id)}
        versao={risco.versao}
        rotuloDoBotao={
          risco.ativo ? "Marcar como eliminado" : "Voltar ao inventário"
        }
        perigo={risco.ativo}
      >
        {() => (
          <input
            type="hidden"
            name="ativo"
            value={risco.ativo ? "nao" : "sim"}
          />
        )}
      </Formulario>
    </Recolhido>
  );
}
