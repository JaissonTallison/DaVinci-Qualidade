"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  PERIGOS_GHS,
  UNIDADES_PRODUTO,
  type ProdutoQuimico,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { botaoPrimario, botaoSecundario, campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

/** Cadastro e edição do produto. Na edição vai dentro do bloco recolhido, sem moldura própria. */
export function FormularioDeProduto({
  acao,
  produto,
}: {
  acao: (e: EstadoDaAcao, f: FormData) => Promise<EstadoDaAcao>;
  produto?: ProdutoQuimico;
}) {
  const [estado, enviar, salvando] = useActionState<EstadoDaAcao, FormData>(
    acao,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> = estado.valores ?? {
    nome: produto?.nome ?? "",
    fabricante: produto?.fabricante ?? "",
    cas: produto?.cas ?? "",
    perigos: produto?.perigos.join(",") ?? "",
    local: produto?.local ?? "",
    quantidadeMaxima: produto?.quantidadeMaxima?.toLocaleString("pt-BR") ?? "",
    unidade: produto?.unidade ?? "kg",
    fdsRevisao: produto?.fdsRevisao ?? "",
  };
  const marcados = new Set((v.perigos ?? "").split(",").filter(Boolean));
  const texto = (id: string, rotulo: string, max: number, ajuda?: string) => (
    <Campo id={id} rotulo={rotulo} erro={erros[id]} ajuda={ajuda}>
      <input
        id={id}
        required={!rotulo.includes("(opcional)")}
        name={id}
        maxLength={max}
        defaultValue={v[id]}
        className={campo}
        aria-invalid={Boolean(erros[id])}
      />
    </Campo>
  );
  return (
    <form action={enviar} noValidate className={produto ? "" : "mt-6"}>
      {produto && <input type="hidden" name="versao" value={produto.versao} />}
      <CadastroEmBlocos
        embutido={Boolean(produto)}
        acoesEmbutido={
          <>
            <button type="submit" className={botaoPrimario} disabled={salvando}>
              {salvando
                ? "Salvando…"
                : produto
                  ? "Salvar alterações"
                  : "Cadastrar produto"}
            </button>
          </>
        }
        resumo={[
          { rotulo: "Produto", campo: "nome" },
          { rotulo: "Local", campo: "local" },
          { rotulo: "Revisão da FDS", campo: "fdsRevisao" },
        ]}
        acoes={
          <>
            <Link
              href="/ambiental/produtos-quimicos"
              className={botaoSecundario}
            >
              Cancelar
            </Link>
            <button type="submit" className={botaoPrimario} disabled={salvando}>
              {salvando
                ? "Salvando…"
                : produto
                  ? "Salvar alterações"
                  : "Cadastrar produto"}
            </button>
          </>
        }
      >
        <Bloco
          id="produto"
          titulo="Produto"
          descricao="Nome comercial, fabricante e número CAS."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            {estado.erro && !estado.erro.detalhes?.length && (
              <div className="sm:col-span-3">
                <AvisoDeErro erro={estado.erro} />
              </div>
            )}
            {texto("nome", "Nome comercial", 150)}
            {texto("fabricante", "Fabricante ou fornecedor", 150)}
            {texto("cas", "Número CAS (opcional)", 15, "Ex.: 64-17-5")}
          </div>
        </Bloco>
        <Bloco
          id="armazenamento"
          titulo="Armazenamento e FDS"
          descricao="Onde fica, quanto se guarda e a revisão da FDS."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            {texto("local", "Onde é armazenado", 150)}
            <Campo
              id="quantidadeMaxima"
              rotulo="Quantidade máxima (opcional)"
              erro={erros.quantidadeMaxima}
            >
              <input
                id="quantidadeMaxima"
                name="quantidadeMaxima"
                inputMode="decimal"
                defaultValue={v.quantidadeMaxima}
                className={campo}
              />
            </Campo>
            <Campo id="unidade" rotulo="Unidade" erro={erros.unidade}>
              <Selecao
                id="unidade"
                required
                name="unidade"
                defaultValue={v.unidade}
                className={campo}
              >
                {Object.entries(UNIDADES_PRODUTO).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo
              id="fdsRevisao"
              rotulo="Revisão da FDS"
              erro={erros.fdsRevisao}
              ajuda="Data que aparece na FDS. Conferir com o fornecedor a cada 5 anos."
            >
              <input
                id="fdsRevisao"
                required
                name="fdsRevisao"
                type="date"
                defaultValue={v.fdsRevisao}
                className={campo}
                aria-invalid={Boolean(erros.fdsRevisao)}
              />
            </Campo>
            <fieldset className="sm:col-span-3">
              <legend className="text-base font-medium text-texto">
                Perigos (pictogramas da FDS)
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {Object.entries(PERIGOS_GHS).map(([k, n]) => (
                  <label
                    key={k}
                    className="inline-flex items-center gap-2 text-base"
                  >
                    <input
                      type="checkbox"
                      name="perigos"
                      value={k}
                      defaultChecked={marcados.has(k)}
                      className="size-4 accent-primaria"
                    />
                    {n}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </Bloco>
      </CadastroEmBlocos>
    </form>
  );
}
