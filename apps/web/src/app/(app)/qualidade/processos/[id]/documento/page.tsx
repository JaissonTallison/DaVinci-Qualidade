import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  STATUS_PROCESSO,
  type DadosDoUsuario,
  type ProcessoComRevisoes,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { FolhaDeDocumento } from "@/components/folha-de-documento";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento } from "@/lib/datas";
import type { DadosDoNo } from "../diagrama/elementos";

export const metadata: Metadata = { title: "Documento do processo" };

type No = { id: string; data: DadosDoNo };
type Aresta = { source: string; target: string; sourceHandle: string | null };

/** Ordena os nós seguindo o fluxo (BFS a partir de quem não tem entrada); o resto vai ao fim. */
function ordenar(nos: No[], arestas: Aresta[]): No[] {
  const porId = new Map(nos.map((n) => [n.id, n]));
  const saida = new Map<string, string[]>();
  for (const a of arestas) {
    const l = saida.get(a.source) ?? [];
    l.push(a.target);
    saida.set(a.source, l);
  }
  const temEntrada = new Set(arestas.map((a) => a.target));
  const raizes = nos.filter((n) => !temEntrada.has(n.id));
  const fila = (raizes.length ? raizes : nos.slice(0, 1)).map((n) => n.id);
  const visto = new Set<string>();
  const ordem: No[] = [];
  while (fila.length) {
    const id = fila.shift()!;
    if (visto.has(id)) continue;
    visto.add(id);
    const n = porId.get(id);
    if (n) ordem.push(n);
    for (const t of saida.get(id) ?? []) if (!visto.has(t)) fila.push(t);
  }
  for (const n of nos) if (!visto.has(n.id)) ordem.push(n);
  return ordem;
}

export default async function DocumentoDoProcesso({
  params,
}: PageProps<"/qualidade/processos/[id]/documento">) {
  const { id } = await params;
  const [r, eu] = await Promise.all([
    chamarApi<ProcessoComRevisoes>(`/processos/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const p = r.dados;
  const empresa = eu.ok ? eu.dados.empresa.nome : undefined;

  const nos: No[] = (p.conteudo?.nodes ?? []).map((n) => ({
    id: n.id,
    data: n.data as DadosDoNo,
  }));
  const arestas: Aresta[] = (p.conteudo?.edges ?? []).map((e) => ({
    source: e.source,
    target: e.target,
    sourceHandle: (e.sourceHandle as string | undefined) ?? null,
  }));
  const nomeDe = (nid: string) => {
    const n = nos.find((x) => x.id === nid);
    return n ? n.data.nome || n.data.rotulo : "—";
  };
  const ordenados = ordenar(nos, arestas);

  const atividades = ordenados.filter((n) =>
    ["processo", "subprocesso", "qualidade", "dados", "armazenamento"].includes(
      n.data.forma,
    ),
  );
  const decisoes = ordenados.filter((n) => n.data.forma === "decisao");
  const documentos = ordenados.filter(
    (n) => n.data.forma === "documento" || n.data.categoria === "documento_controlado",
  );
  const temDiagrama = nos.length > 0;

  return (
    <FolhaDeDocumento
      tipo="Documento de processo"
      numero={
        p.revisaoAtual > 0 ? `${p.codigo} · revisão ${p.revisaoAtual}` : p.codigo
      }
      titulo={p.nome}
      subtitulo={STATUS_PROCESSO[p.status]}
      empresa={empresa}
      emitidoEm={formatarMomento(new Date().toISOString())}
      voltarHref={`/qualidade/processos/${p.id}`}
      voltarRotulo="Voltar ao processo"
      assinaturas={[
        { nome: p.elaboradoPor, papel: "Elaboração" },
        { nome: p.aprovadoPorNome, papel: "Aprovação" },
        { papel: "Gestão da Qualidade" },
      ]}
    >
      <Secao titulo="1. Identificação">
        <Grid>
          <Campo rotulo="Código">{p.codigo}</Campo>
          <Campo rotulo="Revisão">
            {p.revisaoAtual > 0 ? `Rev. ${p.revisaoAtual}` : "—"}
          </Campo>
          <Campo rotulo="Situação">{STATUS_PROCESSO[p.status]}</Campo>
          {p.departamento && (
            <Campo rotulo="Departamento">{p.departamento}</Campo>
          )}
          {p.unidade && <Campo rotulo="Unidade">{p.unidade}</Campo>}
          {p.gestor && <Campo rotulo="Gestor do processo">{p.gestor}</Campo>}
          <Campo rotulo="Elaborado por">{p.elaboradoPor}</Campo>
          {p.dataProximaRevisao && (
            <Campo rotulo="Próxima revisão">
              {formatarData(p.dataProximaRevisao)}
            </Campo>
          )}
          {p.normas && <Campo rotulo="Normas">{p.normas}</Campo>}
        </Grid>
      </Secao>

      {p.objetivo && (
        <Secao titulo="2. Objetivo">
          <Texto>{p.objetivo}</Texto>
        </Secao>
      )}
      {p.escopo && (
        <Secao titulo="3. Escopo">
          <Texto>{p.escopo}</Texto>
        </Secao>
      )}
      {p.descricao && (
        <Secao titulo="4. Descrição">
          <Texto>{p.descricao}</Texto>
        </Secao>
      )}

      <Secao titulo="5. Atividades do processo">
        {!temDiagrama ? (
          <Texto>
            O diagrama do processo ainda não foi desenhado. Abra o editor de
            diagrama e modele o fluxo para gerar as atividades automaticamente.
          </Texto>
        ) : atividades.length === 0 ? (
          <Texto>Nenhuma atividade identificada no diagrama.</Texto>
        ) : (
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-texto text-xs tracking-[0.03em] text-texto-2 uppercase">
                <th className="py-1.5 pr-3 font-semibold">Nº</th>
                <th className="py-1.5 pr-3 font-semibold">Atividade</th>
                <th className="py-1.5 pr-3 font-semibold">Responsável</th>
                <th className="py-1.5 pr-3 font-semibold">Departamento</th>
                <th className="py-1.5 font-semibold">Descrição</th>
              </tr>
            </thead>
            <tbody>
              {atividades.map((n, i) => (
                <tr key={n.id} className="border-b border-borda align-top">
                  <td className="py-1.5 pr-3">{i + 1}</td>
                  <td className="py-1.5 pr-3 font-medium">
                    {n.data.nome || n.data.rotulo}
                    {n.data.codigo ? ` (${n.data.codigo})` : ""}
                  </td>
                  <td className="py-1.5 pr-3">{n.data.responsavel ?? "—"}</td>
                  <td className="py-1.5 pr-3">{n.data.departamento ?? "—"}</td>
                  <td className="py-1.5">{n.data.descricao ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Secao>

      {decisoes.length > 0 && (
        <Secao titulo="6. Pontos de decisão">
          <ul className="space-y-2 text-sm text-texto">
            {decisoes.map((n) => {
              const sim = arestas.find(
                (a) => a.source === n.id && a.sourceHandle === "sim",
              );
              const nao = arestas.find(
                (a) => a.source === n.id && a.sourceHandle === "nao",
              );
              return (
                <li key={n.id}>
                  <span className="font-medium">
                    {n.data.pergunta || n.data.nome || "Decisão"}
                  </span>
                  <div className="text-texto-2">
                    {sim && <>Se sim → {nomeDe(sim.target)}. </>}
                    {nao && <>Se não → {nomeDe(nao.target)}.</>}
                  </div>
                </li>
              );
            })}
          </ul>
        </Secao>
      )}

      {documentos.length > 0 && (
        <Secao titulo="7. Documentos relacionados">
          <ul className="list-disc space-y-1 pl-5 text-sm text-texto">
            {documentos.map((n) => (
              <li key={n.id}>
                {n.data.nome || n.data.rotulo}
                {n.data.codigo ? ` · ${n.data.codigo}` : ""}
              </li>
            ))}
          </ul>
        </Secao>
      )}

      {p.revisoes.length > 0 && (
        <Secao titulo="8. Histórico de revisões">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-texto text-xs tracking-[0.03em] text-texto-2 uppercase">
                <th className="py-1.5 pr-3 font-semibold">Rev.</th>
                <th className="py-1.5 pr-3 font-semibold">O que mudou</th>
                <th className="py-1.5 pr-3 font-semibold">Aprovado por</th>
                <th className="py-1.5 font-semibold">Data</th>
              </tr>
            </thead>
            <tbody>
              {p.revisoes.map((rev) => (
                <tr key={rev.revisao} className="border-b border-borda">
                  <td className="py-1.5 pr-3">Rev. {rev.revisao}</td>
                  <td className="py-1.5 pr-3">{rev.oQueMudou}</td>
                  <td className="py-1.5 pr-3">{rev.aprovadoPorNome ?? "—"}</td>
                  <td className="py-1.5 whitespace-nowrap">
                    {formatarData(rev.aprovadoEm.slice(0, 10))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <div className="mt-2.5">{children}</div>
    </section>
  );
}
function Grid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-x-10 gap-y-2.5 sm:grid-cols-2">{children}</dl>;
}
function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-borda/60 pb-1">
      <dt className="text-sm text-texto-2">{rotulo}</dt>
      <dd className="text-right text-sm font-medium text-texto">{children}</dd>
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
