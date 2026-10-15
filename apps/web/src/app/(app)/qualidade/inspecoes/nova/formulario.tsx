"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { TIPOS_INSPECAO, type ModeloDeInspecao } from "@davinci/types";
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
}: {
  modelos: ModeloDeInspecao[];
  hoje: string;
  inspetor: string;
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
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;

  return (
    <form action={acao} noValidate className={`${painel} mt-6 max-w-4xl`}>
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
            rotulo="Quantidade inspecionada"
            erro={erros.quantidade}
          >
            <input
              id="quantidade"
              name="quantidade"
              inputMode="numeric"
              defaultValue={v.quantidade}
              className={campo}
              aria-invalid={Boolean(erros.quantidade)}
            />
          </Campo>
          <Campo id="local" rotulo="Local" erro={erros.local}>
            <input
              id="local"
              name="local"
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
              defaultValue={v.inspetor ?? inspetor}
              maxLength={120}
              className={campo}
              aria-invalid={Boolean(erros.inspetor)}
            />
          </Campo>
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
