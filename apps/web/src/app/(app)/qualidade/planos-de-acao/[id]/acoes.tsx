"use client";

import { useActionState } from "react";
import type { PlanoDeAcao, Tarefa } from "@davinci/types";
import { Campo } from "@/components/campo";
import {
  Bloco,
  Formulario,
  Recolhido,
  type EstadoDeFormulario,
} from "@/components/formulario-de-acao";
import { LinhasDeTarefa } from "@/components/linhas-de-tarefa";
import {
  cancelarPlano,
  incluirTarefa,
  mudarTarefa,
  verificarEficaciaDoPlano,
  type EstadoDaAcao,
} from "@/lib/acoes-planos";
import { hojeEmBrasilia } from "@/lib/datas";
import { areaDeTexto, campoCompacto } from "@/lib/estilos";

const botaoDaLinha =
  "h-8 rounded-campo border border-borda-campo bg-superficie px-3 text-sm font-semibold text-texto hover:bg-superficie-2 disabled:opacity-60";

/** Concluir, reabrir ou cancelar a tarefa, na própria linha. O erro (ex.: plano alterado por outra pessoa) aparece embaixo. */
export function AcoesDaTarefa({
  planoId,
  versao,
  tarefa,
}: {
  planoId: string;
  versao: string;
  tarefa: Tarefa;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    mudarTarefa.bind(null, planoId),
    {},
  );
  if (tarefa.situacao === "cancelada") return null;
  const erro =
    estado.erro &&
    (estado.erro.detalhes?.[0]?.mensagem ?? estado.erro.mensagem);
  return (
    <form action={enviar} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="versao" value={versao} />
      <input type="hidden" name="tarefaId" value={tarefa.id} />
      {tarefa.situacao === "pendente" ? (
        <span className="inline-flex items-center gap-2">
          <button
            type="submit"
            name="acao"
            value="concluir"
            className={botaoDaLinha}
            disabled={enviando}
          >
            Concluir
          </button>
          <details className="relative">
            <summary className="cursor-pointer list-none text-sm text-texto-2 hover:text-texto hover:underline">
              Cancelar
            </summary>
            <div className="absolute right-0 z-10 mt-1 flex w-72 flex-col gap-2 rounded-md border border-borda bg-superficie p-3 text-left shadow-sm">
              <label
                htmlFor={`motivo-${tarefa.id}`}
                className="text-sm font-semibold text-texto-2"
              >
                Por que cancelar esta tarefa?
              </label>
              <input
                id={`motivo-${tarefa.id}`}
                name="motivo"
                maxLength={300}
                className={`${campoCompacto} w-full`}
              />
              <button
                type="submit"
                name="acao"
                value="cancelar"
                className={botaoDaLinha}
                disabled={enviando}
              >
                Cancelar tarefa
              </button>
            </div>
          </details>
        </span>
      ) : (
        <button
          type="submit"
          name="acao"
          value="reabrir"
          className={botaoDaLinha}
          disabled={enviando}
        >
          Reabrir
        </button>
      )}
      {erro && (
        <span className="max-w-72 text-right text-sm whitespace-normal text-nao-conforme">
          {erro}
        </span>
      )}
    </form>
  );
}

export function AcoesDoPlano({
  plano,
  podeCancelar,
}: {
  plano: PlanoDeAcao;
  podeCancelar: boolean;
}) {
  return (
    <>
      {plano.status === "aguardando_eficacia" && (
        <Bloco
          titulo="Verificar eficácia"
          descricao="As tarefas foram feitas. O objetivo foi alcançado? Se não, o plano volta para execução e pede tarefas novas."
        >
          <Formulario
            acao={verificarEficaciaDoPlano.bind(null, plano.id)}
            versao={plano.versao}
            rotuloDoBotao="Registrar verificação"
          >
            {(erros, v) => (
              <>
                <fieldset className="flex flex-col gap-1.5">
                  <legend className="text-sm font-semibold text-texto-2">
                    Resultado
                  </legend>
                  <div className="flex gap-6 text-base">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="eficaz"
                        value="sim"
                        defaultChecked={v.eficaz === "sim"}
                      />{" "}
                      Objetivo alcançado
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="eficaz"
                        value="nao"
                        defaultChecked={v.eficaz === "nao"}
                      />{" "}
                      Não alcançado
                    </label>
                  </div>
                  {erros.eficaz && (
                    <p className="text-sm text-nao-conforme">{erros.eficaz}</p>
                  )}
                </fieldset>
                <Campo
                  id="parecer"
                  rotulo="Parecer"
                  erro={erros.parecer}
                  ajuda={`Compare com o objetivo: "${plano.objetivo.slice(0, 120)}"`}
                >
                  <textarea
                    id="parecer"
                    name="parecer"
                    rows={3}
                    defaultValue={v.parecer}
                    className={areaDeTexto}
                    aria-invalid={Boolean(erros.parecer)}
                  />
                </Campo>
              </>
            )}
          </Formulario>
        </Bloco>
      )}

      <Recolhido titulo="Incluir tarefa">
        <Formulario
          acao={incluirTarefa.bind(null, plano.id)}
          versao={plano.versao}
          rotuloDoBotao="Incluir tarefa"
        >
          {(erros, _v, estado: EstadoDeFormulario) => (
            <LinhasDeTarefa
              quantidade={1}
              hoje={hojeEmBrasilia()}
              valores={(estado as EstadoDaAcao).tarefas}
              erros={erros}
              prefixoDoErro="tarefa"
            />
          )}
        </Formulario>
      </Recolhido>

      {podeCancelar && (
        <Recolhido titulo="Cancelar este plano">
          <p className="text-base text-texto-2">
            O plano não é apagado: fica cancelado, com o motivo e quem cancelou.
            As tarefas concluídas continuam registradas.
          </p>
          <Formulario
            acao={cancelarPlano.bind(null, plano.id)}
            versao={plano.versao}
            rotuloDoBotao={`Cancelar ${plano.numero}`}
            perigo
          >
            {(erros, v) => (
              <Campo
                id="motivo"
                rotulo="Motivo do cancelamento"
                erro={erros.motivo}
              >
                <textarea
                  id="motivo"
                  name="motivo"
                  rows={2}
                  defaultValue={v.motivo}
                  className={areaDeTexto}
                  aria-invalid={Boolean(erros.motivo)}
                />
              </Campo>
            )}
          </Formulario>
        </Recolhido>
      )}
    </>
  );
}
