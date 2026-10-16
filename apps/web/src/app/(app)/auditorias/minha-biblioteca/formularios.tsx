"use client";

import { useActionState, useState, useTransition } from "react";
import { NORMAS, TIPOS_DE_CRITERIO, TIPOS_DE_DESVIO } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import {
  criarCriterioProprio,
  criarModeloNcProprio,
  excluirItemProprio,
  importarPlanilha,
  type EstadoDaAcao,
  type ItemProprio,
} from "@/lib/acoes-auditorias";
import { areaDeTexto, botaoLink, botaoPrimario, campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import {
  COLUNAS_DA_PLANILHA,
  NOMES_DA_PLANILHA,
} from "@/lib/planilha-da-biblioteca";

function useCadastro(
  acao: (e: EstadoDaAcao, f: FormData) => Promise<EstadoDaAcao>,
) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    acao,
    {},
  );
  return {
    estado,
    enviar,
    enviando,
    erros: errosPorCampo(estado.erro?.detalhes),
    v: estado.valores ?? {},
  };
}

function Opcoes({ opcoes }: { opcoes: Record<string, string> }) {
  return (
    <>
      <option value="">Escolha</option>
      {Object.entries(opcoes).map(([k, n]) => (
        <option key={k} value={k}>
          {n}
        </option>
      ))}
    </>
  );
}

export function NovoCriterio() {
  const { estado, enviar, enviando, erros, v } =
    useCadastro(criarCriterioProprio);
  return (
    <form action={enviar} noValidate className="mt-3 flex flex-col gap-4">
      {estado.erro && !estado.erro.detalhes?.length && (
        <AvisoDeErro erro={estado.erro} />
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo id="tipo" rotulo="Tipo" erro={erros.tipo}>
          <Selecao
            id="tipo"
            name="tipo"
            defaultValue={v.tipo ?? ""}
            className={campo}
          >
            <Opcoes opcoes={TIPOS_DE_CRITERIO} />
          </Selecao>
        </Campo>
        <Campo id="nome" rotulo="Nome" erro={erros.nome}>
          <input
            id="nome"
            name="nome"
            defaultValue={v.nome}
            maxLength={150}
            placeholder="NR-12 Segurança em máquinas"
            className={campo}
          />
        </Campo>
        <Campo id="referencia" rotulo="Referência" erro={erros.referencia}>
          <input
            id="referencia"
            name="referencia"
            defaultValue={v.referencia}
            maxLength={150}
            placeholder="Portaria, contrato, revisão"
            className={campo}
          />
        </Campo>
      </div>
      <Campo
        id="requisitos"
        rotulo="Requisitos a verificar"
        erro={erros.requisitos}
        ajuda="Um por linha."
      >
        <textarea
          id="requisitos"
          name="requisitos"
          rows={4}
          defaultValue={v.requisitos}
          className={areaDeTexto}
        />
      </Campo>
      <div>
        <button type="submit" className={botaoPrimario} disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar critério"}
        </button>
      </div>
    </form>
  );
}

export function NovoModeloNc() {
  const { estado, enviar, enviando, erros, v } =
    useCadastro(criarModeloNcProprio);
  const texto = (id: string, rotulo: string, linhas: number, max: number) => (
    <Campo id={id} rotulo={rotulo} erro={erros[id]}>
      <textarea
        id={id}
        name={id}
        rows={linhas}
        maxLength={max}
        defaultValue={v[id]}
        className={areaDeTexto}
      />
    </Campo>
  );
  return (
    <form action={enviar} noValidate className="mt-3 flex flex-col gap-4">
      {estado.erro && !estado.erro.detalhes?.length && (
        <AvisoDeErro erro={estado.erro} />
      )}
      <div className="grid gap-4 sm:grid-cols-4">
        <Campo id="norma" rotulo="Norma" erro={erros.norma}>
          <Selecao
            id="norma"
            name="norma"
            defaultValue={v.norma ?? ""}
            className={campo}
          >
            <Opcoes opcoes={NORMAS} />
          </Selecao>
        </Campo>
        <Campo id="clausula" rotulo="Cláusula" erro={erros.clausula}>
          <input
            id="clausula"
            name="clausula"
            defaultValue={v.clausula}
            maxLength={20}
            className={`${campo} font-mono`}
          />
        </Campo>
        <Campo id="tipo" rotulo="Tipo de desvio" erro={erros.tipo}>
          <Selecao
            id="tipo"
            name="tipo"
            defaultValue={v.tipo ?? ""}
            className={campo}
          >
            <Opcoes opcoes={TIPOS_DE_DESVIO} />
          </Selecao>
        </Campo>
        <Campo id="titulo" rotulo="Título do desvio" erro={erros.titulo}>
          <input
            id="titulo"
            name="titulo"
            defaultValue={v.titulo}
            maxLength={150}
            className={campo}
          />
        </Campo>
      </div>
      {texto("descricao", "Redação da NC", 3, 1000)}
      <div className="grid gap-4 lg:grid-cols-3">
        {texto("causaRaiz", "Causa raiz comum", 3, 500)}
        {texto("acaoCorretiva", "Ação corretiva", 3, 500)}
        {texto("evidenciaFechamento", "Evidência de fechamento", 3, 500)}
      </div>
      <div>
        <button type="submit" className={botaoPrimario} disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar modelo de NC"}
        </button>
      </div>
    </form>
  );
}

export function ImportarPlanilha() {
  const { estado, enviar, enviando, v } = useCadastro(importarPlanilha);
  const [tipo, setTipo] = useState<keyof typeof COLUNAS_DA_PLANILHA>(
    (v.tipo as keyof typeof COLUNAS_DA_PLANILHA) || "pergunta",
  );
  const modelo = `data:text/csv;charset=utf-8,${encodeURIComponent(`${COLUNAS_DA_PLANILHA[tipo].join(";")}\n`)}`;
  return (
    <form action={enviar} className="mt-3 flex flex-col gap-4">
      {estado.erro && <AvisoDeErro erro={estado.erro} />}
      <div className="flex flex-wrap items-end gap-4">
        <Campo id="tipo-planilha" rotulo="O que importar">
          <select
            id="tipo-planilha"
            name="tipo"
            value={tipo}
            onChange={(e) =>
              setTipo(e.target.value as keyof typeof COLUNAS_DA_PLANILHA)
            }
            className={`${campo} w-60`}
          >
            {Object.entries(NOMES_DA_PLANILHA).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </select>
        </Campo>
        <a
          href={modelo}
          download={`modelo-${tipo}.csv`}
          className={`${botaoLink} pb-2 text-sm`}
        >
          Baixar planilha modelo
        </a>
      </div>
      <p className="text-sm text-texto-2">
        Colunas:{" "}
        <span className="font-mono">
          {COLUNAS_DA_PLANILHA[tipo].join("; ")}
        </span>
        . Use as chaves do sistema (ex.: norma{" "}
        <span className="font-mono">iso9001_2026</span>, processo{" "}
        <span className="font-mono">compras</span>). Salve como CSV separado por
        ponto e vírgula.
      </p>
      <Campo id="arquivo" rotulo="Arquivo CSV">
        <input
          id="arquivo"
          name="arquivo"
          type="file"
          accept=".csv,text/csv"
          className="text-base"
        />
      </Campo>
      <Campo id="conteudo" rotulo="Ou cole o conteúdo da planilha">
        <textarea
          id="conteudo"
          name="conteudo"
          rows={5}
          className={`${areaDeTexto} font-mono text-sm`}
        />
      </Campo>
      <div>
        <button type="submit" className={botaoPrimario} disabled={enviando}>
          {enviando ? "Importando…" : "Importar"}
        </button>
      </div>
    </form>
  );
}

/** Excluir um item próprio, com confirmação no próprio botão. */
export function ExcluirProprio({
  tipo,
  id,
  nome,
}: {
  tipo: ItemProprio;
  id: string;
  nome: string;
}) {
  const [confirmar, setConfirmar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      {erro && <span className="text-nao-conforme">{erro}</span>}
      {confirmar ? (
        <>
          <button
            type="button"
            disabled={pendente}
            className="font-semibold text-nao-conforme hover:underline"
            onClick={() =>
              iniciar(async () => setErro(await excluirItemProprio(tipo, id)))
            }
          >
            {pendente ? "Excluindo…" : "Confirmar exclusão"}
          </button>
          <button
            type="button"
            className="text-texto-2 hover:underline"
            onClick={() => setConfirmar(false)}
          >
            Manter
          </button>
        </>
      ) : (
        <button
          type="button"
          aria-label={`Excluir ${nome}`}
          className="text-texto-2 hover:text-nao-conforme hover:underline"
          onClick={() => setConfirmar(true)}
        >
          Excluir
        </button>
      )}
    </span>
  );
}
