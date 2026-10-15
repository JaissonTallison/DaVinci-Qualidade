"use client";

import Link from "next/link";
import { useActionState } from "react";
import { TIPOS_INSPECAO, type ModeloDeInspecao } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { LinhasDeItem } from "@/components/linhas-de-item";
import { salvarModelo, type EstadoDaAcao } from "@/lib/acoes-inspecoes";
import {
  botaoPrimario,
  botaoSecundario,
  campo,
  painel,
  tituloDaSecao,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

/** Criar (sem `modelo`) ou editar um modelo de inspeção. */
export function FormularioDeModelo({ modelo }: { modelo?: ModeloDeInspecao }) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarModelo.bind(null, modelo?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {
    nome: modelo?.nome ?? "",
    tipo: modelo?.tipo ?? "",
  };
  const itens =
    estado.itens?.map((i) => ({
      verificar: i.verificar ?? "",
      criterio: i.criterio,
    })) ?? modelo?.itens;
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;

  return (
    <form action={acao} noValidate className={`${painel} mt-6 max-w-4xl`}>
      {modelo && <input type="hidden" name="versao" value={modelo.versao} />}
      <div className="flex flex-col gap-5 p-5">
        {erroGeral && <AvisoDeErro erro={erroGeral} />}
        <div className="grid gap-5 sm:grid-cols-3">
          <Campo
            id="nome"
            rotulo="Nome"
            erro={erros.nome}
            className="sm:col-span-2"
          >
            <input
              id="nome"
              name="nome"
              defaultValue={v.nome}
              maxLength={120}
              className={campo}
              aria-invalid={Boolean(erros.nome)}
            />
          </Campo>
          <Campo id="tipo" rotulo="Tipo" erro={erros.tipo}>
            <select
              id="tipo"
              name="tipo"
              defaultValue={v.tipo ?? ""}
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
            </select>
          </Campo>
        </div>
      </div>
      <div className="border-t border-borda p-5">
        <h2 className={tituloDaSecao}>Itens a verificar</h2>
        {erros.itens && (
          <p className="mt-1 text-sm text-nao-conforme">{erros.itens}</p>
        )}
        <div className="mt-3">
          <LinhasDeItem valores={itens} erros={erros} />
        </div>
      </div>
      <div className="flex justify-end gap-3 border-t border-borda px-5 py-3">
        <Link href="/qualidade/modelos-de-inspecao" className={botaoSecundario}>
          Voltar
        </Link>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : modelo ? "Salvar modelo" : "Criar modelo"}
        </button>
      </div>
    </form>
  );
}
