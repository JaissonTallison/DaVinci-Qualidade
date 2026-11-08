"use client";

import { useActionState } from "react";
import { TIPOS_INSPECAO, type ModeloDeInspecao } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import { LinhasDeItem } from "@/components/linhas-de-item";
import { Selecao } from "@/components/selecao";
import { salvarModelo, type EstadoDaAcao } from "@/lib/acoes-inspecoes";
import { campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Botao } from "@/components/botao";

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
    <form action={acao} noValidate className="mt-6">
      {modelo && <input type="hidden" name="versao" value={modelo.versao} />}
      {erroGeral && (
        <div className="mb-5">
          <AvisoDeErro erro={erroGeral} />
        </div>
      )}
      <CadastroEmBlocos
        resumo={[
          { rotulo: "Modelo", campo: "nome" },
          { rotulo: "Tipo", campo: "tipo" },
        ]}
        acoes={
          <>
            <Botao href="/qualidade/modelos-de-inspecao" tamanho="grande">
              Cancelar
            </Botao>
            <Botao
              type="submit"
              disabled={salvando}
              variante="primario"
              tamanho="grande"
            >
              {salvando
                ? "Salvando…"
                : modelo
                  ? "Salvar modelo"
                  : "Criar modelo"}
            </Botao>
          </>
        }
      >
        <Bloco id="modelo" titulo="Modelo" descricao="Nome e tipo de inspeção.">
          <div className="flex flex-col gap-5">
            <p className="max-w-2xl text-sm text-texto-2">
              Ao criar uma inspeção com este modelo, os itens abaixo são
              copiados para ela. Mudar o modelo depois não altera as inspeções
              já feitas.
            </p>
            <div className="grid gap-5 sm:grid-cols-3">
              <Campo
                id="nome"
                rotulo="Nome *"
                erro={erros.nome}
                ajuda="Como o modelo aparece na escolha. Ex.: Recebimento de eixos"
                className="sm:col-span-2"
              >
                <input
                  id="nome"
                  required
                  name="nome"
                  defaultValue={v.nome}
                  maxLength={120}
                  className={campo}
                  aria-invalid={Boolean(erros.nome)}
                />
              </Campo>
              <Campo id="tipo" rotulo="Tipo *" erro={erros.tipo}>
                <Selecao
                  id="tipo"
                  required
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
                </Selecao>
              </Campo>
            </div>
          </div>
        </Bloco>
        <Bloco
          id="itens"
          titulo="Itens a verificar"
          descricao="O que o inspetor confere em cada item e, quando houver, o critério que decide aprovado ou reprovado. Inclua ao menos um item."
        >
          {erros.itens && (
            <p className="mb-3 text-sm text-nao-conforme">{erros.itens}</p>
          )}
          <LinhasDeItem valores={itens} erros={erros} />
        </Bloco>
      </CadastroEmBlocos>
    </form>
  );
}
