"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  NIVEIS_DE_INSPECAO,
  NQAS,
  TIPOS_INSPECAO,
  planoDeAmostragem,
  type ModeloDeInspecao,
  type NivelDeInspecao,
  type Nqa,
  type ParceiroResumo,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { LinhasDeItem } from "@/components/linhas-de-item";
import { Selecao } from "@/components/selecao";
import { criarInspecao, type EstadoDaAcao } from "@/lib/acoes-inspecoes";
import {
  botaoPrimario,
  botaoSecundario,
  campo,
  painel,
  tituloDaSecao,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

export function FormularioNovaInspecao({
  modelos,
  hoje,
  inspetor,
  fornecedores,
}: {
  modelos: ModeloDeInspecao[];
  hoje: string;
  inspetor: string;
  fornecedores: ParceiroResumo[];
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    criarInspecao,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  const [modeloId, setModeloId] = useState(
    v.modeloId ?? (modelos.length ? modelos[0]!.id : ""),
  );
  const modelo = modelos.find((m) => m.id === modeloId);
  const [nqa, setNqa] = useState(v.nqa ?? "");
  const [nivel, setNivel] = useState(v.nivelInspecao ?? "II");
  const [lote, setLote] = useState(v.quantidade ?? "");
  const tamanho = Number(lote);
  const plano =
    nqa && Number.isInteger(tamanho) && tamanho > 0
      ? planoDeAmostragem(tamanho, nivel as NivelDeInspecao, nqa as Nqa)
      : null;
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;

  return (
    <form action={acao} noValidate className={`${painel} mt-6`}>
      <div className="flex flex-col gap-5 p-5">
        {erroGeral && <AvisoDeErro erro={erroGeral} />}
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo
            id="modeloId"
            rotulo="Modelo"
            erro={erros.modeloId}
            ajuda={
              modelo
                ? `${modelo.itens.length} itens a verificar`
                : "Os itens serão digitados abaixo."
            }
          >
            <Selecao
              id="modeloId"
              name="modeloId"
              defaultValue={modeloId}
              onChange={(e) => setModeloId(e.target.value)}
              className={campo}
            >
              {modelos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
              <option value="">Sem modelo: digitar os itens</option>
            </Selecao>
          </Campo>
          <Campo id="tipo" rotulo="Tipo" erro={erros.tipo}>
            <Selecao
              id="tipo"
              name="tipo"
              key={modeloId}
              defaultValue={v.tipo ?? modelo?.tipo ?? ""}
              className={campo}
              aria-invalid={Boolean(erros.tipo)}
            >
              <option value="" disabled>
                Escolha
              </option>
              {Object.entries(TIPOS_INSPECAO).map(([chave, nome]) => (
                <option key={chave} value={chave}>
                  {nome}
                </option>
              ))}
            </Selecao>
          </Campo>
        </div>
        <Campo
          id="objeto"
          rotulo="O que está sendo inspecionado"
          erro={erros.objeto}
          ajuda="Produto, serviço ou processo. Ex.: Eixo usinado 10 mm, fornecedor Usinagem Alfa."
        >
          <input
            id="objeto"
            name="objeto"
            defaultValue={v.objeto}
            maxLength={200}
            className={campo}
            aria-invalid={Boolean(erros.objeto)}
          />
        </Campo>
        <div className="grid gap-5 sm:grid-cols-3">
          <Campo id="lote" rotulo="Lote" erro={erros.lote}>
            <input
              id="lote"
              name="lote"
              defaultValue={v.lote}
              maxLength={60}
              className={`${campo} font-mono`}
            />
          </Campo>
          <Campo
            id="quantidade"
            rotulo={nqa ? "Tamanho do lote" : "Quantidade inspecionada"}
            erro={erros.quantidade}
          >
            <input
              id="quantidade"
              name="quantidade"
              inputMode="numeric"
              value={lote}
              onChange={(e) => setLote(e.target.value)}
              className={campo}
              aria-invalid={Boolean(erros.quantidade)}
            />
          </Campo>
          <Campo id="local" rotulo="Local" erro={erros.local}>
            <input
              id="local"
              name="local"
              list="setores"
              defaultValue={v.local}
              maxLength={120}
              className={campo}
            />
          </Campo>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Campo id="inspetor" rotulo="Inspetor" erro={erros.inspetor}>
            <input
              id="inspetor"
              name="inspetor"
              list="pessoas"
              defaultValue={v.inspetor ?? inspetor}
              maxLength={120}
              className={campo}
              aria-invalid={Boolean(erros.inspetor)}
            />
          </Campo>
          {fornecedores.length > 0 && (
            <Campo
              id="fornecedorId"
              rotulo="Fornecedor"
              erro={erros.fornecedorId}
              ajuda="No recebimento: entra no índice do fornecedor."
            >
              <Selecao
                id="fornecedorId"
                name="fornecedorId"
                defaultValue={v.fornecedorId ?? ""}
                className={campo}
              >
                <option value="">Sem fornecedor</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </Selecao>
            </Campo>
          )}
          <Campo id="data" rotulo="Data" erro={erros.data}>
            <input
              id="data"
              name="data"
              type="date"
              max={hoje}
              defaultValue={v.data ?? hoje}
              className={campo}
              aria-invalid={Boolean(erros.data)}
            />
          </Campo>
        </div>
      </div>

      <fieldset className="border-t border-borda p-5">
        <legend className="sr-only">Amostragem</legend>
        <h2 className={tituloDaSecao}>Amostragem (NBR 5426)</h2>
        <p className="mt-1 text-base text-texto-2">
          Opcional. Com o NQA, o sistema calcula o tamanho da amostra e quantos
          defeituosos o lote aceita (amostragem simples, inspeção normal).
        </p>
        <div className="mt-3 grid gap-5 sm:grid-cols-3">
          <Campo id="nqa" rotulo="NQA" erro={erros.nqa}>
            <select
              id="nqa"
              name="nqa"
              value={nqa}
              onChange={(e) => setNqa(e.target.value)}
              className={campo}
            >
              <option value="">Sem amostragem (100% dos itens)</option>
              {Object.entries(NQAS).map(([k, n]) => (
                <option key={k} value={k}>
                  {n}
                </option>
              ))}
            </select>
          </Campo>
          <Campo
            id="nivelInspecao"
            rotulo="Nível de inspeção"
            erro={erros.nivelInspecao}
          >
            <select
              id="nivelInspecao"
              name="nivelInspecao"
              value={nivel}
              onChange={(e) => setNivel(e.target.value)}
              disabled={!nqa}
              className={campo}
            >
              {Object.entries(NIVEIS_DE_INSPECAO).map(([k, n]) => (
                <option key={k} value={k}>
                  {n}
                </option>
              ))}
            </select>
          </Campo>
          <div aria-live="polite" className="self-end text-base">
            {plano ? (
              <p>
                Letra <span className="font-mono">{plano.letraDoPlano}</span>:
                amostra de{" "}
                <span className="font-semibold tabular-nums">
                  {plano.amostra}
                </span>
                {plano.cemPorCento && " (100% do lote)"}, aceita com até{" "}
                <span className="font-semibold tabular-nums">
                  {plano.aceita}
                </span>{" "}
                defeituoso{plano.aceita === 1 ? "" : "s"}, rejeita com{" "}
                <span className="font-semibold tabular-nums">
                  {plano.rejeita}
                </span>
                .
              </p>
            ) : nqa ? (
              <p className="text-texto-2">
                Informe o tamanho do lote para ver o plano.
              </p>
            ) : null}
          </div>
        </div>
      </fieldset>

      {!modeloId && (
        <div className="border-t border-borda p-5">
          <h2 className={tituloDaSecao}>Itens a verificar</h2>
          {erros.itens && (
            <p className="mt-1 text-sm text-nao-conforme">{erros.itens}</p>
          )}
          <div className="mt-3">
            <LinhasDeItem
              valores={estado.itens?.map((i) => ({
                verificar: i.verificar ?? "",
                criterio: i.criterio,
              }))}
              erros={erros}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-borda px-5 py-3">
        <Link href="/qualidade/inspecoes" className={botaoSecundario}>
          <ArrowLeft aria-hidden size={16} strokeWidth={2} />
          Voltar
        </Link>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Criando…" : "Criar e responder"}
        </button>
      </div>
    </form>
  );
}
