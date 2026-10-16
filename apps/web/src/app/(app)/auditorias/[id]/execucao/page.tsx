import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  NORMAS,
  PROCESSOS_AUDITADOS,
  RESPOSTAS_DA_PERGUNTA,
  type Auditoria,
  type DadosDoUsuario,
  type EvidenciaDaBiblioteca,
  type RespostaDaPergunta as Resposta,
  type RoteiroDaAuditoria,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import {
  RespostaMarcador,
  RiscoDaEvidenciaMarcador,
  TipoDaEvidencia,
} from "@/components/marcadores-auditoria";
import { chamarApi } from "@/lib/api";
import { painel } from "@/lib/estilos";
import { CabecalhoDaAuditoria } from "../cabecalho";
import { RespostaDaPergunta } from "./resposta";

export const metadata: Metadata = { title: "Auditar" };

/** Evidência da biblioteca serve à pergunta quando a cláusula é a mesma, mãe ou filha. */
const servePara = (e: string, q: string) =>
  e === q || q.startsWith(`${e}.`) || e.startsWith(`${q}.`);

/** Etapa Auditar: responder as perguntas do roteiro com a evidência; a biblioteca sugere o que pedir. */
export default async function Execucao({
  params,
  searchParams,
}: PageProps<"/auditorias/[id]/execucao">) {
  const { id } = await params;
  const { processo, pendentes } = (await searchParams) as {
    processo?: string;
    pendentes?: string;
  };
  const [a, r, eu] = await Promise.all([
    chamarApi<Auditoria>(`/auditorias/${id}`),
    chamarApi<RoteiroDaAuditoria>(`/auditorias/${id}/roteiro`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!a.ok && a.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!a.ok) return <AvisoDeErro erro={a.erro} />;
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const aud = a.dados;
  const bib = await Promise.all(
    aud.normas.map((n) =>
      chamarApi<EvidenciaDaBiblioteca[]>(`/evidencias-de-auditoria?norma=${n}`),
    ),
  );
  const evidencias = bib.flatMap((b) => (b.ok ? b.dados : []));
  const podeEditar =
    eu.ok &&
    eu.dados.permissoes.includes("auditorias.editar") &&
    aud.status === "em_andamento";
  const processos = [...new Set(r.dados.perguntas.map((p) => p.processo))];
  const perguntas = r.dados.perguntas.filter(
    (p) =>
      (!processo || p.processo === processo) &&
      (!pendentes || p.resposta === "pendente"),
  );
  const c = r.dados.contagem;
  return (
    <article>
      <CabecalhoDaAuditoria auditoria={aud} etapa="auditar" />
      {aud.status === "planejada" && (
        <p className="mt-6 rounded-sm border border-borda bg-superficie px-4 py-3 text-base">
          A auditoria ainda está planejada.{" "}
          <Link
            href={`/auditorias/${id}`}
            className="text-info hover:underline"
          >
            Inicie no resumo
          </Link>{" "}
          para registrar as respostas.
        </p>
      )}
      <section
        className={`${painel} mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3`}
        aria-label="Andamento"
      >
        {(Object.keys(RESPOSTAS_DA_PERGUNTA) as Resposta[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-2">
            <RespostaMarcador resposta={k} />
            <span className="font-semibold tabular-nums">{c[k]}</span>
          </span>
        ))}
        <nav
          aria-label="Filtrar"
          className="ml-auto flex flex-wrap gap-1.5 text-sm"
        >
          <Link
            href={`/auditorias/${id}/execucao${pendentes ? "?pendentes=1" : ""}`}
            aria-current={!processo ? "page" : undefined}
            className={`rounded-sm px-2 py-1 ${!processo ? "bg-superficie-2 font-semibold" : "text-texto-2 hover:text-texto"}`}
          >
            Todos os processos
          </Link>
          {processos.map((p) => (
            <Link
              key={p}
              href={`/auditorias/${id}/execucao?processo=${p}${pendentes ? "&pendentes=1" : ""}`}
              aria-current={processo === p ? "page" : undefined}
              className={`rounded-sm px-2 py-1 ${processo === p ? "bg-superficie-2 font-semibold" : "text-texto-2 hover:text-texto"}`}
            >
              {PROCESSOS_AUDITADOS[p]}
            </Link>
          ))}
          <Link
            href={`/auditorias/${id}/execucao?${processo ? `processo=${processo}&` : ""}${pendentes ? "" : "pendentes=1"}`}
            className="rounded-sm px-2 py-1 text-info hover:underline"
          >
            {pendentes ? "Mostrar todas" : "Só pendentes"}
          </Link>
        </nav>
      </section>
      {r.dados.perguntas.length === 0 ? (
        <p className={`${painel} mt-6 px-5 py-8 text-base text-texto-2`}>
          Nenhuma pergunta no roteiro.{" "}
          <Link
            href={`/auditorias/${id}/roteiro`}
            className="text-info hover:underline"
          >
            Monte o roteiro na etapa Planejar
          </Link>
          .
        </p>
      ) : (
        <ol className="mt-6 flex flex-col gap-4">
          {perguntas.map((p) => {
            const pedir = evidencias
              .filter(
                (e) => e.norma === p.norma && servePara(e.clausula, p.clausula),
              )
              .slice(0, 6);
            return (
              <li
                key={p.codigo}
                className={`${painel} grid gap-4 p-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]`}
              >
                <div>
                  <p className="text-sm text-texto-2">
                    <span className="font-mono">
                      {NORMAS[p.norma]} {p.clausula}
                    </span>{" "}
                    · {PROCESSOS_AUDITADOS[p.processo]}
                  </p>
                  <p className="mt-1 text-base font-semibold">{p.pergunta}</p>
                  {p.objetivo && (
                    <p className="mt-1 text-sm text-texto-2">
                      Objetivo: {p.objetivo}
                    </p>
                  )}
                  <details className="mt-1 text-sm">
                    <summary className="cursor-pointer text-info">
                      Resposta esperada e sinal de alerta
                    </summary>
                    <p className="mt-1">
                      <span className="font-semibold">Esperada:</span>{" "}
                      {p.respostaEsperada}
                    </p>
                    <p className="mt-0.5">
                      <span className="font-semibold">Alerta:</span>{" "}
                      {p.sinalDeAlerta}
                    </p>
                  </details>
                  <RespostaDaPergunta
                    auditoriaId={id}
                    pergunta={p}
                    podeEditar={podeEditar}
                  />
                </div>
                <aside
                  className="rounded-sm bg-superficie-2 p-3"
                  aria-label="O que pedir nesta cláusula"
                >
                  <p className="text-xs font-semibold tracking-[0.06em] text-texto-2 uppercase">
                    O que pedir nesta cláusula
                  </p>
                  {pedir.length === 0 ? (
                    <p className="mt-2 text-sm text-texto-2">
                      Sem evidência catalogada para esta cláusula.
                    </p>
                  ) : (
                    <ul className="mt-2 flex flex-col gap-2">
                      {pedir.map((e) => (
                        <li key={e.codigo} className="text-sm">
                          <p className="font-semibold">{e.titulo}</p>
                          <p className="text-texto-2">{e.oQuePedir}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-2">
                            <TipoDaEvidencia tipo={e.tipo} />
                            <RiscoDaEvidenciaMarcador risco={e.risco} />
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </aside>
              </li>
            );
          })}
        </ol>
      )}
    </article>
  );
}
