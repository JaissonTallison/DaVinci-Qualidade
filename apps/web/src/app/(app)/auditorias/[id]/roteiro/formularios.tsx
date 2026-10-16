"use client";

import { useActionState } from "react";
import {
  NORMAS,
  PROCESSOS_AUDITADOS,
  type PerguntaDeRoteiro,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import {
  criarPerguntaPropria,
  selecionarPerguntas,
  type EstadoDaAcao,
} from "@/lib/acoes-auditorias";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

/** Banco filtrado com caixas para incluir no roteiro; as já incluídas aparecem marcadas e travadas. */
export function BancoDePerguntas({
  auditoriaId,
  perguntas,
  noRoteiro,
  podeEditar,
}: {
  auditoriaId: string;
  perguntas: PerguntaDeRoteiro[];
  noRoteiro: string[];
  podeEditar: boolean;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    selecionarPerguntas.bind(null, auditoriaId),
    {},
  );
  const ja = new Set(noRoteiro);
  return (
    <form action={enviar} className="flex flex-col">
      {estado.erro && (
        <div className="p-4">
          <AvisoDeErro erro={estado.erro} />
        </div>
      )}
      <ul className="divide-y divide-borda">
        {perguntas.map((p) => (
          <li key={p.codigo} className="flex gap-3 px-4 py-3">
            <input
              type="checkbox"
              name="incluir"
              value={p.codigo}
              defaultChecked={ja.has(p.codigo)}
              disabled={!podeEditar || ja.has(p.codigo)}
              aria-label={`Incluir: ${p.pergunta}`}
              className="mt-1 size-4 shrink-0 accent-primaria"
            />
            <div className="min-w-0">
              <p className="text-base">{p.pergunta}</p>
              <p className="mt-1 text-sm text-texto-2">
                <span className="font-mono">
                  {NORMAS[p.norma]} {p.clausula}
                </span>{" "}
                · {PROCESSOS_AUDITADOS[p.processo]}
                {p.origem === "propria" && " · minha pergunta"}
              </p>
              <details className="mt-1 text-sm">
                <summary className="cursor-pointer text-info">
                  Resposta esperada e sinal de alerta
                </summary>
                <p className="mt-1">
                  <span className="font-semibold">Esperada:</span>{" "}
                  {p.respostaEsperada}
                </p>
                <p className="mt-0.5">
                  <span className="font-semibold">Alerta:</span>{" "}
                  {p.sinalDeAlerta}
                </p>
              </details>
            </div>
          </li>
        ))}
      </ul>
      {podeEditar && perguntas.length > 0 && (
        <div className="sticky bottom-0 border-t border-borda bg-superficie px-4 py-3">
          <button type="submit" className={botaoPrimario} disabled={enviando}>
            {enviando ? "Incluindo…" : "Incluir as marcadas no roteiro"}
          </button>
        </div>
      )}
    </form>
  );
}

export function RetirarPergunta({
  auditoriaId,
  codigo,
}: {
  auditoriaId: string;
  codigo: string;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    selecionarPerguntas.bind(null, auditoriaId),
    {},
  );
  return (
    <form action={enviar} className="flex flex-col items-end gap-1">
      <input type="hidden" name="retirar" value={codigo} />
      <button
        type="submit"
        className="text-sm text-texto-2 hover:text-nao-conforme hover:underline"
        disabled={enviando}
      >
        Retirar
      </button>
      {estado.erro && (
        <span className="max-w-48 text-right text-xs text-nao-conforme">
          {estado.erro.mensagem}
        </span>
      )}
    </form>
  );
}

export function NovaPerguntaPropria({ auditoriaId }: { auditoriaId: string }) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    criarPerguntaPropria.bind(null, auditoriaId),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  return (
    <form action={enviar} noValidate className="flex flex-col gap-4">
      {estado.erro && !estado.erro.detalhes?.length && (
        <AvisoDeErro erro={estado.erro} />
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo id="processo" rotulo="Processo" erro={erros.processo}>
          <Selecao
            id="processo"
            name="processo"
            defaultValue={v.processo ?? ""}
            className={campo}
          >
            <option value="">Escolha</option>
            {Object.entries(PROCESSOS_AUDITADOS).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo id="norma" rotulo="Norma" erro={erros.norma}>
          <Selecao
            id="norma"
            name="norma"
            defaultValue={v.norma ?? ""}
            className={campo}
          >
            <option value="">Escolha</option>
            {Object.entries(NORMAS).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo
          id="clausula"
          rotulo="Cláusula"
          erro={erros.clausula}
          ajuda="Ex.: 8.4.1"
        >
          <input
            id="clausula"
            name="clausula"
            maxLength={20}
            defaultValue={v.clausula}
            className={campo}
          />
        </Campo>
        <Campo
          id="pergunta"
          rotulo="Pergunta"
          erro={erros.pergunta}
          className="sm:col-span-3"
        >
          <input
            id="pergunta"
            name="pergunta"
            maxLength={300}
            defaultValue={v.pergunta}
            className={campo}
          />
        </Campo>
        <Campo
          id="respostaEsperada"
          rotulo="Resposta esperada (conforme)"
          erro={erros.respostaEsperada}
          className="sm:col-span-3"
        >
          <textarea
            id="respostaEsperada"
            name="respostaEsperada"
            rows={2}
            maxLength={500}
            defaultValue={v.respostaEsperada}
            className={areaDeTexto}
          />
        </Campo>
        <Campo
          id="sinalDeAlerta"
          rotulo="Sinal de alerta (não conforme)"
          erro={erros.sinalDeAlerta}
          className="sm:col-span-3"
        >
          <textarea
            id="sinalDeAlerta"
            name="sinalDeAlerta"
            rows={2}
            maxLength={500}
            defaultValue={v.sinalDeAlerta}
            className={areaDeTexto}
          />
        </Campo>
      </div>
      <div>
        <button type="submit" className={botaoSecundario} disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar em minhas perguntas"}
        </button>
      </div>
    </form>
  );
}
