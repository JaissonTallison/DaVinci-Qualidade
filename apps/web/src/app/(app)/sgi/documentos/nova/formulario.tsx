"use client";

import { useActionState } from "react";
import { TIPOS_DOCUMENTO, type Documento } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { salvarDocumento } from "@/lib/acoes-documentos";
import { campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Botao } from "@/components/botao";

export function FormularioDeDocumento({
  documento,
}: {
  documento?: Documento;
}) {
  const id = documento?.id ?? null;
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarDocumento.bind(null, id),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? documento ?? {};
  const base = id ? `/sgi/documentos/${id}` : "/sgi/documentos";
  return (
    <form action={acao} noValidate className="mt-6">
      {id && <input type="hidden" name="versao" value={documento!.versao} />}
      <CadastroEmBlocos
        resumo={[
          { rotulo: "Código", campo: "codigo" },
          { rotulo: "Tipo", campo: "tipo" },
          { rotulo: "Elaborador", campo: "elaboradoPor" },
        ]}
        acoes={
          <>
            <Botao href={base} tamanho="grande">
              Cancelar
            </Botao>
            <Botao
              type="submit"
              carregando={salvando}
              textoCarregando="Salvando…"
              variante="primario"
              tamanho="grande"
            >
              {id ? "Salvar documento" : "Criar documento"}
            </Botao>
          </>
        }
      >
        <Bloco
          id="identificacao"
          titulo="Identificação"
          descricao="Código, título e tipo do documento."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            {estado.erro && !estado.erro.detalhes?.length && (
              <div className="sm:col-span-3">
                <AvisoDeErro erro={estado.erro} />
              </div>
            )}
            <Campo
              id="codigo"
              rotulo="Código"
              erro={erros.codigo}
              ajuda="O código que a sua organização usa, ex.: PQ-001, PR-014."
            >
              <input
                id="codigo"
                required
                name="codigo"
                maxLength={30}
                defaultValue={v.codigo}
                className={campo}
                aria-invalid={Boolean(erros.codigo)}
              />
            </Campo>
            <Campo
              id="tipo"
              rotulo="Tipo"
              erro={erros.tipo}
              className="sm:col-span-2"
            >
              <Selecao
                id="tipo"
                required
                name="tipo"
                defaultValue={v.tipo}
                className={campo}
                aria-invalid={Boolean(erros.tipo)}
              >
                <option value="">Escolha</option>
                {Object.entries(TIPOS_DOCUMENTO).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo
              id="titulo"
              rotulo="Título"
              erro={erros.titulo}
              className="sm:col-span-3"
            >
              <input
                id="titulo"
                required
                name="titulo"
                maxLength={150}
                defaultValue={v.titulo}
                className={campo}
                aria-invalid={Boolean(erros.titulo)}
              />
            </Campo>
          </div>
        </Bloco>
        <Bloco
          id="responsabilidade"
          titulo="Responsabilidade"
          descricao="Área a que se aplica e quem elaborou."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo
              id="area"
              rotulo="Área ou processo"
              erro={erros.area}
              ajuda="Opcional."
            >
              <input
                id="area"
                name="area"
                maxLength={120}
                defaultValue={v.area ?? undefined}
                className={campo}
                aria-invalid={Boolean(erros.area)}
              />
            </Campo>
            <Campo
              id="elaboradoPor"
              rotulo="Elaborado por"
              erro={erros.elaboradoPor}
              className="sm:col-span-2"
            >
              <input
                id="elaboradoPor"
                required
                name="elaboradoPor"
                list="pessoas"
                maxLength={120}
                defaultValue={v.elaboradoPor}
                className={campo}
                aria-invalid={Boolean(erros.elaboradoPor)}
              />
            </Campo>
          </div>
        </Bloco>
      </CadastroEmBlocos>
    </form>
  );
}
