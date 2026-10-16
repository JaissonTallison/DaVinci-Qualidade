"use client";

import { useActionState, useState } from "react";
import {
  NQAS,
  RESPOSTAS_ITEM,
  type Inspecao,
  type RespostaItem,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { salvarRespostas, type EstadoDaAcao } from "@/lib/acoes-inspecoes";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campoCompacto,
  erroDoCampo,
  painel,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

/** Cor de cada resposta quando marcada: a mesma dos status (interface.md §5.3). */
const MARCADA: Record<RespostaItem, string> = {
  ok: "has-checked:border-conforme has-checked:bg-conforme/10 has-checked:text-conforme",
  nok: "has-checked:border-nao-conforme has-checked:bg-nao-conforme/10 has-checked:text-nao-conforme",
  na: "has-checked:border-neutro has-checked:bg-neutro/10 has-checked:text-texto",
};

/**
 * A inspeção em andamento: um item por linha, resposta em três botões e observação (obrigatória no NOK).
 * Respostas e observações ficam no ESTADO do componente (campos controlados): o React 19 limpa o formulário
 * quando a ação termina, e com campos soltos uma conclusão recusada apagava as respostas da tela; o envio
 * seguinte gravava tudo em branco por cima.
 */
export function RespostasDaInspecao({ inspecao }: { inspecao: Inspecao }) {
  const acao = salvarRespostas.bind(null, {
    id: inspecao.id,
    itemIds: inspecao.itens.map((i) => i.id),
  });
  const [estado, enviar, salvando] = useActionState<EstadoDaAcao, FormData>(
    acao,
    {},
  );
  const [respostas, setRespostas] = useState<
    Record<string, RespostaItem | null>
  >(Object.fromEntries(inspecao.itens.map((i) => [i.id, i.resposta])));
  const [observacoes, setObservacoes] = useState<Record<string, string>>(
    Object.fromEntries(inspecao.itens.map((i) => [i.id, i.observacao ?? ""])),
  );
  const [geral, setGeral] = useState(inspecao.observacoes ?? "");
  const erros = errosPorCampo(estado.erro?.detalhes);
  const erroGeral =
    estado.erro &&
    (!estado.erro.detalhes?.length ||
      estado.erro.mensagem.startsWith("Antes de concluir"))
      ? estado.erro
      : undefined;
  const respondidos = Object.values(respostas).filter(Boolean).length;
  const nok = Object.values(respostas).filter((r) => r === "nok").length;

  return (
    <form action={enviar} noValidate className={`${painel} mt-6`}>
      <input
        type="hidden"
        name="versao"
        value={estado.versao ?? inspecao.versao}
      />
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-borda px-5 py-3">
        <h2 className="text-xl text-texto">Itens</h2>
        <p className="text-sm text-texto-2">
          {respondidos} de {inspecao.itens.length} respondidos
          {nok > 0 && !inspecao.plano && (
            <span className="text-nao-conforme">
              {" "}
              · {nok} NOK: a inspeção será reprovada
            </span>
          )}
        </p>
      </div>
      {erroGeral && (
        <div className="px-5 pt-4">
          <AvisoDeErro erro={erroGeral} />
        </div>
      )}
      <ol className="divide-y divide-borda">
        {inspecao.itens.map((item) => {
          const resposta = respostas[item.id];
          const erroResposta = erros[`itens.${item.ordem}.resposta`];
          const erroObservacao = erros[`itens.${item.ordem}.observacao`];
          return (
            <li
              key={item.id}
              className="grid gap-3 px-5 py-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,22rem)] lg:items-start"
            >
              <div>
                <p className="text-base text-texto">
                  <span className="mr-2 text-texto-3">{item.ordem + 1}.</span>
                  {item.verificar}
                </p>
                {item.criterio && (
                  <p className="mt-0.5 pl-6 text-sm text-texto-2">
                    Critério: {item.criterio}
                  </p>
                )}
              </div>
              <fieldset className="flex flex-col gap-1">
                <legend className="sr-only">
                  Resposta do item {item.ordem + 1}
                </legend>
                <div className="inline-flex" role="presentation">
                  {(Object.keys(RESPOSTAS_ITEM) as RespostaItem[]).map(
                    (r, i) => (
                      <label
                        key={r}
                        className={`cursor-pointer border border-borda-forte px-3.5 py-1.5 text-sm font-semibold text-texto-2 select-none hover:bg-superficie-2 has-focus-visible:outline-2 has-focus-visible:outline-info ${i === 0 ? "rounded-l-sm" : "-ml-px"} ${i === 2 ? "rounded-r-sm" : ""} ${MARCADA[r]}`}
                      >
                        <input
                          type="radio"
                          name={`resposta_${item.id}`}
                          value={r}
                          checked={resposta === r}
                          onChange={() =>
                            setRespostas((a) => ({ ...a, [item.id]: r }))
                          }
                          className="sr-only"
                        />
                        {RESPOSTAS_ITEM[r]}
                      </label>
                    ),
                  )}
                </div>
                {erroResposta && (
                  <span className={erroDoCampo}>{erroResposta}</span>
                )}
              </fieldset>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`observacao_${item.id}`}
                  className={`text-xs ${resposta === "nok" ? "font-semibold text-nao-conforme" : "text-texto-2"}`}
                >
                  {resposta === "nok"
                    ? "O que foi encontrado (obrigatório)"
                    : "Observação"}
                </label>
                <input
                  id={`observacao_${item.id}`}
                  name={`observacao_${item.id}`}
                  value={observacoes[item.id]}
                  onChange={(e) =>
                    setObservacoes((o) => ({ ...o, [item.id]: e.target.value }))
                  }
                  maxLength={1000}
                  className={`${campoCompacto} w-full`}
                  aria-invalid={Boolean(erroObservacao)}
                />
                {erroObservacao && (
                  <span className={erroDoCampo}>{erroObservacao}</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="border-t border-borda px-5 py-4">
        <label
          htmlFor="observacoes"
          className="text-sm font-semibold text-texto-2"
        >
          Observações gerais
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={2}
          value={geral}
          onChange={(e) => setGeral(e.target.value)}
          className={`${areaDeTexto} mt-1.5`}
        />
      </div>
      {inspecao.plano && (
        <div className="flex flex-wrap items-end gap-4 border-t border-borda px-5 py-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-texto-2">
              Defeituosos na amostra de {inspecao.plano.amostra}
            </span>
            <input
              name="defeituosos"
              inputMode="numeric"
              defaultValue={estado.valores?.defeituosos}
              aria-invalid={Boolean(erros.defeituosos)}
              className={`${campoCompacto} w-32`}
            />
          </label>
          <p className="text-sm text-texto-2">
            Aceita com até {inspecao.plano.aceita}; rejeita com{" "}
            {inspecao.plano.rejeita} ou mais (NQA {NQAS[inspecao.plano.nqa]},
            nível {inspecao.plano.nivel}).
          </p>
          {erros.defeituosos && (
            <span className={erroDoCampo}>{erros.defeituosos}</span>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-borda px-5 py-3">
        <p className="mr-auto text-sm text-texto-3">
          Concluída, a inspeção vira registro e não muda mais.
        </p>
        <button type="submit" className={botaoSecundario} disabled={salvando}>
          Salvar respostas
        </button>
        <button
          type="submit"
          name="concluir"
          value="sim"
          className={botaoPrimario}
          disabled={salvando}
        >
          {salvando ? "Salvando…" : "Salvar e concluir"}
        </button>
      </div>
    </form>
  );
}
