"use client";

import { useState, useTransition } from "react";
import type { ServicoDoCatalogo } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Formulario } from "@/components/formulario-de-acao";
import {
  atualizarServicoDoCatalogo,
  criarServicoDoCatalogo,
  mudarSituacaoDoServico,
} from "@/lib/acoes-servicos";
import { areaDeTexto, campo } from "@/lib/estilos";

function Campos({
  erros,
  v,
  s,
}: {
  erros: Record<string, string>;
  v: Record<string, string>;
  s?: ServicoDoCatalogo;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-4">
        <Campo
          id="nome"
          rotulo="Serviço"
          erro={erros.nome}
          className="sm:col-span-3"
        >
          <input
            id="nome"
            name="nome"
            maxLength={120}
            defaultValue={v.nome ?? s?.nome}
            className={campo}
          />
        </Campo>
        <Campo id="horasPadrao" rotulo="Horas padrão" erro={erros.horasPadrao}>
          <input
            id="horasPadrao"
            name="horasPadrao"
            inputMode="decimal"
            defaultValue={v.horasPadrao ?? s?.horasPadrao ?? ""}
            className={campo}
          />
        </Campo>
      </div>
      <Campo id="descricao" rotulo="Descrição" erro={erros.descricao}>
        <input
          id="descricao"
          name="descricao"
          maxLength={1000}
          defaultValue={v.descricao ?? s?.descricao ?? ""}
          className={campo}
        />
      </Campo>
      <Campo
        id="checklist"
        rotulo="Checklist de execução"
        erro={erros.checklist}
        ajuda="Um passo por linha. A OS aberta com este serviço copia os passos."
      >
        <textarea
          id="checklist"
          name="checklist"
          rows={5}
          defaultValue={v.checklist ?? s?.checklist.join("\n")}
          className={areaDeTexto}
        />
      </Campo>
    </>
  );
}

export function NovoServico() {
  return (
    <Formulario
      acao={criarServicoDoCatalogo}
      versao=""
      rotuloDoBotao="Incluir no catálogo"
    >
      {(erros, v) => <Campos erros={erros} v={v} />}
    </Formulario>
  );
}

export function EditarServico({ s }: { s: ServicoDoCatalogo }) {
  return (
    <Formulario
      acao={atualizarServicoDoCatalogo.bind(null, s.id)}
      versao={s.versao}
      rotuloDoBotao="Salvar"
    >
      {(erros, v) => <Campos erros={erros} v={v} s={s} />}
    </Formulario>
  );
}

export function SituacaoDoServico({ s }: { s: ServicoDoCatalogo }) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      {erro && <span className="text-nao-conforme">{erro}</span>}
      <button
        type="button"
        disabled={pendente}
        className="text-texto-2 hover:text-texto hover:underline"
        onClick={() =>
          iniciar(async () =>
            setErro(await mudarSituacaoDoServico(s.id, s.versao, !s.ativo)),
          )
        }
      >
        {s.ativo ? "Inativar" : "Reativar"}
      </button>
    </span>
  );
}
