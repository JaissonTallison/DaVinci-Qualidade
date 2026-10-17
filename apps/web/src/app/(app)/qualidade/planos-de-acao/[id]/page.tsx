import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ORIGENS_PLANO,
  SITUACOES_TAREFA,
  TIPOS_PLANO,
  type DadosDoUsuario,
  type PlanoDeAcao,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Progresso, StatusDoPlano } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento, prazoRelativo } from "@/lib/datas";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import { formatarReais } from "@/lib/valores";
import { AnexosDoItem } from "@/components/anexos-do-item";
import { AcoesDaTarefa, AcoesDoPlano } from "./acoes";
import { Anexos } from "@/components/anexos";

export const metadata: Metadata = { title: "Plano de ação" };

const AVISOS: Record<string, string> = {
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
  criado: "Plano criado. Conclua as tarefas conforme forem feitas.",
  "tarefa-incluida": "Tarefa incluída.",
  "tudo-concluido":
    "Todas as tarefas concluídas. Falta verificar se o objetivo foi alcançado.",
  encerrado: "Objetivo alcançado. Plano encerrado.",
  ineficaz:
    "Objetivo não alcançado. O plano voltou para execução: inclua as tarefas que faltam.",
  cancelado: "Plano cancelado.",
};

export default async function DetalheDoPlano({
  params,
  searchParams,
}: PageProps<"/qualidade/planos-de-acao/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<PlanoDeAcao>(`/planos-de-acao/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const p = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const terminado = p.status === "encerrado" || p.status === "cancelado";
  const podeEditar = !terminado && permissoes.includes("qualidade.editar");

  return (
    <article>
      <Link
        href="/qualidade/planos-de-acao"
        className="dv-voltar"
      >
        Planos de ação
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-lg text-texto-2">{p.numero}</span>
        <StatusDoPlano
          status={p.status}
          atrasado={p.atrasado}
          prazo={p.prazo}
        />
        <Progresso
          valor={p.progresso}
          feitos={p.tarefas.filter((t) => t.situacao === "concluida").length}
          total={p.tarefas.filter((t) => t.situacao !== "cancelada").length}
        />
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>{p.titulo}</h1>

      {aviso && AVISOS[aviso] && (
        <p
          role="status"
          className="mt-4 rounded-sm border border-borda bg-superficie px-4 py-2.5 text-base text-texto"
        >
          {AVISOS[aviso]}
        </p>
      )}

      <section className={`${painel} mt-6 p-5`}>
        <h2 className={tituloDaSecao}>Objetivo</h2>
        <p className="mt-3 max-w-[72ch] text-md whitespace-pre-line">
          {p.objetivo}
        </p>
        <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          <Dado rotulo="Tipo">{TIPOS_PLANO[p.tipo]}</Dado>
          <Dado rotulo="Origem">
            {ORIGENS_PLANO[p.origem]}
            {p.origemRef &&
              (p.ncId ? (
                <Link
                  href={`/qualidade/nao-conformidades/${p.ncId}`}
                  className="ml-1 font-mono text-sm text-info hover:underline"
                >
                  {p.origemRef}
                </Link>
              ) : (
                <span className="ml-1 font-mono text-sm">{p.origemRef}</span>
              ))}
          </Dado>
          <Dado rotulo="Responsável">{p.responsavel}</Dado>
          <Dado rotulo="Prazo">
            {formatarData(p.prazo)}
            {!terminado && (
              <span className="text-texto-2"> · {prazoRelativo(p.prazo)}</span>
            )}
          </Dado>
          {p.custoPrevisto && (
            <Dado rotulo="Custo previsto">
              {formatarReais(p.custoPrevisto)}
            </Dado>
          )}
        </dl>
      </section>

      <section className={`${painel} mt-6`}>
        <h2 className={`${tituloDaSecao} px-5 pt-5`}>Tarefas</h2>
        <div className="relative mt-3 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-superficie-2 text-sm text-texto-2">
              <tr>
                <th className="px-5 py-2 font-semibold">O que fazer</th>
                <th className="px-4 py-2 font-semibold">Quem</th>
                <th className="px-4 py-2 font-semibold">Até quando</th>
                <th className="px-4 py-2 font-semibold">Situação</th>
                {podeEditar && (
                  <th className="px-4 py-2 font-semibold">
                    <span className="sr-only">Ações</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {p.tarefas.map((t) => (
                <tr
                  key={t.id}
                  className={t.situacao === "cancelada" ? "text-texto-3" : ""}
                >
                  <td className="max-w-xl px-5 py-2.5">
                    <span
                      className={
                        t.situacao === "cancelada" ? "line-through" : ""
                      }
                    >
                      {t.oQue}
                    </span>
                    {(t.onde || t.como) && (
                      <span className="block text-sm text-texto-2">
                        {[t.onde, t.como].filter(Boolean).join(" · ")}
                      </span>
                    )}
                    {t.motivoCancelamento && (
                      <span className="block text-sm">
                        Cancelada: {t.motivoCancelamento}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {t.responsavel}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {formatarData(t.prazo)}
                    {t.situacao === "pendente" && (
                      <span
                        className={`block text-xs ${t.atrasada ? "text-nao-conforme" : "text-texto-3"}`}
                      >
                        {prazoRelativo(t.prazo)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {SITUACOES_TAREFA[t.situacao]}
                    {t.concluidaEm && (
                      <span className="block text-xs text-texto-3">
                        {formatarMomento(t.concluidaEm)}
                      </span>
                    )}
                  </td>
                  {podeEditar && (
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <AcoesDaTarefa
                        planoId={p.id}
                        versao={p.versao}
                        tarefa={t}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${painel} mt-6`}>
        <h2 className={`${tituloDaSecao} px-5 pt-5`}>Evidências das tarefas</h2>
        <p className="px-5 text-base text-texto-2">
          O registro que comprova cada tarefa feita: documento revisado, lista
          de presença, foto, tela do sistema.
        </p>
        <ol className="mt-3 divide-y divide-borda border-t border-borda">
          {p.tarefas
            .filter((t) => t.situacao !== "cancelada")
            .map((t) => (
              <li
                key={t.id}
                className="grid gap-2 px-5 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
              >
                <p className="text-base">
                  <span className="mr-2 text-texto-3 tabular-nums">
                    {t.ordem + 1}.
                  </span>
                  {t.oQue}
                  <span className="block text-sm text-texto-2">
                    {t.responsavel} · {SITUACOES_TAREFA[t.situacao]}
                  </span>
                </p>
                <AnexosDoItem
                  registro="tarefa_do_plano"
                  registroId={t.id}
                  voltar={`/qualidade/planos-de-acao/${p.id}`}
                  podeEditar={podeEditar}
                />
              </li>
            ))}
        </ol>
      </section>

      {p.eficaz !== null && (
        <section className={`${painel} mt-6 p-5`}>
          <h2 className={tituloDaSecao}>Verificação de eficácia</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-3">
            <Dado rotulo="Resultado da última verificação">
              {p.eficaz ? "Objetivo alcançado" : "Objetivo não alcançado"}
            </Dado>
            {p.verificadoEm && (
              <Dado rotulo="Verificada em">
                {formatarMomento(p.verificadoEm)}
              </Dado>
            )}
          </dl>
          {p.parecerEficacia && (
            <p className="mt-4 max-w-[72ch] text-base whitespace-pre-line">
              {p.parecerEficacia}
            </p>
          )}
        </section>
      )}

      {p.status === "cancelado" && p.motivoCancelamento && (
        <section className={`${painel} mt-6 p-5`}>
          <h2 className={tituloDaSecao}>Cancelamento</h2>
          {p.canceladoEm && (
            <p className="mt-2 text-sm text-texto-2">
              {formatarMomento(p.canceladoEm)}
            </p>
          )}
          <p className="mt-2 text-base">{p.motivoCancelamento}</p>
        </section>
      )}

      {podeEditar && (
        <AcoesDoPlano
          plano={p}
          podeCancelar={permissoes.includes("qualidade.excluir")}
        />
      )}
      <Anexos
        registro="plano_de_acao"
        registroId={p.id}
        voltar={`/qualidade/planos-de-acao/${p.id}`}
        podeEditar={permissoes.includes("qualidade.editar")}
      />
    </article>
  );
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd className="mt-0.5 text-base">{children}</dd>
    </div>
  );
}
