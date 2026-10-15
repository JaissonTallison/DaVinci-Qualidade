"use client";

import type { Funcionario } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Formulario, Recolhido } from "@/components/formulario-de-acao";
import {
  desligarFuncionario,
  readmitirFuncionario,
} from "@/lib/acoes-cadastros";
import { hojeEmBrasilia } from "@/lib/datas";
import { campo } from "@/lib/estilos";

export function DesligarFuncionario({
  funcionario,
}: {
  funcionario: Funcionario;
}) {
  return (
    <Recolhido titulo="Desligar">
      <p className="text-base text-texto-2">
        Desligado, o funcionário sai das listas e não recebe EPI. O histórico
        (fichas, entregas, acidentes) continua guardado.
      </p>
      <Formulario
        acao={desligarFuncionario.bind(null, funcionario.id)}
        versao={funcionario.versao}
        rotuloDoBotao="Desligar funcionário"
        perigo
      >
        {(erros, v) => (
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo id="data" rotulo="Data do desligamento" erro={erros.data}>
              <input
                id="data"
                name="data"
                type="date"
                min={funcionario.admissao}
                max={hojeEmBrasilia()}
                defaultValue={v.data ?? hojeEmBrasilia()}
                className={campo}
                aria-invalid={Boolean(erros.data)}
              />
            </Campo>
            <Campo
              id="motivo"
              rotulo="Motivo (opcional)"
              erro={erros.motivo}
              className="sm:col-span-2"
            >
              <input
                id="motivo"
                name="motivo"
                maxLength={300}
                defaultValue={v.motivo}
                className={campo}
              />
            </Campo>
          </div>
        )}
      </Formulario>
    </Recolhido>
  );
}

export function ReadmitirFuncionario({
  funcionario,
}: {
  funcionario: Funcionario;
}) {
  return (
    <Recolhido titulo="Readmitir">
      <p className="text-base text-texto-2">
        Volta à lista de ativos com a mesma matrícula. O setor e a função
        precisam estar ativos.
      </p>
      <Formulario
        acao={readmitirFuncionario.bind(null, funcionario.id)}
        versao={funcionario.versao}
        rotuloDoBotao="Readmitir funcionário"
      >
        {() => null}
      </Formulario>
    </Recolhido>
  );
}
