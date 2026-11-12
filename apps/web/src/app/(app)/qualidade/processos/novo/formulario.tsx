"use client";

import { useActionState } from "react";
import { type Processo } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import type { EstadoDaAcao } from "@/lib/acao";
import { salvarProcesso } from "@/lib/acoes-processos";
import { areaDeTexto, campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Botao } from "@/components/botao";

export function FormularioDeProcesso({ processo }: { processo?: Processo }) {
  const id = processo?.id ?? null;
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarProcesso.bind(null, id),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? processo ?? {};
  const base = id ? `/qualidade/processos/${id}` : "/qualidade/processos";
  return (
    <form action={acao} noValidate className="mt-6">
      {id && <input type="hidden" name="versao" value={processo!.versao} />}
      <CadastroEmBlocos
        resumo={[
          { rotulo: "Código", campo: "codigo" },
          { rotulo: "Departamento", campo: "departamento" },
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
              {id ? "Salvar processo" : "Criar processo"}
            </Botao>
          </>
        }
      >
        <Bloco
          id="identificacao"
          titulo="Identificação"
          descricao="Código e nome do processo."
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
              ajuda="Ex.: PR-REC-001."
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
              id="nome"
              rotulo="Nome do processo"
              erro={erros.nome}
              className="sm:col-span-2"
            >
              <input
                id="nome"
                required
                name="nome"
                maxLength={150}
                defaultValue={v.nome}
                className={campo}
                aria-invalid={Boolean(erros.nome)}
              />
            </Campo>
          </div>
        </Bloco>
        <Bloco
          id="definicao"
          titulo="Definição"
          descricao="Objetivo, escopo e descrição do processo."
        >
          <div className="grid gap-5">
            <Campo id="objetivo" rotulo="Objetivo" erro={erros.objetivo}>
              <textarea
                id="objetivo"
                name="objetivo"
                rows={2}
                maxLength={2000}
                defaultValue={v.objetivo ?? undefined}
                className={areaDeTexto}
              />
            </Campo>
            <Campo id="escopo" rotulo="Escopo" erro={erros.escopo}>
              <textarea
                id="escopo"
                name="escopo"
                rows={2}
                maxLength={2000}
                defaultValue={v.escopo ?? undefined}
                className={areaDeTexto}
              />
            </Campo>
            <Campo id="descricao" rotulo="Descrição" erro={erros.descricao}>
              <textarea
                id="descricao"
                name="descricao"
                rows={3}
                maxLength={2000}
                defaultValue={v.descricao ?? undefined}
                className={areaDeTexto}
              />
            </Campo>
          </div>
        </Bloco>
        <Bloco
          id="responsabilidade"
          titulo="Responsabilidade"
          descricao="Unidade, departamento, gestor e quem elaborou."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo id="unidade" rotulo="Unidade de negócio" erro={erros.unidade}>
              <input
                id="unidade"
                name="unidade"
                maxLength={120}
                defaultValue={v.unidade ?? undefined}
                className={campo}
              />
            </Campo>
            <Campo
              id="departamento"
              rotulo="Departamento responsável"
              erro={erros.departamento}
            >
              <input
                id="departamento"
                name="departamento"
                maxLength={120}
                defaultValue={v.departamento ?? undefined}
                className={campo}
              />
            </Campo>
            <Campo id="gestor" rotulo="Gestor do processo" erro={erros.gestor}>
              <input
                id="gestor"
                name="gestor"
                list="pessoas"
                maxLength={120}
                defaultValue={v.gestor ?? undefined}
                className={campo}
              />
            </Campo>
            <Campo
              id="elaboradoPor"
              rotulo="Elaborado por"
              erro={erros.elaboradoPor}
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
        <Bloco
          id="normas"
          titulo="Normas relacionadas"
          descricao="Normas que o processo atende (opcional)."
        >
          <Campo
            id="normas"
            rotulo="Normas"
            erro={erros.normas}
            ajuda="Ex.: ISO 9001, ISO 14001."
          >
            <input
              id="normas"
              name="normas"
              maxLength={300}
              defaultValue={v.normas ?? undefined}
              className={campo}
            />
          </Campo>
        </Bloco>
      </CadastroEmBlocos>
    </form>
  );
}
