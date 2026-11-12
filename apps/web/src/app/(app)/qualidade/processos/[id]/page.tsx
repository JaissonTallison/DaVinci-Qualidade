import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  STATUS_PROCESSO,
  type DadosDoUsuario,
  type ProcessoComRevisoes,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Botao } from "@/components/botao";
import { StatusDoProcesso } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento } from "@/lib/datas";
import {
  cabecalhoDoPainel,
  painel,
  tituloDaPagina,
  tituloDoPainel,
} from "@/lib/estilos";
import {
  AprovarProcesso,
  CancelarProcesso,
  EncerrarProcesso,
  EnviarParaRevisao,
  NovaRevisao,
  PublicarProcesso,
} from "./acoes";
import { CriarDocumentoControlado } from "./documento-controlado";
import { CabecalhoComVoltar } from "@/components/pagina-de-cadastro";

export const metadata: Metadata = { title: "Processo" };
const AVISOS: Record<string, string> = {
  criado: "Processo criado em elaboração.",
  salvo: "Processo atualizado.",
  enviado: "Processo enviado para revisão.",
  aprovado: "Processo aprovado.",
  publicado: "Processo publicado.",
  revisao: "Nova revisão aberta.",
  obsoleto: "Processo tornado obsoleto.",
  cancelado: "Processo cancelado.",
};

export default async function DetalheDoProcesso({
  params,
  searchParams,
}: PageProps<"/qualidade/processos/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<ProcessoComRevisoes>(`/processos/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const p = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const podeEditar = permissoes.includes("qualidade.editar");
  const podeGerir = permissoes.includes("qualidade.excluir");
  const editavel = p.status === "em_elaboracao" || p.status === "em_revisao";
  return (
    <article>
      <CabecalhoComVoltar
        voltar={{ href: "/qualidade/processos", rotulo: "Modelagem de processos" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <header className="flex flex-wrap items-center gap-x-3">
              <span className="font-mono text-base text-texto-2">
                {p.codigo}
              </span>
              <StatusDoProcesso
                status={p.status}
                vencida={p.revisaoVencida}
                proximaRevisao={p.dataProximaRevisao}
              />
            </header>
            <h1 className={`${tituloDaPagina} mt-1`}>{p.nome}</h1>
          </div>
          {podeEditar && editavel && (
            <Botao href={`/qualidade/processos/${p.id}/editar`}>Editar</Botao>
          )}
        </div>
      </CabecalhoComVoltar>
      <Aviso avisos={AVISOS} chave={aviso} />

      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <Dado rotulo="Situação">{STATUS_PROCESSO[p.status]}</Dado>
          <Dado rotulo="Revisão atual">
            {p.revisaoAtual > 0 ? `Rev. ${p.revisaoAtual}` : "Ainda não aprovado"}
          </Dado>
          {p.departamento && (
            <Dado rotulo="Departamento">{p.departamento}</Dado>
          )}
          {p.unidade && <Dado rotulo="Unidade de negócio">{p.unidade}</Dado>}
          {p.gestor && <Dado rotulo="Gestor do processo">{p.gestor}</Dado>}
          <Dado rotulo="Elaborado por">{p.elaboradoPor}</Dado>
          {p.aprovadoPorNome && (
            <Dado rotulo="Aprovado por">{p.aprovadoPorNome}</Dado>
          )}
          {p.publicadoEm && (
            <Dado rotulo="Publicado em">{formatarMomento(p.publicadoEm)}</Dado>
          )}
          {p.dataProximaRevisao && (
            <Dado rotulo="Próxima revisão">
              {formatarData(p.dataProximaRevisao)}
            </Dado>
          )}
          {p.normas && <Dado rotulo="Normas relacionadas">{p.normas}</Dado>}
          {p.objetivo && (
            <Dado rotulo="Objetivo" largo>
              {p.objetivo}
            </Dado>
          )}
          {p.escopo && (
            <Dado rotulo="Escopo" largo>
              {p.escopo}
            </Dado>
          )}
          {p.descricao && (
            <Dado rotulo="Descrição" largo>
              {p.descricao}
            </Dado>
          )}
          {p.status === "em_elaboracao" && p.oQueMudouPendente && (
            <Dado rotulo="O que muda nesta revisão" largo>
              {p.oQueMudouPendente}
            </Dado>
          )}
          {(p.status === "obsoleto" || p.status === "cancelado") &&
            p.motivoEncerramento && (
              <Dado
                rotulo={
                  p.status === "obsoleto"
                    ? "Motivo da obsolescência"
                    : "Motivo do cancelamento"
                }
                largo
              >
                {p.motivoEncerramento}
              </Dado>
            )}
        </dl>
      </section>

      <section className={`${painel} mt-6 p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={tituloDoPainel}>Diagrama do processo</h2>
            <p className="mt-1 text-sm text-texto-2">
              {p.conteudo && p.conteudo.nodes.length > 0
                ? `${p.conteudo.nodes.length} ${p.conteudo.nodes.length === 1 ? "elemento" : "elementos"} no diagrama.`
                : "Nenhum diagrama desenhado ainda."}
            </p>
          </div>
          {podeEditar && editavel ? (
            <Botao
              href={`/qualidade/processos/${p.id}/diagrama`}
              variante="primario"
            >
              Abrir editor de diagrama
            </Botao>
          ) : p.conteudo && p.conteudo.nodes.length > 0 ? (
            <Botao href={`/qualidade/processos/${p.id}/diagrama`}>
              Ver diagrama
            </Botao>
          ) : null}
        </div>
      </section>

      <section className={`${painel} mt-6 p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={tituloDoPainel}>Documento do processo</h2>
            <p className="mt-1 text-sm text-texto-2">
              Gere um documento estruturado a partir do cadastro e do diagrama
              (imprimível / PDF), ou crie um documento controlado para seguir o
              fluxo de aprovação.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Botao href={`/qualidade/processos/${p.id}/documento`}>
              Gerar documento do processo
            </Botao>
            {permissoes.includes("sgi.editar") && (
              <CriarDocumentoControlado processo={p} />
            )}
          </div>
        </div>
      </section>

      {p.revisoes.length > 0 && (
        <section className={`${painel} mt-6`}>
          <header className={cabecalhoDoPainel}>
            <h2 className={tituloDoPainel}>Histórico de revisões</h2>
          </header>
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-superficie-2 text-xs uppercase tracking-[0.04em] text-texto-2">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Rev.</th>
                  <th className="px-5 py-2.5 font-semibold">O que mudou</th>
                  <th className="px-5 py-2.5 font-semibold">Aprovado por</th>
                  <th className="px-5 py-2.5 font-semibold">Aprovado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {p.revisoes.map((rev) => (
                  <tr key={rev.revisao}>
                    <td className="px-5 py-3 whitespace-nowrap">
                      Rev. {rev.revisao}
                    </td>
                    <td className="max-w-md px-5 py-3">{rev.oQueMudou}</td>
                    <td className="px-5 py-3 text-texto-2">
                      {rev.aprovadoPorNome ?? "—"}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-texto-2">
                      {formatarMomento(rev.aprovadoEm)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {podeEditar && p.status === "em_elaboracao" && (
        <EnviarParaRevisao processo={p} />
      )}
      {p.status === "em_revisao" && podeGerir && !p.criadoPorMim && (
        <AprovarProcesso processo={p} />
      )}
      {p.status === "em_revisao" && p.criadoPorMim && (
        <p className="mt-6 text-base text-texto-2">
          Você elaborou este processo: a aprovação é de outro gestor.
        </p>
      )}
      {podeGerir && p.status === "aprovado" && (
        <PublicarProcesso processo={p} />
      )}
      {podeEditar &&
        (p.status === "aprovado" || p.status === "publicado") && (
          <NovaRevisao processo={p} />
        )}
      {podeGerir &&
        (p.status === "aprovado" || p.status === "publicado") && (
          <EncerrarProcesso processo={p} />
        )}
      {podeGerir && editavel && <CancelarProcesso processo={p} />}
    </article>
  );
}

function Dado({
  rotulo,
  children,
  largo = false,
}: {
  rotulo: string;
  children: ReactNode;
  largo?: boolean;
}) {
  return (
    <div className={largo ? "sm:col-span-3" : ""}>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd className="mt-0.5 text-base whitespace-pre-line">{children}</dd>
    </div>
  );
}
