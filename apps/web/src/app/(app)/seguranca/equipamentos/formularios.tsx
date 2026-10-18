"use client";

import { useState, useTransition } from "react";
import {
  CATEGORIAS_DE_EQUIPAMENTO,
  NOMES_DAS_CATEGORIAS,
  RESULTADOS_DA_INSPECAO,
  type Equipamento,
} from "@davinci/types";
import { Campo } from "@/components/campo";
import { Bloco, Formulario } from "@/components/formulario-de-acao";
import { Selecao } from "@/components/selecao";
import {
  atualizarEquipamento,
  criarEquipamento,
  inspecionarEquipamento,
  mudarSituacaoDoEquipamento,
} from "@/lib/acoes-sst";
import { campo } from "@/lib/estilos";

function Campos({
  erros,
  v,
  e,
  hoje,
}: {
  erros: Record<string, string>;
  v: Record<string, string>;
  e?: Equipamento;
  hoje: string;
}) {
  const [categoria, setCategoria] = useState(
    v.categoria ?? e?.categoria ?? "extintor",
  );
  const c =
    CATEGORIAS_DE_EQUIPAMENTO[
      categoria as keyof typeof CATEGORIAS_DE_EQUIPAMENTO
    ];
  const d = (k: keyof Equipamento) =>
    v[k] ?? (e?.[k] === null || e?.[k] === undefined ? "" : String(e[k]));
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <Campo id="categoria" rotulo="Categoria" erro={erros.categoria}>
        <select
          id="categoria"
          name="categoria"
          value={categoria}
          onChange={(x) => setCategoria(x.target.value)}
          className={campo}
        >
          {Object.entries(NOMES_DAS_CATEGORIAS).map(([k, n]) => (
            <option key={k} value={k}>
              {n}
            </option>
          ))}
        </select>
      </Campo>
      <Campo
        id="identificacao"
        rotulo="Identificação"
        erro={erros.identificacao}
      >
        <input
          id="identificacao"
          name="identificacao"
          maxLength={60}
          defaultValue={d("identificacao")}
          className={`${campo} font-mono`}
        />
      </Campo>
      <Campo
        id="local"
        rotulo="Local"
        erro={erros.local}
        className="sm:col-span-2"
      >
        <input
          id="local"
          name="local"
          list="setores"
          maxLength={150}
          defaultValue={d("local")}
          className={campo}
        />
      </Campo>
      <Campo
        id="detalhes"
        rotulo="Detalhes"
        erro={erros.detalhes}
        className="sm:col-span-2"
        ajuda="Tipo e capacidade, fabricante, modelo."
      >
        <input
          id="detalhes"
          name="detalhes"
          maxLength={300}
          defaultValue={d("detalhes")}
          className={campo}
        />
      </Campo>
      <Campo
        id="inspecaoDias"
        rotulo="Inspeção a cada (dias)"
        erro={erros.inspecaoDias}
        ajuda={`Padrão da categoria: ${c.inspecaoDias}.`}
      >
        <input
          id="inspecaoDias"
          name="inspecaoDias"
          inputMode="numeric"
          defaultValue={d("inspecaoDias")}
          className={campo}
        />
      </Campo>
      <Campo
        id="ultimaInspecao"
        rotulo="Última inspeção"
        erro={erros.ultimaInspecao}
      >
        <input
          id="ultimaInspecao"
          name="ultimaInspecao"
          type="date"
          max={hoje}
          defaultValue={d("ultimaInspecao")}
          className={campo}
        />
      </Campo>
      {c.recargaMeses && (
        <Campo
          id="ultimaRecarga"
          rotulo={`Última recarga (a cada ${c.recargaMeses} meses)`}
          erro={erros.ultimaRecarga}
        >
          <input
            id="ultimaRecarga"
            name="ultimaRecarga"
            type="date"
            max={hoje}
            defaultValue={d("ultimaRecarga")}
            className={campo}
          />
        </Campo>
      )}
      {c.testeMeses && (
        <Campo
          id="ultimoTeste"
          rotulo={`Último teste hidrostático (a cada ${c.testeMeses} meses)`}
          erro={erros.ultimoTeste}
        >
          <input
            id="ultimoTeste"
            name="ultimoTeste"
            type="date"
            max={hoje}
            defaultValue={d("ultimoTeste")}
            className={campo}
          />
        </Campo>
      )}
    </div>
  );
}

export function NovoEquipamento({ hoje }: { hoje: string }) {
  return (
    <Formulario
      acao={criarEquipamento}
      versao=""
      rotuloDoBotao="Cadastrar equipamento"
    >
      {(erros, v) => <Campos erros={erros} v={v} hoje={hoje} />}
    </Formulario>
  );
}

export function EditarEquipamento({
  e,
  hoje,
}: {
  e: Equipamento;
  hoje: string;
}) {
  return (
    <Formulario
      acao={atualizarEquipamento.bind(null, e.id)}
      versao={e.versao}
      rotuloDoBotao="Salvar"
    >
      {(erros, v) => <Campos erros={erros} v={v} e={e} hoje={hoje} />}
    </Formulario>
  );
}

export function InspecionarEquipamento({
  e,
  hoje,
  inspetor,
}: {
  e: Equipamento;
  hoje: string;
  inspetor: string;
}) {
  const c = CATEGORIAS_DE_EQUIPAMENTO[e.categoria];
  return (
    <Bloco
      titulo="Registrar inspeção"
      descricao="Não conforme deixa o equipamento com pendência até uma nova inspeção conforme."
    >
      <Formulario
        acao={inspecionarEquipamento.bind(null, e.id)}
        versao={e.versao}
        rotuloDoBotao="Registrar inspeção"
      >
        {(erros, v) => (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Campo id="data" rotulo="Data" erro={erros.data}>
                <input
                  id="data"
                  name="data"
                  type="date"
                  max={hoje}
                  defaultValue={v.data ?? hoje}
                  className={campo}
                />
              </Campo>
              <Campo id="resultado" rotulo="Resultado" erro={erros.resultado}>
                <Selecao
                  id="resultado"
                  name="resultado"
                  defaultValue={v.resultado ?? "conforme"}
                  className={campo}
                >
                  {Object.entries(RESULTADOS_DA_INSPECAO).map(([k, n]) => (
                    <option key={k} value={k}>
                      {n}
                    </option>
                  ))}
                </Selecao>
              </Campo>
              <Campo
                id="responsavel"
                rotulo="Quem inspecionou"
                erro={erros.responsavel}
              >
                <input
                  id="responsavel"
                  name="responsavel"
                  list="pessoas"
                  maxLength={120}
                  defaultValue={v.responsavel ?? inspetor}
                  className={campo}
                />
              </Campo>
            </div>
            <Campo
              id="observacao"
              rotulo="Observação"
              erro={erros.observacao}
              ajuda="Obrigatória se não conforme."
            >
              <input
                id="observacao"
                name="observacao"
                maxLength={500}
                defaultValue={v.observacao}
                className={campo}
              />
            </Campo>
            <div className="flex flex-wrap gap-5 text-base">
              {c.recargaMeses && (
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="recarregado"
                    value="sim"
                    className="size-4 accent-primaria"
                  />
                  Recarga feita nesta data
                </label>
              )}
              {c.testeMeses && (
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="testado"
                    value="sim"
                    className="size-4 accent-primaria"
                  />
                  Teste hidrostático feito nesta data
                </label>
              )}
            </div>
          </>
        )}
      </Formulario>
    </Bloco>
  );
}

export function SituacaoDoEquipamento({ e }: { e: Equipamento }) {
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
            setErro(await mudarSituacaoDoEquipamento(e.id, e.versao, !e.ativo)),
          )
        }
      >
        {e.ativo ? "Retirar de uso" : "Voltar ao uso"}
      </button>
    </span>
  );
}
