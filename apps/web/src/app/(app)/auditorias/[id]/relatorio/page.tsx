import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, CircleDashed, Printer } from "lucide-react";
import {
  NORMAS,
  PROCESSOS_AUDITADOS,
  RESULTADOS_DA_AUDITORIA,
  indiceDeConformidade,
  resultadoDaAuditoria,
  revisarRelatorio,
  type Auditoria,
  type DadosDoUsuario,
  type KitPreAuditoria,
  type RoteiroDaAuditoria,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { TipoDaConstatacao } from "@/components/marcadores";
import { RespostaMarcador } from "@/components/marcadores-auditoria";
import { chamarApi } from "@/lib/api";
import { formatarMomento } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  painel,
  tituloDaSecao,
} from "@/lib/estilos";
import { ConcluirAuditoria } from "../acoes";
import { CabecalhoDaAuditoria } from "../cabecalho";
import { PontosFortes } from "./encerramento";

export const metadata: Metadata = { title: "Relatório de auditoria" };

/** Etapa Entregar: revisão automática, as seções do relatório e o PDF nos modelos Clássico e Executivo. */
export default async function Relatorio({
  params,
  searchParams,
}: PageProps<"/auditorias/[id]/relatorio">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [a, r, k, eu] = await Promise.all([
    chamarApi<Auditoria>(`/auditorias/${id}`),
    chamarApi<RoteiroDaAuditoria>(`/auditorias/${id}/roteiro`),
    chamarApi<KitPreAuditoria>(`/auditorias/${id}/kit`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!a.ok && a.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!a.ok) return <AvisoDeErro erro={a.erro} />;
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const aud = a.dados;
  const rot = r.dados;
  const kit = k.ok ? k.dados : null;
  const podeEditar = eu.ok && eu.dados.permissoes.includes("auditorias.editar");
  const revisao = revisarRelatorio(aud, rot, kit);
  const pendentes = revisao.filter((v) => !v.ok);
  const indice = indiceDeConformidade(rot.contagem);
  const resultado = resultadoDaAuditoria(aud, rot.contagem);
  const entrevistas = rot.perguntas.filter((p) => p.resposta !== "pendente");
  const destino = (d: string) =>
    d === "resumo"
      ? `/auditorias/${id}`
      : d === "relatorio"
        ? `/auditorias/${id}/relatorio#encerramento`
        : `/auditorias/${id}/${d}`;

  return (
    <article className="max-w-6xl">
      <CabecalhoDaAuditoria auditoria={aud} etapa="entregar" />
      {aviso === "pontos" && (
        <p
          role="status"
          className="mt-4 rounded-sm border border-borda bg-superficie px-4 py-2.5 text-base"
        >
          Pontos fortes salvos.
        </p>
      )}

      <section
        className={`${painel} mt-6 grid gap-5 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center`}
      >
        <div>
          <p className="text-xs text-texto-2">Índice de conformidade</p>
          <p className="text-3xl font-semibold tabular-nums">
            {indice === null ? "—" : `${indice}%`}
          </p>
        </div>
        <div>
          <p className="text-xs text-texto-2">Resultado</p>
          <p className="text-lg font-semibold">
            {RESULTADOS_DA_AUDITORIA[resultado]}
          </p>
          <p className="text-sm text-texto-2">
            {aud.constatacoes.length} constatação(ões) · {entrevistas.length}{" "}
            entrevista(s) · checklist{" "}
            {kit ? `${kit.concluidos}/${kit.total}` : "—"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/auditorias/${id}/relatorio/imprimir?modelo=classico`}
            className={botaoPrimario}
          >
            <Printer aria-hidden size={16} strokeWidth={2} />
            PDF clássico
          </Link>
          <Link
            href={`/auditorias/${id}/relatorio/imprimir?modelo=executivo`}
            className={botaoSecundario}
          >
            PDF executivo
          </Link>
        </div>
      </section>

      <section className={`${painel} mt-6 p-5`} aria-labelledby="revisao">
        <h2 id="revisao" className={tituloDaSecao}>
          Revisão da auditoria
        </h2>
        <p className="mt-1 text-base text-texto-2">
          {revisao.length - pendentes.length} concluídas · {pendentes.length}{" "}
          para revisar. Orientativo: o relatório pode ser gerado a qualquer
          momento.
        </p>
        <ul className="mt-3 divide-y divide-borda border-y border-borda">
          {pendentes.map((v) => (
            <li
              key={v.titulo}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2"
            >
              <CircleDashed
                aria-hidden
                size={16}
                strokeWidth={2}
                className="shrink-0 text-atencao"
              />
              <span className="font-semibold">{v.titulo}</span>
              <span className="text-sm text-texto-2">{v.falta}</span>
              <Link
                href={destino(v.destino)}
                className="ml-auto text-sm text-info hover:underline"
              >
                Corrigir
              </Link>
            </li>
          ))}
        </ul>
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-info">
            Ver todas as {revisao.length} verificações
          </summary>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {revisao.map((v) => (
              <li key={v.titulo} className="inline-flex items-center gap-2">
                {v.ok ? (
                  <CircleCheck
                    aria-hidden
                    size={14}
                    className="text-conforme"
                  />
                ) : (
                  <CircleDashed
                    aria-hidden
                    size={14}
                    className="text-atencao"
                  />
                )}
                {v.titulo}
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section className={`${painel} mt-6`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5">
          <h2 className={tituloDaSecao}>
            Entrevistas conduzidas ({entrevistas.length})
          </h2>
          <Link
            href={`/auditorias/${id}/execucao`}
            className="text-sm text-info hover:underline"
          >
            Responder na etapa Auditar
          </Link>
        </div>
        {entrevistas.length === 0 ? (
          <p className="px-5 py-4 text-base text-texto-2">
            Nenhuma pergunta respondida ainda.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-borda border-t border-borda">
            {entrevistas.map((p) => (
              <li
                key={p.codigo}
                className="grid gap-2 px-5 py-2.5 sm:grid-cols-[9rem_minmax(0,1fr)]"
              >
                <RespostaMarcador resposta={p.resposta} />
                <div className="text-sm">
                  <p>
                    <span className="font-mono text-texto-2">
                      {NORMAS[p.norma]} {p.clausula}
                    </span>{" "}
                    · {PROCESSOS_AUDITADOS[p.processo]}
                  </p>
                  <p className="text-base">{p.pergunta}</p>
                  {p.evidencia && (
                    <p className="text-texto-2">Evidência: {p.evidencia}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${painel} mt-6`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5">
          <h2 className={tituloDaSecao}>
            Constatações ({aud.constatacoes.length})
          </h2>
          <Link
            href={`/auditorias/${id}/achados`}
            className="text-sm text-info hover:underline"
          >
            Registrar ou editar na etapa Registrar
          </Link>
        </div>
        {aud.constatacoes.length === 0 ? (
          <p className="px-5 py-4 text-base text-texto-2">
            Nenhuma constatação registrada.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-borda border-t border-borda">
            {aud.constatacoes.map((c) => (
              <li
                key={c.id}
                className="grid gap-2 px-5 py-2.5 sm:grid-cols-[9rem_minmax(0,1fr)]"
              >
                <TipoDaConstatacao tipo={c.tipo} />
                <p className="text-base">
                  <span className="font-mono text-sm text-texto-2">
                    {NORMAS[c.norma]}
                    {c.clausula && ` ${c.clausula}`}
                  </span>{" "}
                  {c.descricao}
                  {c.ncNumero && (
                    <span className="font-mono text-sm text-info">
                      {" "}
                      · {c.ncNumero}
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="encerramento" className={`${painel} mt-6 p-5`}>
        <h2 className={tituloDaSecao}>Encerramento</h2>
        {podeEditar &&
        aud.status !== "concluida" &&
        aud.status !== "cancelada" ? (
          <PontosFortes auditoria={aud} />
        ) : (
          aud.plano.pontosFortes && (
            <p className="mt-3 text-base whitespace-pre-line">
              {aud.plano.pontosFortes}
            </p>
          )
        )}
        {aud.status === "concluida" && aud.conclusao && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-texto-2">
              Conclusão{" "}
              {aud.concluidaEm && `· ${formatarMomento(aud.concluidaEm)}`}
            </h3>
            <p className="mt-1 max-w-[72ch] text-base whitespace-pre-line">
              {aud.conclusao}
            </p>
          </div>
        )}
      </section>
      {podeEditar && aud.status === "em_andamento" && (
        <ConcluirAuditoria auditoria={aud} />
      )}
    </article>
  );
}
