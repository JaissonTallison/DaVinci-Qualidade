import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  CATEGORIAS_6M,
  METODOS_ANALISE,
  ORIGENS_NC,
  TIPOS_NC,
  type DadosDoUsuario,
  type ItemDeLista,
  type NaoConformidade,
  type NaoConformidadeResumo,
  type Pagina,
  type PlanoResumo,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import {
  GravidadeDaNc,
  Progresso,
  StatusDaNc,
  StatusDoPlano,
} from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento, prazoRelativo } from "@/lib/datas";
import {
  botaoSecundario,
  painel,
  tituloDaPagina,
  tituloDaSecao,
} from "@/lib/estilos";
import { AcoesDaNc } from "./acoes";
import { Anexos } from "@/components/anexos";
import { linkDaOrigem } from "@/lib/origem-nc";
import { LinhaDoTempoNc } from "./linha-do-tempo";

export const metadata: Metadata = { title: "Não conformidade" };

const AVISOS: Record<string, string> = {
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
  aberta: "NC aberta. Quando a causa estiver analisada, registre o tratamento.",
  tratamento: "Tratamento registrado.",
  verificacao: "Enviada para verificação de eficácia.",
  encerrada: "Ação eficaz. NC encerrada.",
  ineficaz:
    "Ação ineficaz. A NC voltou para tratamento: revise a causa e a ação.",
  cancelada: "NC cancelada.",
};

export default async function DetalheDaNc({
  params,
  searchParams,
}: PageProps<"/qualidade/nao-conformidades/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu, planos, causas] = await Promise.all([
    chamarApi<NaoConformidade>(`/nao-conformidades/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
    chamarApi<Pagina<PlanoResumo>>(
      `/planos-de-acao?ncId=${encodeURIComponent(id)}&porPagina=100`,
    ),
    chamarApi<ItemDeLista[]>("/listas/causa_nc"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const nc = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const terminada = nc.status === "encerrada" || nc.status === "cancelada";
  // Outras NCs abertas do mesmo registro de origem (recorrência do mesmo problema)
  const relacionadas =
    nc.origemRef && linkDaOrigem(nc.origem, nc.origemRef)
      ? await chamarApi<Pagina<NaoConformidadeResumo>>(
          `/nao-conformidades?origemRef=${encodeURIComponent(nc.origemRef)}&porPagina=50`,
        )
      : null;
  const outras =
    relacionadas?.ok
      ? relacionadas.dados.itens.filter((n) => n.id !== nc.id)
      : [];

  return (
    <article>
      <Link
        href="/qualidade/nao-conformidades"
        className="dv-voltar"
      >
        Não conformidades
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-lg text-texto-2">{nc.numero}</span>
        <StatusDaNc status={nc.status} vencida={nc.vencida} prazo={nc.prazo} />
        {nc.ciclos >= 2 && (
          <span className="text-sm text-atencao">
            Reincidente: {nc.ciclos}º ciclo de tratamento
          </span>
        )}
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>{nc.titulo}</h1>

      <section className={`${painel} mt-6 p-5`}>
        <h2 className={tituloDaSecao}>Linha do tempo</h2>
        <LinhaDoTempoNc nc={nc} />
      </section>

      {aviso && AVISOS[aviso] && (
        <p
          role="status"
          className="mt-4 rounded-sm border border-borda bg-superficie px-4 py-2.5 text-base text-texto"
        >
          {AVISOS[aviso]}
        </p>
      )}

      <Secao titulo="O que aconteceu">
        <p className="max-w-[72ch] text-md whitespace-pre-line">
          {nc.descricao}
        </p>
        <Dados
          itens={[
[
              "Origem",
              (() => {
                const href = linkDaOrigem(nc.origem, nc.origemRef);
                return href ? (
                  <span>
                    {ORIGENS_NC[nc.origem]} ·{" "}
                    <Link
                      href={href}
                      className="font-medium text-acao hover:underline"
                    >
                      {nc.origemRef}
                    </Link>
                  </span>
                ) : (
                  `${ORIGENS_NC[nc.origem]}${nc.origemRef ? ` · ${nc.origemRef}` : ""}`
                );
              })(),
            ],
            ["Tipo", TIPOS_NC[nc.tipo]],
            ["Gravidade", <GravidadeDaNc key="g" gravidade={nc.gravidade} />],
            ["Setor", nc.setor],
            ["Processo ou área", nc.processo],
            ["Produto ou serviço", nc.produto],
            ["Lote", nc.lote],
            ["Responsável", nc.responsavel],
            ["Aberta em", formatarData(nc.dataAbertura)],
            [
              "Prazo",
              `${formatarData(nc.prazo)}${terminada ? "" : ` · ${prazoRelativo(nc.prazo)}`}`,
            ],
            [
              "Custo estimado",
              nc.custoEstimado
                ? Number(nc.custoEstimado).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })
                : null,
            ],
          ]}
        />
        {nc.contencao && (
          <Texto rotulo="Contenção imediata" texto={nc.contencao} />
        )}
      </Secao>

      {nc.causaRaiz && (
        <Secao titulo="Análise e tratamento">
          <Dados
            itens={[
              [
                "Método",
                nc.metodoAnalise ? METODOS_ANALISE[nc.metodoAnalise] : null,
              ],
              [
                "Categoria 6M",
                nc.categoria6m ? CATEGORIAS_6M[nc.categoria6m] : null,
              ],
              ["Tipo de causa", nc.causaTipo],
              [
                "Implantada em",
                nc.dataImplantacao ? formatarData(nc.dataImplantacao) : null,
              ],
            ]}
          />
          {nc.porques.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-texto-2">Porquês</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-base">
                {nc.porques.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ol>
            </div>
          )}
          <Texto rotulo="Causa raiz" texto={nc.causaRaiz} />
          {nc.acaoCorretiva && (
            <Texto rotulo="Ação corretiva" texto={nc.acaoCorretiva} />
          )}
        </Secao>
      )}

      {nc.eficaz !== null && (
        <Secao titulo="Verificação de eficácia">
          <Dados
            itens={[
              [
                "Resultado da última verificação",
                nc.eficaz ? "Eficaz" : "Ineficaz",
              ],
              [
                "Verificada em",
                nc.verificadoEm ? formatarMomento(nc.verificadoEm) : null,
              ],
            ]}
          />
          {nc.parecerEficacia && (
            <Texto rotulo="Parecer" texto={nc.parecerEficacia} />
          )}
        </Secao>
      )}

      <section className={`${painel} mt-6 p-5`}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className={tituloDaSecao}>Planos de ação</h2>
          {!terminada && permissoes.includes("qualidade.editar") && (
            <Link
              href={`/qualidade/planos-de-acao/novo?nc=${nc.id}`}
              className={botaoSecundario}
            >
              Criar plano de ação
            </Link>
          )}
        </div>
        {planos.ok && planos.dados.itens.length > 0 ? (
          <ul className="mt-3 divide-y divide-borda">
            {planos.dados.itens.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-x-6 gap-y-1 py-2.5"
              >
                <Link
                  href={`/qualidade/planos-de-acao/${p.id}`}
                  className="font-mono text-sm font-medium text-info hover:underline"
                >
                  {p.numero}
                </Link>
                <span className="min-w-48 flex-1">{p.titulo}</span>
                <Progresso valor={p.progresso} />
                <StatusDoPlano
                  status={p.status}
                  atrasado={p.atrasado}
                  prazo={p.prazo}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-base text-texto-2">
            Nenhum plano ligado. Quando a ação corretiva tiver mais de um passo,
            organize as tarefas num plano.
          </p>
        )}
      </section>

      {outras.length > 0 && (
        <section className={`${painel} mt-6 p-5`}>
          <h2 className={tituloDaSecao}>
            Outras NCs do mesmo registro de origem
          </h2>
          <p className="mt-1 text-sm text-texto-2">
            Abertas a partir de {nc.origemRef}. Pode indicar recorrência do
            mesmo problema.
          </p>
          <ul className="mt-3 divide-y divide-borda">
            {outras.map((n) => (
              <li
                key={n.id}
                className="flex flex-wrap items-center gap-x-6 gap-y-1 py-2.5"
              >
                <Link
                  href={`/qualidade/nao-conformidades/${n.id}`}
                  className="font-mono text-sm font-medium text-acao hover:underline"
                >
                  {n.numero}
                </Link>
                <span className="min-w-48 flex-1">{n.titulo}</span>
                <GravidadeDaNc gravidade={n.gravidade} />
                <StatusDaNc status={n.status} vencida={n.vencida} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {nc.status === "cancelada" && (
        <Secao titulo="Cancelamento">
          <Dados
            itens={[
              [
                "Cancelada em",
                nc.canceladaEm ? formatarMomento(nc.canceladaEm) : null,
              ],
            ]}
          />
          {nc.motivoCancelamento && (
            <Texto rotulo="Motivo" texto={nc.motivoCancelamento} />
          )}
        </Secao>
      )}

      {!terminada && permissoes.includes("qualidade.editar") && (
        <AcoesDaNc
          nc={nc}
          podeCancelar={permissoes.includes("qualidade.excluir")}
          causas={causas.ok ? causas.dados.map((c) => c.nome) : []}
        />
      )}
      <Anexos
        registro="nao_conformidade"
        registroId={nc.id}
        voltar={`/qualidade/nao-conformidades/${nc.id}`}
        podeEditar={permissoes.includes("qualidade.editar")}
      />
    </article>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className={`${painel} mt-6 p-5`}>
      <h2 className={tituloDaSecao}>{titulo}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Pares rótulo/valor; os vazios não aparecem. */
function Dados({ itens }: { itens: [string, ReactNode][] }) {
  const preenchidos = itens.filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );
  if (!preenchidos.length) return null;
  return (
    <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {preenchidos.map(([rotulo, valor]) => (
        <div key={rotulo}>
          <dt className="text-xs text-texto-2">{rotulo}</dt>
          <dd className="mt-0.5 text-base">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

function Texto({ rotulo, texto }: { rotulo: string; texto: string }) {
  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-texto-2">{rotulo}</p>
      <p className="mt-1 max-w-[72ch] text-base whitespace-pre-line">{texto}</p>
    </div>
  );
}
