import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  NORMAS,
  type Auditoria,
  type Constatacao,
  type NaoConformidade,
  type Pagina,
  type PlanoResumo,
  type RoteiroDaAuditoria,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import {
  StatusDaNc,
  StatusDoPlano,
  TipoDaConstatacao,
} from "@/components/marcadores";
import { RespostaMarcador } from "@/components/marcadores-auditoria";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { botaoSecundario, painel } from "@/lib/estilos";
import { CabecalhoDaAuditoria } from "../cabecalho";

export const metadata: Metadata = { title: "Tratar NCs" };

type Tratamento = {
  c: Constatacao;
  nc: NaoConformidade | null;
  planos: PlanoResumo[];
};

/** Etapa Tratar: a cadeia de cada NC da auditoria, da pergunta à eficácia, com os planos de ação na Qualidade. */
export default async function Tratar({
  params,
}: PageProps<"/auditorias/[id]/tratar">) {
  const { id } = await params;
  const [a, r] = await Promise.all([
    chamarApi<Auditoria>(`/auditorias/${id}`),
    chamarApi<RoteiroDaAuditoria>(`/auditorias/${id}/roteiro`),
  ]);
  if (!a.ok && a.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!a.ok) return <AvisoDeErro erro={a.erro} />;
  const aud = a.dados;
  const perguntas = new Map(
    (r.ok ? r.dados.perguntas : []).map((p) => [p.codigo, p]),
  );
  const deNc = aud.constatacoes.filter(
    (c) => c.tipo === "nc_maior" || c.tipo === "nc_menor",
  );
  const tratamentos: Tratamento[] = await Promise.all(
    deNc.map(async (c) => {
      if (!c.ncId) return { c, nc: null, planos: [] };
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
  const encerradas = tratamentos.filter(
    (t) => t.nc?.status === "encerrada",
  ).length;

  return (
    <article className="max-w-6xl">
      <CabecalhoDaAuditoria auditoria={aud} etapa="tratar" />
      <section
        className={`${painel} mt-6 flex flex-wrap gap-x-8 gap-y-2 px-5 py-3 text-base`}
        aria-label="Resumo do tratamento"
      >
        <span>
          <span className="font-semibold tabular-nums">{deNc.length}</span> NC
          na auditoria
        </span>
        <span>
          <span className="font-semibold tabular-nums">{aud.ncsPendentes}</span>{" "}
          a formalizar
        </span>
        <span>
          <span className="font-semibold tabular-nums">{encerradas}</span>{" "}
          encerradas
        </span>
        {aud.ncsPendentes > 0 && (
          <Link
            href={`/auditorias/${id}/achados#constatacoes`}
            className="ml-auto text-info hover:underline"
          >
            Formalizar na etapa Registrar
          </Link>
        )}
      </section>

      {tratamentos.length === 0 ? (
        <p className={`${painel} mt-6 px-5 py-8 text-base text-texto-2`}>
          Nenhuma NC registrada nesta auditoria.
        </p>
      ) : (
        <ol className="mt-6 flex flex-col gap-4">
          {tratamentos.map(({ c, nc, planos }) => {
            const p = c.perguntaCodigo
              ? perguntas.get(c.perguntaCodigo)
              : undefined;
            return (
              <li key={c.id} className={`${painel} p-5`}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <TipoDaConstatacao tipo={c.tipo} />
                  <span className="font-mono text-sm text-texto-2">
                    {NORMAS[c.norma]}
                    {c.clausula && ` ${c.clausula}`}
                  </span>
                  {c.area && (
                    <span className="text-sm text-texto-3">{c.area}</span>
                  )}
                </div>
                <p className="mt-2 text-base whitespace-pre-line">
                  {c.descricao}
                </p>
                <h3 className="mt-4 text-xs font-semibold tracking-[0.06em] text-texto-2 uppercase">
                  Rastreabilidade
                </h3>
                <ol className="mt-2 grid gap-px overflow-hidden rounded-sm border border-borda bg-borda text-sm sm:grid-cols-2 lg:grid-cols-5">
                  <Elo titulo="Pergunta">
                    {p ? (
                      <>
                        <p>{p.pergunta}</p>
                        <p className="mt-1">
                          <RespostaMarcador resposta={p.resposta} />
                        </p>
                      </>
                    ) : (
                      <p className="text-texto-2">Constatação avulsa</p>
                    )}
                  </Elo>
                  <Elo titulo="Evidência">
                    {c.evidencia ?? p?.evidencia ?? (
                      <span className="text-texto-2">Não registrada</span>
                    )}
                  </Elo>
                  <Elo titulo="NC na Qualidade">
                    {nc ? (
                      <>
                        <Link
                          href={`/qualidade/nao-conformidades/${nc.id}`}
                          className="font-mono font-medium text-info hover:underline"
                        >
                          {nc.numero}
                        </Link>
                        <p className="mt-1">
                          <StatusDaNc status={nc.status} vencida={nc.vencida} />
                        </p>
                        <p className="mt-1 text-texto-2">
                          {nc.responsavel} · prazo {formatarData(nc.prazo)}
                        </p>
                      </>
                    ) : (
                      <span className="text-atencao">
                        Ainda não formalizada
                      </span>
                    )}
                  </Elo>
                  <Elo titulo="Plano de ação">
                    {planos.length > 0 ? (
                      <ul className="flex flex-col gap-2">
                        {planos.map((pl) => (
                          <li key={pl.id}>
                            <Link
                              href={`/qualidade/planos-de-acao/${pl.id}`}
                              className="font-mono font-medium text-info hover:underline"
                            >
                              {pl.numero}
                            </Link>
                            <p className="mt-0.5">
                              <StatusDoPlano
                                status={pl.status}
                                atrasado={pl.atrasado}
                              />
                            </p>
                            <p className="text-texto-2 tabular-nums">
                              {pl.progresso}% concluído
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : nc ? (
                      <Link
                        href={`/qualidade/planos-de-acao/novo?nc=${nc.id}`}
                        className={`${botaoSecundario} h-8 text-sm`}
                      >
                        Criar plano de ação
                      </Link>
                    ) : (
                      <span className="text-texto-2">Depois da NC</span>
                    )}
                  </Elo>
                  <Elo titulo="Eficácia">
                    {nc?.eficaz === true ? (
                      <span className="text-conforme">
                        Eficaz
                        {nc.verificadoEm
                          ? ` em ${formatarData(nc.verificadoEm.slice(0, 10))}`
                          : ""}
                      </span>
                    ) : nc?.eficaz === false ? (
                      <span className="text-nao-conforme">
                        Ineficaz: ação refeita
                      </span>
                    ) : (
                      <span className="text-texto-2">A verificar</span>
                    )}
                    {c.evidenciaFechamento && (
                      <p className="mt-1 text-texto-2">
                        Esperado: {c.evidenciaFechamento}
                      </p>
                    )}
                  </Elo>
                </ol>
              </li>
            );
          })}
        </ol>
      )}
    </article>
  );
}

function Elo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <li className="bg-superficie p-3">
      <p className="text-xs font-semibold text-texto-2">{titulo}</p>
      <div className="mt-1">{children}</div>
    </li>
  );
}
