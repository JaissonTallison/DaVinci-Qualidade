import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  METODOLOGIA_PADRAO,
  MOMENTOS_DO_KIT,
  NORMAS,
  PROCESSOS_AUDITADOS,
  RESPOSTAS_DA_PERGUNTA,
  RESULTADOS_DA_AUDITORIA,
  STATUS_DO_ITEM_DO_KIT,
  STATUS_NC,
  STATUS_PLANO,
  TIPOS_AUDITORIA,
  TIPOS_CONSTATACAO,
  criteriosSugeridos,
  indiceDeConformidade,
  resultadoDaAuditoria,
  type Auditoria,
  type KitPreAuditoria,
  type NaoConformidade,
  type Pagina,
  type PlanoResumo,
  type RoteiroDaAuditoria,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { BotaoImprimir } from "@/components/botao-imprimir";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { BarrasDeConformidade, agrupar } from "../barras";

export const metadata: Metadata = { title: "Relatório de auditoria" };

/**
 * Relatório para imprimir ou salvar em PDF. Clássico: o relatório completo, com entrevistas e o checklist em anexo.
 * Executivo: indicadores, gráficos por norma e processo, NCs com os planos em tabela.
 */
export default async function RelatorioImpresso({
  params,
  searchParams,
}: PageProps<"/auditorias/[id]/relatorio/imprimir">) {
  const { id } = await params;
  const { modelo } = (await searchParams) as { modelo?: string };
  const executivo = modelo === "executivo";
  const [a, r, k] = await Promise.all([
    chamarApi<Auditoria>(`/auditorias/${id}`),
    chamarApi<RoteiroDaAuditoria>(`/auditorias/${id}/roteiro`),
    chamarApi<KitPreAuditoria>(`/auditorias/${id}/kit`),
  ]);
  if (!a.ok && a.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!a.ok) return <AvisoDeErro erro={a.erro} />;
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const aud = a.dados;
  const p = aud.plano;
  const rot = r.dados;
  const kit = k.ok ? k.dados : null;
  const indice = indiceDeConformidade(rot.contagem);
  const resultado = resultadoDaAuditoria(aud, rot.contagem);
  const entrevistas = rot.perguntas.filter((q) => q.resposta !== "pendente");
  const ncs = aud.constatacoes.filter((c) => c.ncId);
  const tratamento = await Promise.all(
    ncs.map(async (c) => {
      const [nc, pl] = await Promise.all([
        chamarApi<NaoConformidade>(`/nao-conformidades/${c.ncId}`),
        chamarApi<Pagina<PlanoResumo>>(
          `/planos-de-acao?ncId=${c.ncId}&porPagina=25`,
        ),
      ]);
      return {
        c,
        nc: nc.ok ? nc.dados : null,
        planos: pl.ok ? pl.dados.itens : [],
      };
    }),
  );
  const periodo =
    aud.dataInicio === aud.dataFim
      ? formatarData(aud.dataInicio)
      : `${formatarData(aud.dataInicio)} a ${formatarData(aud.dataFim)}`;

  return (
    <article className="mx-auto max-w-4xl bg-superficie print:max-w-none">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/auditorias/${id}/relatorio`}
          className="dv-voltar"
        >
          Voltar ao relatório
        </Link>
        <nav aria-label="Modelo" className="flex gap-1.5 text-sm">
          {(["classico", "executivo"] as const).map((m) => (
            <Link
              key={m}
              href={`?modelo=${m}`}
              aria-current={
                (m === "executivo") === executivo ? "page" : undefined
              }
              className={`rounded-sm px-2 py-1 ${(m === "executivo") === executivo ? "bg-superficie-2 font-semibold" : "text-texto-2"}`}
            >
              {m === "classico" ? "Clássico" : "Executivo"}
            </Link>
          ))}
        </nav>
        <BotaoImprimir />
      </div>

      <header className="border-b-2 border-texto pb-3">
        <p className="text-sm text-texto-2">
          Relatório de auditoria{executivo ? " · resumo executivo" : ""} ·{" "}
          {aud.numero}
        </p>
        <h1 className="font-bold text-2xl">
          {p.empresaAuditada ?? "Organização auditada"}
        </h1>
        <p className="mt-1 text-sm">
          Auditoria {TIPOS_AUDITORIA[aud.tipo].toLowerCase()} ·{" "}
          {aud.normas.map((n) => NORMAS[n]).join(", ")}
          {p.unidade && ` · ${p.unidade}`} · {periodo}
        </p>
      </header>

      <section className="mt-4 grid grid-cols-3 gap-4 border-b border-borda pb-4 text-sm">
        <div>
          <p className="text-xs text-texto-2">Índice de conformidade</p>
          <p className="text-2xl font-semibold tabular-nums">
            {indice === null ? "—" : `${indice}%`}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-texto-2">Resultado</p>
          <p className="text-lg font-semibold">
            {RESULTADOS_DA_AUDITORIA[resultado]}
          </p>
          <p className="text-texto-2">
            {(["conforme", "parcial", "nao_conforme"] as const)
              .map(
                (x) =>
                  `${rot.contagem[x]} ${RESPOSTAS_DA_PERGUNTA[x].toLowerCase()}`,
              )
              .join(" · ")}{" "}
            · {aud.contagem.nc_maior + aud.contagem.nc_menor} NC
          </p>
        </div>
      </section>

      {aud.conclusao && <Secao titulo="Conclusão">{aud.conclusao}</Secao>}

      {!executivo && (
        <>
          <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
            <Dado rotulo="Auditor líder">{aud.auditorLider}</Dado>
            <Dado rotulo="Auditores">{aud.equipe ?? "—"}</Dado>
            <Dado rotulo="Representante do auditado">
              {aud.representante ?? "—"}
            </Dado>
          </dl>
          <Secao titulo="Escopo">{aud.escopo}</Secao>
          {p.objetivo && <Secao titulo="Objetivo">{p.objetivo}</Secao>}
          <Secao titulo="Critérios">
            {p.criterios ?? criteriosSugeridos(aud.normas)}
          </Secao>
          <Secao titulo="Metodologia">
            {p.metodologia || METODOLOGIA_PADRAO}
          </Secao>
          {p.processos.length > 0 && (
            <Secao titulo="Processos auditados">
              {p.processos.map((x) => PROCESSOS_AUDITADOS[x]).join(" · ")}
            </Secao>
          )}
        </>
      )}

      {executivo && entrevistas.length > 0 && (
        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <BarrasDeConformidade
            titulo="Por norma"
            linhas={agrupar(
              entrevistas,
              (q) => q.norma,
              (x) => NORMAS[x as keyof typeof NORMAS],
            )}
          />
          <BarrasDeConformidade
            titulo="Por processo"
            linhas={agrupar(
              entrevistas,
              (q) => q.processo,
              (x) => PROCESSOS_AUDITADOS[x as keyof typeof PROCESSOS_AUDITADOS],
            )}
          />
        </section>
      )}

      {p.pontosFortes && <Secao titulo="Pontos fortes">{p.pontosFortes}</Secao>}

      <section className="mt-6">
        <h2 className="border-b border-borda-forte pb-1 text-lg font-semibold">
          Constatações
        </h2>
        {aud.constatacoes.length === 0 ? (
          <p className="mt-2 text-sm">Nenhuma constatação registrada.</p>
        ) : executivo ? (
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-borda text-left">
                <th className="py-1 pr-3">Tipo</th>
                <th className="py-1 pr-3">Requisito</th>
                <th className="py-1 pr-3">Constatação</th>
                <th className="py-1 pr-3">NC</th>
                <th className="py-1">Plano de ação</th>
              </tr>
            </thead>
            <tbody>
              {aud.constatacoes.map((c) => {
                const t = tratamento.find((x) => x.c.id === c.id);
                return (
                  <tr
                    key={c.id}
                    className="break-inside-avoid border-b border-borda align-top"
                  >
                    <td className="py-1.5 pr-3 whitespace-nowrap">
                      {TIPOS_CONSTATACAO[c.tipo]}
                    </td>
                    <td className="py-1.5 pr-3 font-mono whitespace-nowrap">
                      {NORMAS[c.norma]}
                      {c.clausula && ` ${c.clausula}`}
                    </td>
                    <td className="py-1.5 pr-3">{c.descricao}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap">
                      {t?.nc
                        ? `${t.nc.numero} · ${STATUS_NC[t.nc.status]}`
                        : "—"}
                    </td>
                    <td className="py-1.5">
                      {t?.planos.length
                        ? t.planos
                            .map(
                              (pl) =>
                                `${pl.numero} · ${STATUS_PLANO[pl.status]} · ${pl.progresso}% · ${formatarData(pl.prazo)}`,
                            )
                            .join("; ")
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <ol className="mt-2">
            {aud.constatacoes.map((c, i) => (
              <li
                key={c.id}
                className="break-inside-avoid border-b border-borda py-3 text-sm"
              >
                <p className="font-semibold">
                  {i + 1}. {TIPOS_CONSTATACAO[c.tipo]} · {NORMAS[c.norma]}
                  {c.clausula && ` ${c.clausula}`}
                  {c.area && ` · ${c.area}`}
                  {c.ncNumero && ` · ${c.ncNumero}`}
                </p>
                <p className="mt-1 whitespace-pre-line">{c.descricao}</p>
                {c.evidencia && (
                  <p className="mt-1">Evidência: {c.evidencia}</p>
                )}
                {c.causaRaiz && (
                  <p className="mt-1">Causa raiz provável: {c.causaRaiz}</p>
                )}
                {c.acaoCorretiva && (
                  <p className="mt-1">Ação corretiva: {c.acaoCorretiva}</p>
                )}
                {c.evidenciaFechamento && (
                  <p className="mt-1">
                    Evidência de fechamento: {c.evidenciaFechamento}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {!executivo && entrevistas.length > 0 && (
        <section className="mt-6">
          <h2 className="border-b border-borda-forte pb-1 text-lg font-semibold">
            Entrevistas conduzidas
          </h2>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-borda text-left">
                <th className="py-1 pr-3">Processo</th>
                <th className="py-1 pr-3">Pergunta</th>
                <th className="py-1 pr-3">Resposta</th>
                <th className="py-1">Evidência</th>
              </tr>
            </thead>
            <tbody>
              {entrevistas.map((q) => (
                <tr
                  key={q.codigo}
                  className="break-inside-avoid border-b border-borda align-top"
                >
                  <td className="py-1.5 pr-3">
                    {PROCESSOS_AUDITADOS[q.processo]}
                  </td>
                  <td className="py-1.5 pr-3">
                    {q.pergunta}{" "}
                    <span className="font-mono text-xs text-texto-2">
                      ({NORMAS[q.norma]} {q.clausula})
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 whitespace-nowrap">
                    {RESPOSTAS_DA_PERGUNTA[q.resposta]}
                  </td>
                  <td className="py-1.5">{q.evidencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {!executivo && kit && kit.total > 0 && (
        <section className="mt-6 break-before-page">
          <h2 className="border-b border-borda-forte pb-1 text-lg font-semibold">
            Anexo: checklist pré-auditoria ({kit.concluidos}/{kit.total})
          </h2>
          {(
            Object.keys(MOMENTOS_DO_KIT) as (keyof typeof MOMENTOS_DO_KIT)[]
          ).map((m) => {
            const itens = kit.itens.filter((i) => i.momento === m);
            return itens.length ? (
              <div key={m} className="mt-3 break-inside-avoid">
                <h3 className="text-sm font-semibold">
                  {MOMENTOS_DO_KIT[m].rotulo}
                </h3>
                <ul className="text-sm">
                  {itens.map((i) => (
                    <li
                      key={i.codigo}
                      className="flex justify-between gap-4 border-b border-borda py-1"
                    >
                      <span>{i.descricao}</span>
                      <span className="shrink-0 text-texto-2">
                        {STATUS_DO_ITEM_DO_KIT[i.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null;
          })}
        </section>
      )}

      <section className="mt-12 grid grid-cols-2 gap-10 text-sm break-inside-avoid">
        {[
          `Auditor líder: ${aud.auditorLider}`,
          `Representante do auditado${aud.representante ? `: ${aud.representante}` : ""}`,
        ].map((t) => (
          <div key={t} className="border-t border-texto pt-1 text-center">
            {t}
          </div>
        ))}
      </section>
      {p.emissor && (
        <p className="mt-6 text-xs text-texto-2">Emitido por {p.emissor}.</p>
      )}
    </article>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h2 className="border-b border-borda-forte pb-1 text-lg font-semibold">
        {titulo}
      </h2>
      <p className="mt-2 text-sm whitespace-pre-line">{children}</p>
    </section>
  );
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd>{children}</dd>
    </div>
  );
}
