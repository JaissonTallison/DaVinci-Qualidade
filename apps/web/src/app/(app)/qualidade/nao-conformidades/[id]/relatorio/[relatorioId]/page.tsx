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
      assinaturas={[
        { nome: nc.responsavel, papel: "Responsável pelo tratamento" },
        { nome: verificadoPorNome, papel: "Verificação de eficácia" },
        { papel: "Gestão da Qualidade" },
      ]}
    >
      <Secao titulo="Identificação">
        <Grid>
          <Campo rotulo="Número">{nc.numero}</Campo>
          <Campo rotulo="Situação">{STATUS_NC[nc.status]}</Campo>
          <Campo rotulo="Origem">{ORIGENS_NC[nc.origem]}</Campo>
          <Campo rotulo="Registro de origem">{nc.origemRef ?? "—"}</Campo>
          <Campo rotulo="Tipo">{TIPOS_NC[nc.tipo]}</Campo>
          <Campo rotulo="Gravidade">{GRAVIDADES_NC[nc.gravidade]}</Campo>
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
          <Campo rotulo="Ciclos de tratamento">{nc.ciclos}</Campo>
        </Grid>
      </Secao>

      <Secao titulo="Descrição da ocorrência">
        <Texto>{nc.descricao}</Texto>
      </Secao>

      {nc.contencao && (
        <Secao titulo="Contenção imediata">
          <Texto>{nc.contencao}</Texto>
        </Secao>
      )}

      <Secao titulo="Análise da causa">
        <Grid>
          {nc.metodoAnalise && (
            <Campo rotulo="Método">{METODOS_ANALISE[nc.metodoAnalise]}</Campo>
          )}
          {nc.categoria6m && (
            <Campo rotulo="Categoria (6M)">
              {CATEGORIAS_6M[nc.categoria6m]}
            </Campo>
          )}
          {nc.causaTipo && <Campo rotulo="Tipo de causa">{nc.causaTipo}</Campo>}
        </Grid>
        {nc.porques.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-semibold text-texto">Cinco porquês</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-texto">
              {nc.porques.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ol>
          </div>
        )}
        {nc.causaRaiz && (
          <div className="mt-3">
            <p className="text-sm font-semibold text-texto">Causa raiz</p>
            <Texto>{nc.causaRaiz}</Texto>
          </div>
        )}
      </Secao>

      {(nc.acaoCorretiva || nc.dataImplantacao) && (
        <Secao titulo="Ação corretiva">
          {nc.acaoCorretiva && <Texto>{nc.acaoCorretiva}</Texto>}
          {nc.dataImplantacao && (
            <p className="mt-2 text-sm text-texto-2">
              Implantada em {formatarData(nc.dataImplantacao)}.
            </p>
          )}
        </Secao>
      )}

      {planos.length > 0 && (
        <Secao titulo="Plano de ação">
          {planos.map((p) => (
            <div key={p.numero} className="mb-5 break-inside-avoid last:mb-0">
              <p className="text-sm font-semibold text-texto">
                {p.numero} · {p.titulo}
                <span className="ml-2 font-normal text-texto-2">
                  {TIPOS_PLANO[p.tipo as keyof typeof TIPOS_PLANO] ?? p.tipo} ·{" "}
                  {STATUS_PLANO[p.status as keyof typeof STATUS_PLANO] ??
                    p.status}
                  {" · "}
                  {p.responsavel}
                </span>
              </p>
              {p.objetivo && (
                <p className="mt-0.5 text-sm text-texto-2">{p.objetivo}</p>
              )}
              {p.tarefas.length > 0 && (
                <table className="mt-2 w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-texto text-xs uppercase tracking-[0.03em] text-texto-2">
                      <th className="py-1 pr-3 font-semibold">O que</th>
                      <th className="py-1 pr-3 font-semibold">Quem</th>
                      <th className="py-1 pr-3 font-semibold">Prazo</th>
                      <th className="py-1 font-semibold">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.tarefas.map((t) => (
                      <tr key={t.ordem} className="border-b border-borda">
                        <td className="py-1 pr-3">{t.oQue}</td>
                        <td className="py-1 pr-3">{t.responsavel}</td>
                        <td className="py-1 pr-3">{formatarData(t.prazo)}</td>
                        <td className="py-1">
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
          ))}
        </Secao>
      )}

      <Secao titulo="Verificação de eficácia">
        <Grid>
          <Campo rotulo="Resultado">
            {nc.eficaz === null ? "—" : nc.eficaz ? "Eficaz" : "Ineficaz"}
          </Campo>
          <Campo rotulo="Verificado por">{verificadoPorNome ?? "—"}</Campo>
          <Campo rotulo="Verificado em">
            {nc.verificadoEm ? formatarMomento(nc.verificadoEm) : "—"}
          </Campo>
        </Grid>
        {nc.parecerEficacia && (
          <div className="mt-3">
            <p className="text-sm font-semibold text-texto">Parecer</p>
            <Texto>{nc.parecerEficacia}</Texto>
          </div>
        )}
      </Secao>

      <Secao titulo="Evidências e anexos">
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

      <Secao titulo="Histórico cronológico">
        <ul className="space-y-1 text-sm text-texto">
          {historico.map((h) => (
            <li key={h.etapa} className="flex flex-wrap justify-between gap-x-4">
              <span>{h.etapa}</span>
              <span className="text-texto-2">{h.quando}</span>
            </li>
          ))}
        </ul>
      </Secao>

      {nc.status === "encerrada" && (
        <Secao titulo="Conclusão">
          <Texto>
            A ação corretiva foi considerada eficaz na verificação e a não
            conformidade {nc.numero} foi encerrada
            {nc.encerradaEm ? ` em ${formatarMomento(nc.encerradaEm)}` : ""}. Este
            relatório (versão {rel.versao}) reflete os dados registrados no
            sistema no momento do encerramento.
          </Texto>
        </Secao>
      )}
    </FolhaDeDocumento>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-6 break-inside-avoid">
      <h2 className="border-b border-borda pb-1 text-md font-semibold text-texto">
        {titulo}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return (
    <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </dl>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd className="text-sm text-texto">{children}</dd>
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
