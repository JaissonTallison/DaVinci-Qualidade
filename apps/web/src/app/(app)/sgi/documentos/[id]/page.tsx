import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  STATUS_DOCUMENTO,
  TIPOS_DOCUMENTO,
  type DadosDoUsuario,
  type DocumentoComRevisoes,
} from "@davinci/types";
import { Anexos } from "@/components/anexos";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Botao } from "@/components/botao";
import { StatusDoDocumento } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento } from "@/lib/datas";
import {
  cabecalhoDoPainel,
  painel,
  tituloDaPagina,
  tituloDoPainel,
} from "@/lib/estilos";
import { Dado } from "../../dado";
import {
  AprovarDocumento,
  EnviarParaRevisao,
  NovaRevisao,
  TornarObsoleto,
} from "./acoes";
import { CabecalhoComVoltar } from "@/components/pagina-de-cadastro";

export const metadata: Metadata = { title: "Documento" };
const AVISOS: Record<string, string> = {
  criado: "Documento criado como rascunho.",
  salvo: "Documento atualizado.",
  enviado: "Documento enviado para revisão.",
  aprovado: "Documento aprovado: agora está vigente.",
  revisao: "Nova revisão aberta.",
  obsoleto: "Documento tornado obsoleto.",
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
};

export default async function DetalheDoDocumento({
  params,
  searchParams,
}: PageProps<"/sgi/documentos/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<DocumentoComRevisoes>(`/documentos/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const d = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const podeEditar = permissoes.includes("sgi.editar");
  const podeAprovar = permissoes.includes("sgi.excluir");
  const editavel = d.status === "rascunho" || d.status === "em_revisao";
  return (
    <article>
      <CabecalhoComVoltar
        voltar={{ href: "/sgi/documentos", rotulo: "Normas e procedimentos" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <header className="flex flex-wrap items-center gap-x-3">
              <span className="font-mono text-base text-texto-2">
                {d.codigo}
              </span>
              <StatusDoDocumento
                status={d.status}
                vencida={d.revisaoVencida}
                proximaRevisao={d.proximaRevisao}
              />
            </header>
            <h1 className={`${tituloDaPagina} mt-1`}>{d.titulo}</h1>
          </div>
          {podeEditar && editavel && (
            <Botao href={`/sgi/documentos/${d.id}/editar`}>Editar</Botao>
          )}
        </div>
      </CabecalhoComVoltar>
      <Aviso avisos={AVISOS} chave={aviso} />

      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <Dado rotulo="Tipo">{TIPOS_DOCUMENTO[d.tipo]}</Dado>
          <Dado rotulo="Revisão atual">
            {d.revisaoAtual > 0 ? `Rev. ${d.revisaoAtual}` : "Ainda não aprovado"}
          </Dado>
          <Dado rotulo="Situação">{STATUS_DOCUMENTO[d.status]}</Dado>
          {d.area && <Dado rotulo="Área ou processo">{d.area}</Dado>}
          <Dado rotulo="Elaborado por">{d.elaboradoPor}</Dado>
          {d.aprovadoPorNome && (
            <Dado rotulo="Aprovado por">{d.aprovadoPorNome}</Dado>
          )}
          {d.dataVigencia && (
            <Dado rotulo="Vigente desde">{formatarData(d.dataVigencia)}</Dado>
          )}
          {d.proximaRevisao && (
            <Dado rotulo="Próxima revisão">
              {formatarData(d.proximaRevisao)}
            </Dado>
          )}
          {d.status === "em_revisao" && d.oQueMudouPendente && (
            <Dado rotulo="O que muda nesta revisão" largo>
              {d.oQueMudouPendente}
            </Dado>
          )}
          {d.status === "obsoleto" && d.motivoObsolescencia && (
            <Dado rotulo="Motivo da obsolescência" largo>
              {d.motivoObsolescencia}
            </Dado>
          )}
        </dl>
      </section>

      {d.revisoes.length > 0 && (
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
                  <th className="px-5 py-2.5 font-semibold">Vigência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {d.revisoes.map((rev) => (
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
                    <td className="px-5 py-3 whitespace-nowrap text-texto-2">
                      {rev.dataVigencia ? formatarData(rev.dataVigencia) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {podeEditar && d.status === "rascunho" && (
        <EnviarParaRevisao documento={d} />
      )}
      {d.status === "em_revisao" && podeAprovar && !d.criadoPorMim && (
        <AprovarDocumento documento={d} />
      )}
      {d.status === "em_revisao" && d.criadoPorMim && (
        <p className="mt-6 text-base text-texto-2">
          Você elaborou este documento: a aprovação é de outro gestor.
        </p>
      )}
      {podeEditar && d.status === "vigente" && <NovaRevisao documento={d} />}
      {podeAprovar && d.status === "vigente" && (
        <TornarObsoleto documento={d} />
      )}

      <Anexos
        registro="documento"
        registroId={d.id}
        voltar={`/sgi/documentos/${d.id}`}
        podeEditar={podeEditar}
      />
    </article>
  );
}
