"use client";

import {
  INDICADORES_DO_PROGRAMA,
  type ProgramaAmbiental,
} from "@davinci/types";
import { Campo } from "@/components/campo";
import { EditorDeLinhas } from "@/components/editor-de-linhas";
import { Bloco, Formulario } from "@/components/formulario-de-acao";
import {
  atualizarPrograma,
  criarPrograma,
  medirPrograma,
} from "@/lib/acoes-ambiental-gestao";
import { areaDeTexto, campo } from "@/lib/estilos";

function Campos({
  erros,
  v,
  p,
}: {
  erros: Record<string, string>;
  v: Record<string, string>;
  p?: ProgramaAmbiental;
}) {
  const d = (k: keyof ProgramaAmbiental) =>
    v[k] ?? (p?.[k] === null || p?.[k] === undefined ? "" : String(p[k]));
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-4">
        <Campo
          id="nome"
          rotulo="Programa"
          erro={erros.nome}
          className="sm:col-span-2"
        >
          <input
            id="nome"
            name="nome"
            maxLength={150}
            defaultValue={d("nome")}
            className={campo}
          />
        </Campo>
        <Campo
          id="indicador"
          rotulo="Indicador"
          erro={erros.indicador}
          className="sm:col-span-2"
        >
          <select
            id="indicador"
            name="indicador"
            defaultValue={d("indicador") || "agua_por_unidade"}
            className={campo}
          >
            {Object.entries(INDICADORES_DO_PROGRAMA).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </select>
        </Campo>
        <Campo
          id="unidadeManual"
          rotulo="Unidade (indicador próprio)"
          erro={erros.unidadeManual}
        >
          <input
            id="unidadeManual"
            name="unidadeManual"
            maxLength={20}
            defaultValue={
              v.unidadeManual ?? (p?.indicador === "manual" ? p.unidade : "")
            }
            className={campo}
          />
        </Campo>
        <Campo id="linhaDeBase" rotulo="Linha de base" erro={erros.linhaDeBase}>
          <input
            id="linhaDeBase"
            name="linhaDeBase"
            inputMode="decimal"
            defaultValue={d("linhaDeBase")}
            className={campo}
          />
        </Campo>
        <Campo id="anoBase" rotulo="Ano da linha de base" erro={erros.anoBase}>
          <input
            id="anoBase"
            name="anoBase"
            inputMode="numeric"
            defaultValue={d("anoBase")}
            className={campo}
          />
        </Campo>
        <Campo id="meta" rotulo="Meta" erro={erros.meta}>
          <input
            id="meta"
            name="meta"
            inputMode="decimal"
            defaultValue={d("meta")}
            className={campo}
          />
        </Campo>
        <Campo id="prazo" rotulo="Prazo da meta" erro={erros.prazo}>
          <input
            id="prazo"
            name="prazo"
            type="date"
            defaultValue={d("prazo")}
            className={campo}
          />
        </Campo>
        <Campo id="responsavel" rotulo="Responsável" erro={erros.responsavel}>
          <input
            id="responsavel"
            name="responsavel"
            list="pessoas"
            maxLength={120}
            defaultValue={d("responsavel")}
            className={campo}
          />
        </Campo>
      </div>
      <Campo id="objetivo" rotulo="Objetivo" erro={erros.objetivo}>
        <textarea
          id="objetivo"
          name="objetivo"
          rows={2}
          defaultValue={d("objetivo")}
          className={areaDeTexto}
        />
      </Campo>
      <div>
        <p className="text-sm font-semibold text-texto-2">Ações</p>
        <EditorDeLinhas
          colunas={[
            {
              nome: "oQue",
              rotulo: "O que fazer",
              largura: "min-w-80",
              max: 300,
            },
            { nome: "responsavel", rotulo: "Quem", max: 120 },
            {
              nome: "prazo",
              rotulo: "Até quando",
              tipo: "data",
              largura: "min-w-36",
            },
            {
              nome: "concluida",
              rotulo: "Concluída",
              tipo: "opcoes",
              opcoes: { sim: "Sim" },
              largura: "min-w-24",
            },
          ]}
          iniciais={(p?.acoes ?? []).map((a) => ({
            oQue: a.oQue,
            responsavel: a.responsavel,
            prazo: a.prazo ?? "",
            concluida: a.concluida ? "sim" : "",
          }))}
          erros={erros}
          prefixo="acoes"
          rotuloDaLinha="Ação"
        />
      </div>
    </>
  );
}

export function NovoPrograma() {
  return (
    <Formulario acao={criarPrograma} versao="" rotuloDoBotao="Criar programa">
      {(erros, v) => <Campos erros={erros} v={v} />}
    </Formulario>
  );
}

export function EditarPrograma({ p }: { p: ProgramaAmbiental }) {
  return (
    <Formulario
      acao={atualizarPrograma.bind(null, p.id)}
      versao={p.versao}
      rotuloDoBotao="Salvar programa"
    >
      {(erros, v) => (
        <>
          <Campos erros={erros} v={v} p={p} />
          <label className="inline-flex items-center gap-2 text-base">
            <input
              type="checkbox"
              name="encerrado"
              value="sim"
              defaultChecked={p.encerrado}
              className="size-4 accent-primaria"
            />
            Programa encerrado
          </label>
        </>
      )}
    </Formulario>
  );
}

export function MedirPrograma({
  p,
  mes,
}: {
  p: ProgramaAmbiental;
  mes: string;
}) {
  return (
    <Bloco
      titulo="Registrar medição"
      descricao="Indicador próprio: o valor do mês (o mesmo mês substitui)."
    >
      <Formulario
        acao={medirPrograma.bind(null, p.id)}
        versao={p.versao}
        rotuloDoBotao="Registrar"
      >
        {(erros, v) => (
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo id="competencia" rotulo="Mês" erro={erros.competencia}>
              <input
                id="competencia"
                name="competencia"
                type="month"
                max={mes}
                defaultValue={v.competencia ?? mes}
                className={campo}
              />
            </Campo>
            <Campo
              id="valor"
              rotulo={`Valor (${p.unidade})`}
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
          </div>
        )}
      </Formulario>
    </Bloco>
  );
}
