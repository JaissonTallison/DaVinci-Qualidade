"use client";

import { useActionState } from "react";
import {
  NORMAS,
  RISCOS_DA_EVIDENCIA,
  TIPOS_DE_EVIDENCIA,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import {
  criarEvidenciaPropria,
  type EstadoDaAcao,
} from "@/lib/acoes-auditorias";
import { botaoSecundario, campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

export function NovaEvidenciaPropria() {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    criarEvidenciaPropria,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  const selecao = (
    id: string,
    rotulo: string,
    opcoes: Record<string, string>,
  ) => (
    <Campo id={id} rotulo={rotulo} erro={erros[id]}>
      <Selecao id={id} name={id} defaultValue={v[id] ?? ""} className={campo}>
        <option value="">Escolha</option>
        {Object.entries(opcoes).map(([k, n]) => (
          <option key={k} value={k}>
            {n}
          </option>
        ))}
      </Selecao>
    </Campo>
  );
  return (
    <form action={enviar} noValidate className="flex flex-col gap-4">
      {estado.erro && !estado.erro.detalhes?.length && (
        <AvisoDeErro erro={estado.erro} />
      )}
      <div className="grid gap-4 sm:grid-cols-4">
        {selecao("norma", "Norma", NORMAS)}
        <Campo
          id="clausula"
          rotulo="Cláusula"
          erro={erros.clausula}
          ajuda="Ex.: 8.4.1 ou A.5.15"
        >
          <input
            id="clausula"
            name="clausula"
            maxLength={20}
            defaultValue={v.clausula}
            className={campo}
          />
        </Campo>
        {selecao("tipo", "Tipo", TIPOS_DE_EVIDENCIA)}
        {selecao("risco", "Risco se faltar", RISCOS_DA_EVIDENCIA)}
        <Campo
          id="titulo"
          rotulo="Título"
          erro={erros.titulo}
          className="sm:col-span-4"
        >
          <input
            id="titulo"
            name="titulo"
            maxLength={150}
            defaultValue={v.titulo}
            className={campo}
          />
        </Campo>
        <Campo
          id="oQuePedir"
          rotulo="O que pedir"
          erro={erros.oQuePedir}
          className="sm:col-span-2"
        >
          <input
            id="oQuePedir"
            name="oQuePedir"
            maxLength={500}
            defaultValue={v.oQuePedir}
            className={campo}
          />
        </Campo>
        <Campo
          id="exemplo"
          rotulo="Exemplo aceitável"
          erro={erros.exemplo}
          className="sm:col-span-2"
        >
          <input
            id="exemplo"
            name="exemplo"
            maxLength={500}
            defaultValue={v.exemplo}
            className={campo}
          />
        </Campo>
      </div>
      <div>
        <button type="submit" className={botaoSecundario} disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar na biblioteca"}
        </button>
      </div>
    </form>
  );
}
