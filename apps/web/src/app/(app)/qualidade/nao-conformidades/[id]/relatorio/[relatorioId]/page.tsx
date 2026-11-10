import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  CATEGORIAS_6M,
  GRAVIDADES_NC,
  METODOS_ANALISE,
  ORIGENS_NC,
  SITUACOES_TAREFA,
  STATUS_NC,
  STATUS_PLANO,
  TIPOS_NC,
  TIPOS_PLANO,
  type Anexo,
  type DadosDoUsuario,
  type RelatorioDeEncerramento,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { FolhaDeDocumento } from "@/components/folha-de-documento";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento } from "@/lib/datas";
import { formatarReais } from "@/lib/valores";

export const metadata: Metadata = { title: "Relatório de encerramento" };

/** Tamanho de arquivo legível (KB/MB). */
function tamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Relatório de Encerramento da NC: renderiza uma VERSÃO EMITIDA (snapshot imutável), não a NC ao vivo.
 * Imprimir/salvar em PDF pelo navegador. As evidências são listadas do registro atual (arquivos anexados).
 */
export default async function RelatorioDeEncerramentoNc({
  params,
}: PageProps<"/qualidade/nao-conformidades/[id]/relatorio/[relatorioId]">) {
  const { id, relatorioId } = await params;
  const [r, eu] = await Promise.all([
    chamarApi<RelatorioDeEncerramento>(`/nao-conformidades/relatorios/${relatorioId}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const rel = r.dados;
  const { nc, planos, verificadoPorNome } = rel.snapshot;
  const empresa = eu.ok ? eu.dados.empresa.nome : undefined;
  const anexos = await chamarApi<Anexo[]>(
    `/anexos?registro=nao_conformidade&registroId=${encodeURIComponent(nc.id)}`,
  );
  const evidencias = anexos.ok ? anexos.dados : [];

  // Histórico cronológico a partir das datas registradas na NC.
  const historico: { etapa: string; quando: string }[] = [
    { etapa: "Abertura da NC", quando: formatarData(nc.dataAbertura) },
    ...(nc.dataImplantacao
      ? [
          {
            etapa: "Implantação da ação corretiva",
            quando: formatarData(nc.dataImplantacao),
          },
        ]
      : []),
    ...(nc.verificadoEm
      ? [
          {
            etapa: `Verificação de eficácia (${nc.eficaz ? "eficaz" : "ineficaz"})`,
            quando: formatarMomento(nc.verificadoEm),
          },
        ]
      : []),
    ...(nc.encerradaEm
      ? [
          { etapa: "Encerramento da NC", quando: formatarMomento(nc.encerradaEm) },
        ]
      : []),
  ];

  // Responsáveis por cada etapa, para a tabela de aprovação/assinaturas.
  const responsaveis: { etapa: string; quem: string; data: string }[] = [
    {
      etapa: "Tratamento da NC",
      quem: nc.responsavel,
      data: nc.dataImplantacao ? formatarData(nc.dataImplantacao) : "—",
    },
    {
      etapa: "Verificação de eficácia",
      quem: verificadoPorNome ?? "—",
      data: nc.verificadoEm ? formatarData(nc.verificadoEm) : "—",
    },
    { etapa: "Aprovação (Gestão da Qualidade)", quem: "—", data: "—" },
  ];

  return (
    <FolhaDeDocumento
      tipo="Relatório de encerramento de não conformidade"
      numero={`${nc.numero} · versão ${rel.versao}`}
      titulo={nc.titulo}
      subtitulo={`${STATUS_NC[nc.status]} · Gravidade ${GRAVIDADES_NC[nc.gravidade]}`}
      empresa={empresa}
      emitidoEm={formatarMomento(rel.emitidoEm)}
      voltarHref={`/qualidade/nao-conformidades/${id}`}
      voltarRotulo="Voltar à NC"
    >
      <Secao titulo="1. Identificação">
        <Grid>
          <Campo rotulo="Origem">
            {ORIGENS_NC[nc.origem]}
            {nc.origemRef ? ` · ${nc.origemRef}` : ""}
          </Campo>
          <Campo rotulo="Tipo">{TIPOS_NC[nc.tipo]}</Campo>
          <Campo rotulo="Responsável">{nc.responsavel}</Campo>
          <Campo rotulo="Abertura">{formatarData(nc.dataAbertura)}</Campo>
          <Campo rotulo="Prazo">{formatarData(nc.prazo)}</Campo>
          {nc.encerradaEm && (
            <Campo rotulo="Encerramento">
              {formatarMomento(nc.encerradaEm)}
            </Campo>
          )}
          {nc.setor && <Campo rotulo="Setor">{nc.setor}</Campo>}
          {nc.processo && <Campo rotulo="Processo">{nc.processo}</Campo>}
          {nc.produto && <Campo rotulo="Produto">{nc.produto}</Campo>}
          {nc.lote && <Campo rotulo="Lote">{nc.lote}</Campo>}
          {nc.custoEstimado && (
            <Campo rotulo="Custo estimado">
              {formatarReais(nc.custoEstimado)}
            </Campo>
          )}
          {nc.ciclos > 0 && (
            <Campo rotulo="Ciclos de tratamento">{nc.ciclos}</Campo>
          )}
        </Grid>
      </Secao>

      <Secao titulo="2. Descrição da ocorrência">
        <Texto>{nc.descricao}</Texto>
      </Secao>

      {nc.contencao && (
        <Secao titulo="3. Contenção imediata">
          <Texto>{nc.contencao}</Texto>
        </Secao>
      )}

      <Secao titulo="4. Análise da causa">
        {(nc.metodoAnalise || nc.categoria6m || nc.causaTipo) && (
          <p className="text-sm text-texto-2">
            {[
              nc.metodoAnalise && METODOS_ANALISE[nc.metodoAnalise],
              nc.categoria6m && `6M: ${CATEGORIAS_6M[nc.categoria6m]}`,
              nc.causaTipo,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        {nc.porques.length > 0 && (
          <Bloco titulo="Cinco porquês">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-texto">
              {nc.porques.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ol>
          </Bloco>
        )}
        {nc.causaRaiz && (
          <Bloco titulo="Causa raiz">
            <Texto>{nc.causaRaiz}</Texto>
          </Bloco>
        )}
      </Secao>

      {(nc.acaoCorretiva || nc.dataImplantacao) && (
        <Secao titulo="5. Ação corretiva">
          {nc.acaoCorretiva && <Texto>{nc.acaoCorretiva}</Texto>}
          {nc.dataImplantacao && (
            <p className="mt-2 text-sm text-texto-2">
              Implantada em {formatarData(nc.dataImplantacao)}.
            </p>
          )}
        </Secao>
      )}

      {planos.length > 0 && (
        <Secao titulo="6. Plano de ação">
          {planos.map((p) => {
            const concluidas = p.tarefas.filter(
              (t) => t.situacao === "concluida",
            ).length;
            return (
              <div key={p.numero} className="mb-6 break-inside-avoid last:mb-0">
                <p className="text-sm font-semibold text-texto">
                  {p.numero} · {p.titulo}
                </p>
                <p className="mt-0.5 text-xs text-texto-2">
                  {[
                    TIPOS_PLANO[p.tipo as keyof typeof TIPOS_PLANO] ?? p.tipo,
                    STATUS_PLANO[p.status as keyof typeof STATUS_PLANO] ??
                      p.status,
                    p.responsavel,
                    p.tarefas.length > 0 &&
                      `${concluidas} de ${p.tarefas.length} tarefas concluídas`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {p.objetivo && (
                  <p className="mt-1 text-sm text-texto-2">{p.objetivo}</p>
                )}
                {p.tarefas.length > 0 && (
                  <table className="mt-2 w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-texto text-xs tracking-[0.03em] text-texto-2 uppercase">
                        <th className="py-1.5 pr-3 font-semibold">O que</th>
                        <th className="py-1.5 pr-3 font-semibold">Quem</th>
                        <th className="py-1.5 pr-3 font-semibold">Prazo</th>
                        <th className="py-1.5 font-semibold">Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.tarefas.map((t) => (
                        <tr
                          key={t.ordem}
                          className="border-b border-borda align-top"
                        >
                          <td className="py-1.5 pr-3">{t.oQue}</td>
                          <td className="py-1.5 pr-3">{t.responsavel}</td>
                          <td className="py-1.5 pr-3 whitespace-nowrap">
                            {formatarData(t.prazo)}
                          </td>
                          <td className="py-1.5">
                            {SITUACOES_TAREFA[
                              t.situacao as keyof typeof SITUACOES_TAREFA
                            ] ?? t.situacao}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </Secao>
      )}

      <Secao titulo="7. Verificação de eficácia">
        <p className="text-sm text-texto">
          <span className="font-semibold">Resultado: </span>
          {nc.eficaz === null
            ? "—"
            : nc.eficaz
              ? "Eficaz — ação corretiva confirmada."
              : "Ineficaz — a ação corretiva não resolveu a causa."}
        </p>
        <p className="mt-1 text-sm text-texto-2">
          {verificadoPorNome
            ? `Verificado por ${verificadoPorNome}`
            : "Verificação registrada"}
          {nc.verificadoEm ? ` em ${formatarMomento(nc.verificadoEm)}` : ""}.
        </p>
        {nc.parecerEficacia && (
          <Bloco titulo="Parecer">
            <Texto>{nc.parecerEficacia}</Texto>
          </Bloco>
        )}
      </Secao>

      <Secao titulo="8. Evidências e anexos">
        {evidencias.length === 0 ? (
          <p className="text-sm text-texto-2">Nenhum anexo no registro.</p>
        ) : (
          <ul className="space-y-1 text-sm text-texto">
            {evidencias.map((a) => (
              <li key={a.id} className="flex flex-wrap gap-x-2">
                <span className="font-medium">{a.nome}</span>
                <span className="text-texto-2">
                  ({tamanho(a.tamanho)} · {formatarData(a.criadoEm.slice(0, 10))}
                  {a.descricao ? ` · ${a.descricao}` : ""})
                </span>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      <Secao titulo="9. Histórico cronológico">
        <ul className="divide-y divide-borda text-sm text-texto">
          {historico.map((h) => (
            <li
              key={h.etapa}
              className="flex flex-wrap justify-between gap-x-4 py-1.5"
            >
              <span>{h.etapa}</span>
              <span className="whitespace-nowrap text-texto-2">{h.quando}</span>
            </li>
          ))}
        </ul>
      </Secao>

      {nc.status === "encerrada" && (
        <Secao titulo="10. Conclusão">
          <Texto>
            A ação corretiva foi considerada eficaz na verificação e a não
            conformidade {nc.numero} foi encerrada
            {nc.encerradaEm ? ` em ${formatarMomento(nc.encerradaEm)}` : ""}. Este
            relatório (versão {rel.versao}) reflete os dados registrados no
            sistema no momento do encerramento.
          </Texto>
        </Secao>
      )}

      <section className="mt-10 break-inside-avoid">
        <h2 className="border-b border-borda pb-1 text-md font-semibold text-texto">
          Responsabilidades e aprovação
        </h2>
        <table className="mt-3 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-texto text-xs tracking-[0.03em] text-texto-2 uppercase">
              <th className="py-1.5 pr-4 font-semibold">Etapa</th>
              <th className="py-1.5 pr-4 font-semibold">Responsável</th>
              <th className="py-1.5 pr-4 font-semibold">Data</th>
              <th className="w-[38%] py-1.5 font-semibold">Assinatura</th>
            </tr>
          </thead>
          <tbody>
            {responsaveis.map((resp) => (
              <tr
                key={resp.etapa}
                className="border-b border-borda align-bottom"
              >
                <td className="py-3 pr-4 font-medium text-texto">
                  {resp.etapa}
                </td>
                <td className="py-3 pr-4 text-texto">{resp.quem}</td>
                <td className="py-3 pr-4 whitespace-nowrap text-texto">
                  {resp.data}
                </td>
                <td className="py-3">
                  <span className="mt-4 block border-b border-texto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </FolhaDeDocumento>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-6 break-inside-avoid">
      <h2 className="border-b border-borda pb-1 text-md font-semibold text-texto">
        {titulo}
      </h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return (
    <dl className="grid gap-x-10 gap-y-2.5 sm:grid-cols-2">{children}</dl>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-borda/60 pb-1">
      <dt className="text-sm text-texto-2">{rotulo}</dt>
      <dd className="text-right text-sm font-medium text-texto">{children}</dd>
    </div>
  );
}

/** Subtítulo interno de uma seção (ex.: "Causa raiz", "Parecer"). */
function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="mt-3">
      <p className="text-sm font-semibold text-texto">{titulo}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Texto({ children }: { children: ReactNode }) {
  return (
    <p className="max-w-[80ch] text-sm whitespace-pre-line text-texto">
      {children}
    </p>
  );
}
