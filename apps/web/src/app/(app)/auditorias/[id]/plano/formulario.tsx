"use client";

import { useState } from "react";
import {
  PAPEIS_DO_AUDITOR,
  PROCESSOS_AUDITADOS,
  type Auditoria,
} from "@davinci/types";
import { Campo } from "@/components/campo";
import { Formulario } from "@/components/formulario-de-acao";
import { ListaDeProcessosAuditados } from "@/components/lista-de-processos-auditados";
import { salvarPlanoDaAuditoria } from "@/lib/acoes-auditorias";
import {
  areaDeTexto,
  botaoLink,
  campo,
  campoCompacto,
  rotulo,
  tituloDaSecao,
} from "@/lib/estilos";

type Props = {
  auditoria: Auditoria;
  criteriosPadrao: string;
  metodologiaPadrao: string;
};

/** Qual datalist sugere cada coluna do cronograma. */
const LISTA_DA_COLUNA = {
  processo: "processos-auditados",
  auditado: "pessoas",
  local: "setores",
} as const;

/** Plano enviado ao auditado antes da auditoria: identificação, objetivo, critérios, cronograma, convocados e logística. */
export function FormularioDoPlano({
  auditoria: a,
  criteriosPadrao,
  metodologiaPadrao,
}: Props) {
  const p = a.plano;
  const [nCrono, setNCrono] = useState(Math.max(p.cronograma.length, 3));
  const [nAud, setNAud] = useState(Math.max(p.auditados.length, 2));
  return (
    <Formulario
      acao={salvarPlanoDaAuditoria.bind(
        null,
        a.id,
        p,
        `/auditorias/${a.id}/plano?aviso=salvo`,
      )}
      versao={a.versao}
      rotuloDoBotao="Salvar plano"
    >
      {(erros, v) => (
        <>
          <ListaDeProcessosAuditados />
          <h2 className={tituloDaSecao}>Identificação</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Campo
              id="empresaAuditada"
              rotulo="Organização auditada"
              erro={erros.empresaAuditada}
              className="lg:col-span-2"
            >
              <input
                id="empresaAuditada"
                name="empresaAuditada"
                defaultValue={v.empresaAuditada ?? p.empresaAuditada ?? ""}
                maxLength={150}
                className={campo}
              />
            </Campo>
            <Campo id="unidade" rotulo="Unidade ou site" erro={erros.unidade}>
              <input
                id="unidade"
                name="unidade"
                defaultValue={v.unidade ?? p.unidade ?? ""}
                maxLength={120}
                className={campo}
              />
            </Campo>
            <Campo id="emissor" rotulo="Emitido por" erro={erros.emissor}>
              <input
                id="emissor"
                name="emissor"
                list="pessoas"
                defaultValue={v.emissor ?? p.emissor ?? a.auditorLider}
                maxLength={120}
                className={campo}
              />
            </Campo>
            <Campo
              id="papel"
              rotulo="Seu papel nesta auditoria"
              erro={erros.papel}
            >
              <select
                id="papel"
                name="papel"
                defaultValue={v.papel ?? p.papel}
                className={campo}
              >
                {Object.entries(PAPEIS_DO_AUDITOR).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo
              id="horas"
              rotulo="Horas de auditoria"
              erro={erros.horas}
              ajuda="Vão para o Log do Auditor."
            >
              <input
                id="horas"
                name="horas"
                type="number"
                min={0}
                step={0.5}
                defaultValue={v.horas ?? p.horas ?? ""}
                className={campo}
              />
            </Campo>
          </div>
          <Campo
            id="objetivo"
            rotulo="Objetivo da auditoria"
            erro={erros.objetivo}
          >
            <textarea
              id="objetivo"
              name="objetivo"
              rows={2}
              defaultValue={v.objetivo ?? p.objetivo ?? ""}
              placeholder="Ex.: verificar a conformidade do sistema de gestão com os requisitos e a eficácia na obtenção dos resultados pretendidos."
              className={areaDeTexto}
            />
          </Campo>
          <Campo
            id="criterios"
            rotulo="Critérios"
            erro={erros.criterios}
            ajuda="Sugerido a partir das normas; ajuste se precisar."
          >
            <textarea
              id="criterios"
              name="criterios"
              rows={2}
              defaultValue={v.criterios ?? p.criterios ?? criteriosPadrao}
              className={areaDeTexto}
            />
          </Campo>
          <Campo id="metodologia" rotulo="Metodologia" erro={erros.metodologia}>
            <textarea
              id="metodologia"
              name="metodologia"
              rows={2}
              defaultValue={v.metodologia ?? p.metodologia ?? metodologiaPadrao}
              className={areaDeTexto}
            />
          </Campo>

          <fieldset>
            <legend className={rotulo}>Processos auditados</legend>
            <input type="hidden" name="processos-enviados" value="1" />
            <div className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(PROCESSOS_AUDITADOS).map(([k, n]) => (
                <label
                  key={k}
                  className="inline-flex items-center gap-2 text-base"
                >
                  <input
                    type="checkbox"
                    name="processos"
                    value={k}
                    defaultChecked={p.processos.includes(k as never)}
                    className="size-4 accent-primaria"
                  />
                  {n}
                </label>
              ))}
            </div>
            {erros.processos && (
              <p className="mt-1 text-sm text-nao-conforme">
                {erros.processos}
              </p>
            )}
          </fieldset>

          <h2 className={`${tituloDaSecao} mt-2`}>Cronograma</h2>
          <input type="hidden" name="cronograma-linhas" value={nCrono} />
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="text-left text-texto-2">
                  <th className="pb-1 font-semibold">Início</th>
                  <th className="pb-1 font-semibold">Fim</th>
                  <th className="pb-1 font-semibold">Processo ou atividade</th>
                  <th className="pb-1 font-semibold">Auditado</th>
                  <th className="pb-1 font-semibold">Local</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: nCrono }, (_, i) => {
                  const l = p.cronograma[i];
                  const d = (c: string) =>
                    v[`cronograma.${i}.${c}`] ??
                    (l ? l[c as keyof typeof l] : "");
                  return (
                    <tr key={i}>
                      <td className="py-1 pr-2">
                        <input
                          type="time"
                          name={`cronograma.${i}.horaInicio`}
                          defaultValue={d("horaInicio")}
                          aria-label={`Início, linha ${i + 1}`}
                          className={`${campoCompacto} w-28`}
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          type="time"
                          name={`cronograma.${i}.horaFim`}
                          defaultValue={d("horaFim")}
                          aria-label={`Fim, linha ${i + 1}`}
                          className={`${campoCompacto} w-28`}
                        />
                      </td>
                      {(["processo", "auditado", "local"] as const).map((c) => (
                        <td key={c} className="py-1 pr-2">
                          <input
                            name={`cronograma.${i}.${c}`}
                            list={LISTA_DA_COLUNA[c]}
                            defaultValue={d(c)}
                            maxLength={120}
                            aria-label={`${c}, linha ${i + 1}`}
                            className={`${campoCompacto} w-full`}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-texto-3">
            Linha em branco é descartada.{" "}
            <button
              type="button"
              className={botaoLink}
              onClick={() => setNCrono((n) => n + 1)}
            >
              Adicionar linha
            </button>
          </p>
          {erros.cronograma && (
            <p className="text-sm text-nao-conforme">{erros.cronograma}</p>
          )}

          <h2 className={`${tituloDaSecao} mt-2`}>Auditados convocados</h2>
          <input type="hidden" name="auditados-linhas" value={nAud} />
          <div className="flex flex-col gap-2">
            {Array.from({ length: nAud }, (_, i) => {
              const l = p.auditados[i];
              return (
                <div key={i} className="grid gap-2 sm:grid-cols-3">
                  <input
                    name={`auditados.${i}.nome`}
                    list="pessoas"
                    defaultValue={v[`auditados.${i}.nome`] ?? l?.nome ?? ""}
                    placeholder="Nome"
                    aria-label={`Nome, linha ${i + 1}`}
                    maxLength={120}
                    className={campo}
                  />
                  <input
                    name={`auditados.${i}.funcao`}
                    defaultValue={v[`auditados.${i}.funcao`] ?? l?.funcao ?? ""}
                    placeholder="Função"
                    aria-label={`Função, linha ${i + 1}`}
                    maxLength={120}
                    className={campo}
                  />
                  <input
                    name={`auditados.${i}.processo`}
                    list="processos-auditados"
                    defaultValue={
                      v[`auditados.${i}.processo`] ?? l?.processo ?? ""
                    }
                    placeholder="Processo"
                    aria-label={`Processo, linha ${i + 1}`}
                    maxLength={120}
                    className={campo}
                  />
                </div>
              );
            })}
          </div>
          <p className="text-sm text-texto-3">
            <button
              type="button"
              className={botaoLink}
              onClick={() => setNAud((n) => n + 1)}
            >
              Adicionar auditado
            </button>
          </p>
          {Object.entries(erros)
            .filter(([k]) => k.startsWith("auditados."))
            .slice(0, 1)
            .map(([k, m]) => (
              <p key={k} className="text-sm text-nao-conforme">
                {m}
              </p>
            ))}

          <h2 className={`${tituloDaSecao} mt-2`}>Logística</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo id="logistica-sala" rotulo="Sala de apoio e recursos">
              <input
                id="logistica-sala"
                name="logistica.sala"
                defaultValue={v["logistica.sala"] ?? p.logistica.sala}
                maxLength={300}
                className={campo}
              />
            </Campo>
            <Campo id="logistica-epi" rotulo="EPI exigido nas áreas">
              <input
                id="logistica-epi"
                name="logistica.epi"
                defaultValue={v["logistica.epi"] ?? p.logistica.epi}
                maxLength={300}
                className={campo}
              />
            </Campo>
            <Campo id="logistica-acompanhante" rotulo="Acompanhante (guia)">
              <input
                id="logistica-acompanhante"
                name="logistica.acompanhante"
                list="pessoas"
                defaultValue={
                  v["logistica.acompanhante"] ?? p.logistica.acompanhante
                }
                maxLength={150}
                className={campo}
              />
            </Campo>
            <Campo id="logistica-observacoes" rotulo="Observações">
              <input
                id="logistica-observacoes"
                name="logistica.observacoes"
                defaultValue={
                  v["logistica.observacoes"] ?? p.logistica.observacoes
                }
                maxLength={600}
                className={campo}
              />
            </Campo>
          </div>
        </>
      )}
    </Formulario>
  );
}
