"use client";

import { useActionState } from "react";
import type { Instrumento } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, Formulario, Recolhido } from "@/components/formulario-de-acao";
import {
  anularCalibracao,
  mudarUsoDoInstrumento,
  registrarCalibracao,
  type EstadoDaAcao,
} from "@/lib/acoes-calibracao";
import { hojeEmBrasilia } from "@/lib/datas";
import {
  areaDeTexto,
  botaoPerigo,
  botaoSecundario,
  campo,
  campoCompacto,
} from "@/lib/estilos";

export function RegistrarCalibracao({
  instrumento,
}: {
  instrumento: Instrumento;
}) {
  return (
    <Bloco
      titulo="Registrar calibração"
      descricao={`Com a data, a próxima é calculada: a cada ${instrumento.frequenciaMeses} ${instrumento.frequenciaMeses === 1 ? "mês" : "meses"}. Pode lançar calibrações antigas; vale sempre a mais recente.`}
    >
      <Formulario
        acao={registrarCalibracao.bind(null, instrumento.id)}
        versao={instrumento.versao}
        rotuloDoBotao="Registrar calibração"
      >
        {(erros, v) => (
          <>
            <div className="grid gap-5 sm:grid-cols-3">
              <Campo id="data" rotulo="Data" erro={erros.data}>
                <input
                  id="data"
                  name="data"
                  type="date"
                  max={hojeEmBrasilia()}
                  defaultValue={v.data}
                  className={campo}
                  aria-invalid={Boolean(erros.data)}
                />
              </Campo>
              <Campo
                id="laboratorio"
                rotulo="Laboratório"
                erro={erros.laboratorio}
              >
                <input
                  id="laboratorio"
                  name="laboratorio"
                  defaultValue={v.laboratorio}
                  maxLength={120}
                  className={campo}
                  aria-invalid={Boolean(erros.laboratorio)}
                />
              </Campo>
              <Campo
                id="certificado"
                rotulo="Número do certificado"
                erro={erros.certificado}
              >
                <input
                  id="certificado"
                  name="certificado"
                  defaultValue={v.certificado}
                  maxLength={60}
                  className={`${campo} font-mono`}
                />
              </Campo>
            </div>
            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-sm font-semibold text-texto-2">
                Resultado
                {instrumento.criterioAceitacao &&
                  `, pelo critério: ${instrumento.criterioAceitacao}`}
              </legend>
              <div className="flex gap-6 text-base">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="aprovada"
                    value="sim"
                    defaultChecked={v.aprovada === "sim"}
                  />{" "}
                  Aprovada
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="aprovada"
                    value="nao"
                    defaultChecked={v.aprovada === "nao"}
                  />{" "}
                  Reprovada
                </label>
              </div>
              {erros.aprovada && (
                <p className="text-sm text-nao-conforme">{erros.aprovada}</p>
              )}
            </fieldset>
            <div className="grid gap-5 sm:grid-cols-3">
              <Campo
                id="erroEncontrado"
                rotulo="Erro ou incerteza encontrados"
                erro={erros.erroEncontrado}
                className="sm:col-span-2"
              >
                <input
                  id="erroEncontrado"
                  name="erroEncontrado"
                  defaultValue={v.erroEncontrado}
                  maxLength={200}
                  className={campo}
                />
              </Campo>
              <Campo id="custo" rotulo="Custo (R$)" erro={erros.custo}>
                <input
                  id="custo"
                  name="custo"
                  inputMode="decimal"
                  placeholder="0,00"
                  defaultValue={v.custo}
                  className={campo}
                  aria-invalid={Boolean(erros.custo)}
                />
              </Campo>
            </div>
            <Campo id="observacao" rotulo="Observação" erro={erros.observacao}>
              <textarea
                id="observacao"
                name="observacao"
                rows={2}
                defaultValue={v.observacao}
                className={areaDeTexto}
              />
            </Campo>
          </>
        )}
      </Formulario>
    </Bloco>
  );
}

/** Anular, na linha do histórico: o registro continua visível, riscado, e sai das contas. */
export function AnularCalibracao({
  instrumento,
  calibracaoId,
}: {
  instrumento: Instrumento;
  calibracaoId: string;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    anularCalibracao.bind(null, instrumento.id),
    {},
  );
  const erro =
    estado.erro &&
    (estado.erro.detalhes?.[0]?.mensagem ?? estado.erro.mensagem);
  return (
    <details className="relative inline-block text-left">
      <summary className="cursor-pointer list-none text-sm text-texto-2 hover:text-texto hover:underline">
        Anular
      </summary>
      <form
        action={enviar}
        className="absolute right-0 z-10 mt-1 flex w-72 flex-col gap-2 rounded-md border border-borda bg-superficie p-3 shadow-sm"
      >
        <input type="hidden" name="versao" value={instrumento.versao} />
        <input type="hidden" name="calibracaoId" value={calibracaoId} />
        <label
          htmlFor={`motivo-${calibracaoId}`}
          className="text-sm font-semibold text-texto-2"
        >
          Por que anular este registro?
        </label>
        <input
          id={`motivo-${calibracaoId}`}
          name="motivo"
          maxLength={300}
          className={`${campoCompacto} w-full`}
        />
        {erro && <span className="text-sm text-nao-conforme">{erro}</span>}
        <button type="submit" className={botaoPerigo} disabled={enviando}>
          Anular registro
        </button>
      </form>
    </details>
  );
}

export function UsoDoInstrumento({
  instrumento,
}: {
  instrumento: Instrumento;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    mudarUsoDoInstrumento.bind(null, instrumento.id),
    {},
  );
  return (
    <Recolhido titulo={instrumento.emUso ? "Tirar de uso" : "Voltar para uso"}>
      <form action={enviar} className="flex flex-col items-start gap-3">
        <input type="hidden" name="versao" value={instrumento.versao} />
        <input
          type="hidden"
          name="emUso"
          value={instrumento.emUso ? "nao" : "sim"}
        />
        {estado.erro && <AvisoDeErro erro={estado.erro} />}
        <p className="text-base text-texto-2">
          {instrumento.emUso
            ? "Fora de uso, o instrumento sai dos alertas de vencimento. O histórico continua guardado."
            : "De volta ao uso, a situação volta a seguir a última calibração."}
        </p>
        <button
          type="submit"
          className={instrumento.emUso ? botaoPerigo : botaoSecundario}
          disabled={enviando}
        >
          {instrumento.emUso ? "Tirar de uso" : "Voltar para uso"}
        </button>
      </form>
    </Recolhido>
  );
}
