"use client";

import type { Auditoria } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Formulario } from "@/components/formulario-de-acao";
import { salvarPlanoDaAuditoria } from "@/lib/acoes-auditorias";
import { areaDeTexto } from "@/lib/estilos";

/** Pontos fortes observados: entram no relatório antes da conclusão. */
export function PontosFortes({ auditoria: a }: { auditoria: Auditoria }) {
  return (
    <Formulario
      acao={salvarPlanoDaAuditoria.bind(
        null,
        a.id,
        a.plano,
        `/auditorias/${a.id}/relatorio?aviso=pontos#encerramento`,
      )}
      versao={a.versao}
      rotuloDoBotao="Salvar pontos fortes"
    >
      {(erros, v) => (
        <Campo
          id="pontosFortes"
          rotulo="Pontos fortes observados"
          erro={erros.pontosFortes}
          ajuda="Um por linha. Ex.: indicadores de processo analisados mensalmente com ação registrada."
        >
          <textarea
            id="pontosFortes"
            name="pontosFortes"
            rows={4}
            defaultValue={v.pontosFortes ?? a.plano.pontosFortes ?? ""}
            className={areaDeTexto}
          />
        </Campo>
      )}
    </Formulario>
  );
}
