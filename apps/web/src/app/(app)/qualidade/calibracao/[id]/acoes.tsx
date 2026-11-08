"use client";

import { useActionState, useState } from "react";
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
import { areaDeTexto, campo, campoCompacto } from "@/lib/estilos";
import { Trash2 } from "@/components/icones";
import { Botao } from "@/components/botao";

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
              <Campo id="data" rotulo="Data *" erro={erros.data}>
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
                rotulo="Laboratório *"
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
            <fieldset className="flex flex-col gap-2">
              <legend className="text-base font-medium text-texto">
                Resultado *
                {instrumento.criterioAceitacao &&
                  `, pelo critério: ${instrumento.criterioAceitacao}`}
              </legend>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                <label className="flex flex-1 items-start gap-2 rounded-md border border-borda-campo p-3 has-[:checked]:border-acao has-[:checked]:bg-info-suave">
                  <input
                    type="radio"
                    name="aprovada"
                    value="sim"
                    defaultChecked={v.aprovada === "sim"}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium text-texto">Aprovada</span>
                    <span className="block text-sm text-texto-2">
                      Atende ao critério. A próxima calibração é agendada pela
                      frequência.
                    </span>
                  </span>
                </label>
                <label className="flex flex-1 items-start gap-2 rounded-md border border-borda-campo p-3 has-[:checked]:border-acao has-[:checked]:bg-info-suave">
                  <input
                    type="radio"
                    name="aprovada"
                    value="nao"
                    defaultChecked={v.aprovada === "nao"}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium text-texto">Reprovada</span>
                    <span className="block text-sm text-texto-2">
                      Não atende. O instrumento fica bloqueado até uma nova
                      calibração aprovada; avalie as medições feitas com ele.
                    </span>
                  </span>
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
                ajuda="Opcional. Quando reprovada, registre o desvio medido."
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
            <p className="text-sm text-texto-3">
              Os campos com <span aria-hidden>*</span> são obrigatórios.
            </p>
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
  const [confirmando, setConfirmando] = useState(false);
  const erro =
    estado.erro &&
    (estado.erro.detalhes?.[0]?.mensagem ?? estado.erro.mensagem);

  if (!confirmando)
    return (
      <Botao
        onClick={() => setConfirmando(true)}
        variante="fantasma"
        tamanho="pequeno"
        icone={Trash2}
      >
        Anular
      </Botao>
    );

  // Confirmação inline (não é pop-over absoluto: cresce dentro da célula sem ser cortado pela tabela).
  return (
    <form
      action={enviar}
      className="flex w-64 max-w-[16rem] flex-col gap-2 text-left"
    >
      <input type="hidden" name="versao" value={instrumento.versao} />
      <input type="hidden" name="calibracaoId" value={calibracaoId} />
      <label
        htmlFor={`motivo-${calibracaoId}`}
        className="text-base font-medium text-texto"
      >
        Por que anular este registro?
      </label>
      <input
        id={`motivo-${calibracaoId}`}
        name="motivo"
        maxLength={300}
        autoFocus
        className={`${campoCompacto} w-full`}
      />
      {erro && <span className="text-sm text-nao-conforme">{erro}</span>}
      <div className="flex gap-2">
        <Botao
          type="submit"
          disabled={enviando}
          variante="perigo"
          icone={Trash2}
        >
          Anular registro
        </Botao>
        <Botao onClick={() => setConfirmando(false)} disabled={enviando}>
          Cancelar
        </Botao>
      </div>
    </form>
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
        <p className="max-w-2xl text-base text-texto-2">
          {instrumento.emUso
            ? "Use quando o instrumento for descartado, emprestado ou sair de operação. Fora de uso, ele sai dos alertas e das contagens de vencimento; o histórico de calibrações continua guardado e a ação é reversível. Não é preciso informar justificativa. A situação passa a “Fora de uso”, no topo."
            : "De volta ao uso, a situação volta a seguir a última calibração e o instrumento retorna aos alertas de vencimento. A nova situação aparece no topo."}
        </p>
        <Botao
          type="submit"
          variante={instrumento.emUso ? "perigo" : "secundario"}
          carregando={enviando}
        >
          {instrumento.emUso ? "Tirar de uso" : "Voltar para uso"}
        </Botao>
      </form>
    </Recolhido>
  );
}
