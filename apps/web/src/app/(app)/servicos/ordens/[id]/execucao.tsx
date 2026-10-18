"use client";

import { STATUS_DO_PASSO, type OrdemDeServico } from "@davinci/types";
import {
  EditorDeLinhas,
  type ColunaDoEditor,
} from "@/components/editor-de-linhas";
import { Formulario } from "@/components/formulario-de-acao";
import { registrarExecucao } from "@/lib/acoes-servicos";
import { campoCompacto, tituloDaSecao } from "@/lib/estilos";

const HORAS: ColunaDoEditor[] = [
  { nome: "data", rotulo: "Data", tipo: "data", largura: "min-w-36" },
  { nome: "tecnico", rotulo: "Técnico", max: 120, lista: "pessoas" },
  { nome: "horas", rotulo: "Horas", largura: "min-w-20", max: 6 },
  { nome: "descricao", rotulo: "O que fez", largura: "min-w-56", max: 300 },
];
const MATERIAIS: ColunaDoEditor[] = [
  { nome: "descricao", rotulo: "Material", largura: "min-w-56", max: 150 },
  { nome: "quantidade", rotulo: "Quantidade", largura: "min-w-24", max: 10 },
  { nome: "unidade", rotulo: "Unidade", largura: "min-w-20", max: 10 },
];
const texto = (l: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(l).map(([k, v]) => [
      k,
      v === null || v === undefined ? "" : String(v),
    ]),
  );

/** Execução da OS: passos do checklist, horas por técnico e materiais usados. */
export function ExecucaoDaOs({ os }: { os: OrdemDeServico }) {
  return (
    <Formulario
      acao={registrarExecucao.bind(null, os.id)}
      versao={os.versao}
      rotuloDoBotao="Salvar execução"
    >
      {(erros, v) => (
        <>
          {os.checklist.length > 0 && (
            <div>
              <h3 className={tituloDaSecao}>Checklist</h3>
              <ol className="mt-2 flex flex-col gap-2">
                {os.checklist.map((p, i) => (
                  <li
                    key={i}
                    className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_12rem_minmax(0,2fr)] sm:items-center"
                  >
                    <span className="text-base">
                      <span className="mr-2 text-texto-3 tabular-nums">
                        {i + 1}.
                      </span>
                      {p.item}
                      <input type="hidden" name="passo_item" value={p.item} />
                    </span>
                    <select
                      name={`passo_status_${i}`}
                      defaultValue={v[`passo_status_${i}`] ?? p.status}
                      aria-label={`Situação do passo ${i + 1}`}
                      className={`${campoCompacto} w-full`}
                    >
                      {Object.entries(STATUS_DO_PASSO).map(([k, n]) => (
                        <option key={k} value={k}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <input
                      name={`passo_obs_${i}`}
                      defaultValue={v[`passo_obs_${i}`] ?? p.observacao}
                      maxLength={300}
                      placeholder="Observação"
                      aria-label={`Observação do passo ${i + 1}`}
                      className={`${campoCompacto} w-full`}
                    />
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div>
            <h3 className={tituloDaSecao}>Horas trabalhadas</h3>
            <EditorDeLinhas
              colunas={HORAS}
              iniciais={os.apontamentos.map(texto)}
              erros={erros}
              prefixo="apontamentos"
              rotuloDaLinha="Apontamento"
              comLinhaVazia={false}
            />
          </div>
          <div>
            <h3 className={tituloDaSecao}>Materiais</h3>
            <EditorDeLinhas
              colunas={MATERIAIS}
              iniciais={os.materiais.map(texto)}
              erros={erros}
              prefixo="materiais"
              rotuloDaLinha="Material"
              comLinhaVazia={false}
            />
          </div>
        </>
      )}
    </Formulario>
  );
}
