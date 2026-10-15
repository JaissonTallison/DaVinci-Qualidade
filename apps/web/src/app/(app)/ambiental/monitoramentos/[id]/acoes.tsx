"use client";

import type { Monitoramento } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Bloco, Formulario, Recolhido } from "@/components/formulario-de-acao";
import {
  registrarResultado,
  situacaoDoMonitoramento,
} from "@/lib/acoes-ambiental";
import { hojeEmBrasilia } from "@/lib/datas";
import { campo } from "@/lib/estilos";

export function RegistrarResultado({
  monitoramento: m,
}: {
  monitoramento: Monitoramento;
}) {
  return (
    <Bloco
      titulo="Registrar resultado"
      descricao={`Valor do laudo em ${m.unidade}. A conformidade com o limite é calculada na hora.`}
    >
      <Formulario
        acao={registrarResultado.bind(null, m.id)}
        versao={m.versao}
        rotuloDoBotao="Registrar"
      >
        {(erros, v) => (
          <div className="grid gap-5 sm:grid-cols-4">
            <Campo id="data" rotulo="Data da coleta" erro={erros.data}>
              <input
                id="data"
                name="data"
                type="date"
                defaultValue={v.data ?? hojeEmBrasilia()}
                className={campo}
              />
            </Campo>
            <Campo
              id="valor"
              rotulo={`Resultado (${m.unidade})`}
              erro={erros.valor}
            >
              <input
                id="valor"
                name="valor"
                inputMode="decimal"
                defaultValue={v.valor}
                className={campo}
              />
            </Campo>
            <Campo
              id="laudo"
              rotulo="Nº do laudo (opcional)"
              erro={erros.laudo}
              className="sm:col-span-2"
            >
              <input
                id="laudo"
                name="laudo"
                maxLength={100}
                defaultValue={v.laudo}
                className={campo}
              />
            </Campo>
          </div>
        )}
      </Formulario>
    </Bloco>
  );
}

/** Inativar: o ponto deixa de ser monitorado (os resultados ficam guardados). Gestor (ambiental.excluir). */
export function SituacaoDoMonitoramento({
  monitoramento: m,
}: {
  monitoramento: Monitoramento;
}) {
  return (
    <Recolhido
      titulo={m.ativo ? "Inativar o monitoramento" : "Reativar o monitoramento"}
    >
      <p className="text-base text-texto-2">
        {m.ativo
          ? "Use quando o ponto deixou de existir ou a licença dispensou a coleta."
          : "Volta para os prazos de coleta."}
      </p>
      <Formulario
        acao={situacaoDoMonitoramento.bind(null, m.id, !m.ativo)}
        versao={m.versao}
        rotuloDoBotao={m.ativo ? "Inativar" : "Reativar"}
        perigo={m.ativo}
      >
        {() => null}
      </Formulario>
    </Recolhido>
  );
}
