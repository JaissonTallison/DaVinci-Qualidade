"use client";

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
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import { LinhasDeItem } from "@/components/linhas-de-item";
import { Selecao } from "@/components/selecao";
import { criarInspecao, type EstadoDaAcao } from "@/lib/acoes-inspecoes";
import { campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Botao } from "@/components/botao";

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
    <form action={acao} noValidate className="mt-6">
      {erroGeral && (
        <div className="mb-5">
          <AvisoDeErro erro={erroGeral} />
        </div>
      )}
      <CadastroEmBlocos
        resumo={[
          { rotulo: "Tipo", campo: "tipo" },
          { rotulo: "Objeto", campo: "objeto" },
          { rotulo: "Inspetor", campo: "inspetor" },
          { rotulo: "Data", campo: "data" },
        ]}
        acoes={
          <>
            <Botao href="/qualidade/inspecoes" tamanho="grande">
              Cancelar
            </Botao>
            <Botao
              type="submit"
              carregando={salvando}
              textoCarregando="Criando…"
              variante="primario"
              tamanho="grande"
            >
              Criar e responder
            </Botao>
          </>
        }
      >
        <Bloco
          id="inspecao"
          titulo="Inspeção"
          descricao="Modelo, tipo e o que está sendo inspecionado."
        >
          <div className="flex flex-col gap-5">
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
                  required
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
                required
                name="objeto"
                defaultValue={v.objeto}
                maxLength={200}
                className={campo}
                aria-invalid={Boolean(erros.objeto)}
              />
            </Campo>
          </div>
        </Bloco>
        <Bloco
          id="lote"
          titulo="Lote e responsável"
          descricao="Lote, quantidade, local, quem inspeciona, fornecedor e data."
        >
          <div className="flex flex-col gap-5">
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
                  required
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
                  required
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
        </Bloco>
        <Bloco
          id="amostragem"
          titulo="Amostragem"
          descricao="NBR 5426, inspeção por atributos. Com o NQA, o sistema calcula o tamanho da amostra e quantos defeituosos o lote aceita (amostragem simples, inspeção normal)."
        >
          <fieldset>
            <legend className="sr-only">Amostragem</legend>
            <div className="grid gap-5 sm:grid-cols-3">
              <Campo id="nqa" rotulo="NQA" erro={erros.nqa}>
                <select
                  id="nqa"
                  name="nqa"
                  value={nqa}
                  onChange={(e) => setNqa(e.target.value)}
                  className={campo}
                >
                  <option value="">Sem amostragem (100% dos itens)</option>
                  {/* Ordena pelo valor numérico: a chave "10" é índice inteiro no JS e, sem isto,
                  o Object.entries a traz na frente de "0.065". */}
                  {Object.entries(NQAS)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([k, n]) => (
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
                    Letra{" "}
                    <span className="font-mono">{plano.letraDoPlano}</span>:
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
        </Bloco>

        {!modeloId && (
          <Bloco
            id="itens"
            titulo="Itens a verificar"
            descricao="O que o inspetor confere e, quando houver, o critério de aprovação. Inclua ao menos um item."
          >
            {erros.itens && (
              <p className="mb-3 text-sm text-nao-conforme">{erros.itens}</p>
            )}
            <div>
              <LinhasDeItem
                valores={estado.itens?.map((i) => ({
                  verificar: i.verificar ?? "",
                  criterio: i.criterio,
                }))}
                erros={erros}
              />
            </div>
          </Bloco>
        )}
      </CadastroEmBlocos>
    </form>
  );
}
