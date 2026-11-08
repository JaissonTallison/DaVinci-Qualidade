import { Check, ChevronDown, Plus } from "@/components/icones";
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
import { painel } from "@/lib/estilos";
import { AcaoDaEtapa, CancelarNc } from "./acoes";
import { Anexos } from "@/components/anexos";
import { linkDaOrigem } from "@/lib/origem-nc";

import { CabecalhoDaPagina } from "@/components/cabecalho-da-pagina";
import { CaixaDeAlerta } from "@/components/caixa-de-alerta";
import { Botao } from "@/components/botao";
import { Selo } from "@/components/selo";
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

type EstadoDaEtapa = "concluida" | "atual" | "a_seguir";

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
  const cancelada = nc.status === "cancelada";
  const encerrada = nc.status === "encerrada";
  const podeEditar = permissoes.includes("qualidade.editar");
  const listaDePlanos =
    planos.ok && planos.dados.itens.length > 0 ? planos.dados.itens : [];

  // Etapa atual da jornada pelo status real. A ocorrência (0) está sempre feita.
  const indiceAtual =
    { aberta: 1, em_tratamento: 1, em_verificacao: 2, encerrada: 3 }[
      nc.status as "aberta" | "em_tratamento" | "em_verificacao" | "encerrada"
    ] ?? 1;
  const estadoDa = (i: number): EstadoDaEtapa =>
    encerrada || i < indiceAtual
      ? "concluida"
      : i === indiceAtual
        ? "atual"
        : "a_seguir";

  // Outras NCs abertas do mesmo registro de origem (recorrência do mesmo problema)
  const relacionadas =
    nc.origemRef && linkDaOrigem(nc.origem, nc.origemRef)
      ? await chamarApi<Pagina<NaoConformidadeResumo>>(
          `/nao-conformidades?origemRef=${encodeURIComponent(nc.origemRef)}&porPagina=50`,
        )
      : null;
  const outras = relacionadas?.ok
    ? relacionadas.dados.itens.filter((n) => n.id !== nc.id)
    : [];

  const ocorrencia = (
    <>
      <p className="max-w-[72ch] text-md whitespace-pre-line">{nc.descricao}</p>
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
          ["Setor", nc.setor],
          ["Processo ou área", nc.processo],
          ["Produto ou serviço", nc.produto],
          ["Lote", nc.lote],
          ["Aberta em", formatarData(nc.dataAbertura)],
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
    </>
  );

  const analise = nc.causaRaiz ? (
    <>
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
    </>
  ) : null;

  const planosDaNc = (
    <div className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-texto-2">Planos de ação</p>
        {!terminada && podeEditar && (
          <Botao
            href={`/qualidade/planos-de-acao/novo?nc=${nc.id}`}
            icone={Plus}
          >
            Criar plano de ação
          </Botao>
        )}
      </div>
      {listaDePlanos.length > 0 ? (
        <ul className="mt-2 divide-y divide-borda">
          {listaDePlanos.map((p) => (
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
    </div>
  );

  const verificacao =
    nc.eficaz !== null ? (
      <>
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
      </>
    ) : null;

  return (
    <article>
      <CabecalhoDaPagina
        voltar={{
          href: "/qualidade/nao-conformidades",
          rotulo: "Não conformidades",
        }}
        identificacao={
          <>
            <span className="font-mono text-base text-texto-2">
              {nc.numero}
            </span>
            <StatusDaNc
              status={nc.status}
              vencida={nc.vencida}
              prazo={nc.prazo}
            />
            {nc.ciclos >= 2 && (
              <Selo tom="atencao">Reincidente: {nc.ciclos}º ciclo</Selo>
            )}
          </>
        }
        titulo={nc.titulo}
        regua={[
          {
            rotulo: "Gravidade",
            valor: <GravidadeDaNc gravidade={nc.gravidade} />,
          },
          { rotulo: "Origem", valor: ORIGENS_NC[nc.origem] },
          { rotulo: "Responsável", valor: nc.responsavel },
          {
            rotulo: "Prazo",
            valor: formatarData(nc.prazo),
            tom: nc.vencida ? "perigo" : undefined,
            detalhe:
              !terminada && !nc.vencida ? prazoRelativo(nc.prazo) : undefined,
          },
          { rotulo: "Aberta em", valor: formatarData(nc.dataAbertura) },
        ]}
      />

      {aviso && AVISOS[aviso] && (
        <CaixaDeAlerta tom="sucesso" className="mt-4">
          {AVISOS[aviso]}
        </CaixaDeAlerta>
      )}

      {cancelada && (
        <CaixaDeAlerta tom="perigo" titulo="NC cancelada" className="mt-6">
          <p className="text-base text-texto-2">
            {nc.canceladaEm ? formatarMomento(nc.canceladaEm) : ""}
            {nc.canceladaPorNome ? ` · por ${nc.canceladaPorNome}` : ""}
          </p>
          {nc.motivoCancelamento && (
            <p className="mt-2 max-w-[72ch] text-base whitespace-pre-line">
              {nc.motivoCancelamento}
            </p>
          )}
        </CaixaDeAlerta>
      )}

      <nav className="mt-6" aria-label="Etapas da não conformidade">
        <Etapa
          n={1}
          titulo="Registrar ocorrência"
          estado={cancelada ? "concluida" : estadoDa(0)}
          resumo={`Aberta em ${formatarData(nc.dataAbertura)}`}
        >
          {ocorrencia}
        </Etapa>

        <Etapa
          n={2}
          titulo="Analisar e tratar"
          estado={
            cancelada ? (analise ? "concluida" : "a_seguir") : estadoDa(1)
          }
          resumo={
            nc.dataImplantacao
              ? `Ação implantada em ${formatarData(nc.dataImplantacao)}`
              : nc.causaRaiz
                ? "Causa e ação definidas"
                : undefined
          }
          orientacao={
            nc.status === "aberta"
              ? "Analise a causa raiz e defina a ação corretiva para começar o tratamento."
              : nc.status === "em_tratamento"
                ? "Implante a ação corretiva e informe a data para enviar à verificação."
                : "Depois de registrar a ocorrência, a causa é analisada e a ação corretiva definida."
          }
        >
          {!terminada && podeEditar && estadoDa(1) === "atual" && (
            <AcaoDaEtapa
              nc={nc}
              causas={causas.ok ? causas.dados.map((c) => c.nome) : []}
            />
          )}
          {analise}
          {planosDaNc}
        </Etapa>

        <Etapa
          n={3}
          titulo="Verificar eficácia"
          estado={cancelada ? "a_seguir" : estadoDa(2)}
          resumo={
            nc.eficaz !== null && nc.verificadoEm
              ? `${nc.eficaz ? "Eficaz" : "Ineficaz"} · ${formatarMomento(nc.verificadoEm)}`
              : undefined
          }
          orientacao="Confirme, com base em evidência objetiva, se a ação corretiva eliminou a causa."
        >
          {!terminada && podeEditar && estadoDa(2) === "atual" && (
            <AcaoDaEtapa
              nc={nc}
              causas={causas.ok ? causas.dados.map((c) => c.nome) : []}
            />
          )}
          {verificacao}
        </Etapa>

        <Etapa
          n={4}
          titulo="Encerrar não conformidade"
          estado={cancelada ? "a_seguir" : estadoDa(3)}
          resumo={
            encerrada && nc.encerradaEm
              ? `Encerrada em ${formatarMomento(nc.encerradaEm)}`
              : undefined
          }
          orientacao="Com a eficácia confirmada, a NC é encerrada. Ação ineficaz volta ao tratamento."
        >
          {encerrada && (
            <p className="text-base text-texto-2">
              A ação foi considerada eficaz e a NC foi encerrada.
            </p>
          )}
        </Etapa>
      </nav>

      <Anexos
        registro="nao_conformidade"
        registroId={nc.id}
        voltar={`/qualidade/nao-conformidades/${nc.id}`}
        podeEditar={podeEditar}
      />

      {outras.length > 0 && (
        <section className={`${painel} mt-6 p-5`}>
          <h2 className="text-sm font-semibold text-texto-2">
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

      {!terminada && permissoes.includes("qualidade.excluir") && (
        <div className="mt-6">
          <CancelarNc nc={nc} />
        </div>
      )}
    </article>
  );
}

/** Uma etapa da jornada: atual destacada e aberta; concluída recolhida; a seguir só indicada. */
function Etapa({
  n,
  titulo,
  estado,
  resumo,
  orientacao,
  children,
}: {
  n: number;
  titulo: string;
  estado: EstadoDaEtapa;
  resumo?: string;
  orientacao?: string;
  children?: ReactNode;
}) {
  const marca = (
    <span
      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
        estado === "atual"
          ? "bg-marinho text-primaria-texto"
          : estado === "concluida"
            ? "bg-conforme-suave text-conforme-texto"
            : "border border-borda-campo text-texto-3"
      }`}
    >
      {estado === "concluida" ? (
        <Check aria-hidden size={14} strokeWidth={1.75} />
      ) : (
        n
      )}
    </span>
  );
  const cabecalho = (
    <span className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-0.5">
      <span
        className={`font-semibold ${estado === "a_seguir" ? "text-texto-3" : "text-texto"}`}
      >
        {titulo}
      </span>
      {estado === "atual" && (
        <span className="text-sm font-medium text-marinho">Etapa atual</span>
      )}
      {estado === "a_seguir" && (
        <span className="text-sm text-texto-3">A seguir</span>
      )}
      {resumo && <span className="text-sm text-texto-2">{resumo}</span>}
    </span>
  );

  // Concluída: recolhida por padrão, acessível para consulta.
  if (estado === "concluida" && children) {
    return (
      <details className={`${painel} mt-4`}>
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
          {marca}
          {cabecalho}
          <ChevronDown
            aria-hidden
            size={18}
            strokeWidth={1.75}
            className="text-texto-3"
          />
        </summary>
        <div className="border-t border-borda px-5 py-4">{children}</div>
      </details>
    );
  }

  // Etapa atual: destacada e aberta, com a orientação e a ação.
  if (estado === "atual") {
    return (
      <section className={`${painel} mt-4 border-marinho p-5`}>
        <div className="flex items-center gap-3">
          {marca}
          {cabecalho}
        </div>
        {orientacao && (
          <p className="mt-2 text-base text-texto-2">{orientacao}</p>
        )}
        {children && <div className="mt-4">{children}</div>}
      </section>
    );
  }

  // A seguir (ou concluída sem conteúdo): só a indicação, sem ação.
  return (
    <section className={`${painel} mt-4 px-5 py-4`}>
      <div className="flex items-center gap-3">
        {marca}
        {cabecalho}
      </div>
      {estado === "a_seguir" && orientacao && (
        <p className="mt-2 text-sm text-texto-3">{orientacao}</p>
      )}
      {estado === "concluida" && children && (
        <div className="mt-3">{children}</div>
      )}
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
