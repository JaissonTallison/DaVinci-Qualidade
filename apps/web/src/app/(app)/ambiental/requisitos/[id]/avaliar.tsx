"use client";

import type { RequisitoLegal } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Bloco, Formulario } from "@/components/formulario-de-acao";
import { Selecao } from "@/components/selecao";
import { avaliarRequisito } from "@/lib/acoes-ambiental";
import { hojeEmBrasilia } from "@/lib/datas";
import { campo } from "@/lib/estilos";

const RESULTADOS = {
  atende: "Atende",
  parcial: "Atende em parte",
  nao_atende: "Não atende",
};

export function AvaliarRequisito({ requisito }: { requisito: RequisitoLegal }) {
  return (
    <Bloco
      titulo="Avaliar atendimento"
      descricao="O que foi verificado e o resultado. Em parte ou não atende: diga a ação para passar a atender."
    >
      <Formulario
        acao={avaliarRequisito.bind(null, requisito.id)}
        versao={requisito.versao}
        rotuloDoBotao="Registrar avaliação"
      >
        {(erros, v) => (
          <div className="grid gap-5 sm:grid-cols-4">
            <Campo id="data" rotulo="Data" erro={erros.data}>
              <input
                id="data"
                name="data"
                type="date"
                defaultValue={v.data ?? hojeEmBrasilia()}
                className={campo}
              />
            </Campo>
            <Campo id="atendimento" rotulo="Resultado" erro={erros.atendimento}>
              <Selecao
                id="atendimento"
                name="atendimento"
                defaultValue={v.atendimento ?? ""}
                className={campo}
              >
                <option value="">Escolha</option>
                {Object.entries(RESULTADOS).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo
              id="evidencia"
              rotulo="Evidência verificada"
              erro={erros.evidencia}
              className="sm:col-span-2"
            >
              <input
                id="evidencia"
                name="evidencia"
                maxLength={500}
                defaultValue={v.evidencia}
                className={campo}
              />
            </Campo>
            <Campo
              id="acao"
              rotulo="Ação para atender (se não atende)"
              erro={erros.acao}
              className="sm:col-span-4"
            >
              <input
                id="acao"
                name="acao"
                maxLength={500}
                defaultValue={v.acao}
                className={campo}
              />
            </Campo>
          </div>
        )}
      </Formulario>
    </Bloco>
  );
}
