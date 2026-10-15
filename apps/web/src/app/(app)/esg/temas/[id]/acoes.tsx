"use client";

import type { TemaEsg } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Bloco, Formulario, Recolhido } from "@/components/formulario-de-acao";
import { registrarAndamento, situacaoDoTema } from "@/lib/acoes-esg";
import { hojeEmBrasilia } from "@/lib/datas";
import { campo } from "@/lib/estilos";

export function RegistrarAndamento({ tema }: { tema: TemaEsg }) {
  return (
    <Bloco
      titulo="Registrar andamento da meta"
      descricao="Quanto da meta já foi atingido e o que foi feito. Com 100%, o prazo sai dos vencimentos."
    >
      <Formulario
        acao={registrarAndamento.bind(null, tema.id)}
        versao={tema.versao}
        rotuloDoBotao="Registrar"
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
            <Campo id="progresso" rotulo="Atingido (%)" erro={erros.progresso}>
              <input
                id="progresso"
                name="progresso"
                type="number"
                min={0}
                max={100}
                defaultValue={v.progresso ?? tema.progresso}
                className={campo}
              />
            </Campo>
            <Campo
              id="comentario"
              rotulo="O que foi feito"
              erro={erros.comentario}
              className="sm:col-span-2"
            >
              <input
                id="comentario"
                name="comentario"
                maxLength={500}
                defaultValue={v.comentario}
                className={campo}
              />
            </Campo>
          </div>
        )}
      </Formulario>
    </Bloco>
  );
}

/** Inativar: o tema não se aplica à empresa (fica guardado). Gestor (esg.excluir). */
export function SituacaoDoTema({ tema }: { tema: TemaEsg }) {
  return (
    <Recolhido titulo={tema.ativo ? "Inativar o tema" : "Reativar o tema"}>
      <p className="text-base text-texto-2">
        {tema.ativo
          ? "Use quando o tema não se aplica à empresa. Sai da matriz, dos ODS e do painel."
          : "Volta para a matriz, os ODS e o painel."}
      </p>
      <Formulario
        acao={situacaoDoTema.bind(null, tema.id, !tema.ativo)}
        versao={tema.versao}
        rotuloDoBotao={tema.ativo ? "Inativar" : "Reativar"}
        perigo={tema.ativo}
      >
        {() => null}
      </Formulario>
    </Recolhido>
  );
}
