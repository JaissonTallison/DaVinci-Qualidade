"use client";

import { useState, useTransition } from "react";
import {
  MODELOS_DE_OBRIGACAO,
  NOMES_DAS_PERIODICIDADES,
  type ObrigacaoLegal,
} from "@davinci/types";
import { Campo } from "@/components/campo";
import { Formulario } from "@/components/formulario-de-acao";
import {
  criarObrigacao,
  cumprirObrigacao,
  excluirObrigacao,
} from "@/lib/acoes-ambiental-gestao";
import { areaDeTexto, campo } from "@/lib/estilos";

/** Nova obrigação: começar de um modelo preenche nome, órgão e periodicidade. */
export function NovaObrigacao() {
  const [modelo, setModelo] = useState("");
  const m = MODELOS_DE_OBRIGACAO[Number(modelo)];
  return (
    <>
      <Campo id="modelo" rotulo="Começar de um modelo" ajuda={m?.dica}>
        <select
          id="modelo"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          className={campo}
        >
          <option value="">Obrigação própria</option>
          {MODELOS_DE_OBRIGACAO.map((x, i) => (
            <option key={x.nome} value={i}>
              {x.nome}
            </option>
          ))}
        </select>
      </Campo>
      <Formulario
        acao={criarObrigacao}
        versao=""
        rotuloDoBotao="Incluir no calendário"
      >
        {(erros, v) => (
          <div key={modelo} className="grid gap-4 sm:grid-cols-4">
            <Campo
              id="nome"
              rotulo="Obrigação"
              erro={erros.nome}
              className="sm:col-span-2"
            >
              <input
                id="nome"
                name="nome"
                maxLength={200}
                defaultValue={v.nome ?? m?.nome}
                className={campo}
              />
            </Campo>
            <Campo id="orgao" rotulo="Órgão" erro={erros.orgao}>
              <input
                id="orgao"
                name="orgao"
                maxLength={120}
                defaultValue={v.orgao ?? m?.orgao}
                className={campo}
              />
            </Campo>
            <Campo
              id="periodicidade"
              rotulo="Periodicidade"
              erro={erros.periodicidade}
            >
              <select
                id="periodicidade"
                name="periodicidade"
                defaultValue={v.periodicidade ?? m?.periodicidade ?? "anual"}
                className={campo}
              >
                {Object.entries(NOMES_DAS_PERIODICIDADES).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo
              id="proximoVencimento"
              rotulo="Próximo vencimento"
              erro={erros.proximoVencimento}
            >
              <input
                id="proximoVencimento"
                name="proximoVencimento"
                type="date"
                defaultValue={v.proximoVencimento}
                className={campo}
              />
            </Campo>
            <Campo
              id="responsavel"
              rotulo="Responsável"
              erro={erros.responsavel}
            >
              <input
                id="responsavel"
                name="responsavel"
                list="pessoas"
                maxLength={120}
                defaultValue={v.responsavel}
                className={campo}
              />
            </Campo>
            <Campo
              id="descricao"
              rotulo="Como cumprir"
              erro={erros.descricao}
              className="sm:col-span-2"
            >
              <textarea
                id="descricao"
                name="descricao"
                rows={1}
                defaultValue={v.descricao ?? m?.dica}
                className={areaDeTexto}
              />
            </Campo>
          </div>
        )}
      </Formulario>
    </>
  );
}

export function CumprirObrigacao({
  o,
  hoje,
}: {
  o: ObrigacaoLegal;
  hoje: string;
}) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-info">Registrar entrega</summary>
      <div className="mt-2">
        <Formulario
          acao={cumprirObrigacao.bind(null, o.id)}
          versao={o.versao}
          rotuloDoBotao="Registrar"
        >
          {(erros, v) => (
            <div className="grid gap-3 sm:grid-cols-3">
              <Campo id={`d-${o.id}`} rotulo="Data" erro={erros.data}>
                <input
                  id={`d-${o.id}`}
                  name="data"
                  type="date"
                  max={hoje}
                  defaultValue={v.data ?? hoje}
                  className={campo}
                />
              </Campo>
              <Campo
                id={`c-${o.id}`}
                rotulo="Protocolo ou comprovante"
                erro={erros.comprovante}
              >
                <input
                  id={`c-${o.id}`}
                  name="comprovante"
                  maxLength={80}
                  defaultValue={v.comprovante}
                  className={campo}
                />
              </Campo>
              <Campo
                id={`o-${o.id}`}
                rotulo="Observação"
                erro={erros.observacao}
              >
                <input
                  id={`o-${o.id}`}
                  name="observacao"
                  maxLength={500}
                  defaultValue={v.observacao}
                  className={campo}
                />
              </Campo>
            </div>
          )}
        </Formulario>
      </div>
    </details>
  );
}

export function ExcluirObrigacao({ id }: { id: string }) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      {erro && <span className="text-nao-conforme">{erro}</span>}
      <button
        type="button"
        disabled={pendente}
        className="text-texto-2 hover:text-nao-conforme hover:underline"
        onClick={() => iniciar(async () => setErro(await excluirObrigacao(id)))}
      >
        Excluir
      </button>
    </span>
  );
}
