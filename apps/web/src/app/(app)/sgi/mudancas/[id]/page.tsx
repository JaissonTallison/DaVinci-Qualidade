import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { DadosDoUsuario, Mudanca } from "@davinci/types";
import { Anexos } from "@/components/anexos";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { StatusDaMudanca } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { Dado } from "../../dado";
import { DecidirMudanca, ImplementarMudanca } from "./acoes";

export const metadata: Metadata = { title: "Mudança" };
const AVISOS: Record<string, string> = {
  proposta: "Mudança proposta. Agora um gestor decide.",
  aprovada: "Mudança aprovada.",
  rejeitada: "Mudança rejeitada.",
  implementada: "Mudança implementada.",
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
};

export default async function DetalheDaMudanca({
  params,
  searchParams,
}: PageProps<"/sgi/mudancas/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Mudanca>(`/mudancas/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const m = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  return (
    <article>
      <Link
        href="/sgi/mudancas"
        className="text-sm text-texto-2 hover:underline"
      >
        Gestão de mudanças
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4">
        <span className="font-mono text-lg text-texto-2">{m.numero}</span>
        <StatusDaMudanca status={m.status} />
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>{m.titulo}</h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <Dado rotulo="O que muda" largo>
            {m.descricao}
          </Dado>
          <Dado rotulo="Motivo" largo>
            {m.motivo}
          </Dado>
          <Dado rotulo="Impactos e riscos" largo>
            {m.impactos}
          </Dado>
          <Dado rotulo="Responsável">{m.responsavel}</Dado>
          <Dado rotulo="Data prevista">{formatarData(m.dataPrevista)}</Dado>
          {m.parecer && (
            <Dado rotulo={`Parecer (${formatarMomento(m.decididaEm!)})`} largo>
              {m.parecer}
            </Dado>
          )}
          {m.verificacao && (
            <Dado
              rotulo={`Verificação (${formatarMomento(m.implementadaEm!)})`}
              largo
            >
              {m.verificacao}
            </Dado>
          )}
        </dl>
      </section>
      {m.status === "proposta" &&
        permissoes.includes("sgi.excluir") &&
        !m.propostaPorMim && <DecidirMudanca mudanca={m} />}
      {m.status === "proposta" && m.propostaPorMim && (
        <p className="mt-6 text-base text-texto-2">
          Você propôs esta mudança: a decisão é de outro gestor.
        </p>
      )}
      {m.status === "aprovada" && permissoes.includes("sgi.editar") && (
        <ImplementarMudanca mudanca={m} />
      )}
      <Anexos
        registro="mudanca"
        registroId={m.id}
        voltar={`/sgi/mudancas/${m.id}`}
        podeEditar={permissoes.includes("sgi.editar")}
      />
    </article>
  );
}
