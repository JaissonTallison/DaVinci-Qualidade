import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { DadosDoUsuario, OrdemDeServico } from "@davinci/types";
import { Anexos } from "@/components/anexos";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { StatusDaOs } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { AvaliarOs, CancelarOs, ConcluirOs, IniciarOs } from "./acoes";

export const metadata: Metadata = { title: "Ordem de serviço" };
const AVISOS: Record<string, string> = {
  criada: "Ordem de serviço aberta.",
  iniciada: "Execução iniciada.",
  concluida: "OS concluída. Registre a avaliação do cliente quando receber.",
  cancelada: "OS cancelada.",
  avaliada: "Avaliação registrada.",
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
};

export default async function DetalheDaOs({
  params,
  searchParams,
}: PageProps<"/servicos/ordens/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<OrdemDeServico>(`/ordens-de-servico/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const o = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const podeEditar = permissoes.includes("servicos.editar");
  return (
    <article className="max-w-5xl">
      <Link
        href="/servicos/ordens"
        className="text-sm text-texto-2 hover:underline"
      >
        Ordens de serviço
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4">
        <span className="font-mono text-lg text-texto-2">{o.numero}</span>
        <StatusDaOs status={o.status} atrasada={o.atrasada} />
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>{o.titulo}</h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <Dado rotulo="Cliente">
            <Link
              href={`/cadastros/clientes-e-fornecedores/${o.clienteId}`}
              className="text-info hover:underline"
            >
              {o.clienteNome}
            </Link>
          </Dado>
          <Dado rotulo="Responsável">{o.responsavel}</Dado>
          <Dado rotulo="Prazo">
            <span className={o.atrasada ? "text-nao-conforme" : ""}>
              {formatarData(o.prazo)}
              {o.atrasada && " · atrasada"}
            </span>
          </Dado>
          <Dado rotulo="O que será feito" largo>
            {o.descricao}
          </Dado>
          {o.iniciadaEm && (
            <Dado rotulo="Iniciada em">{formatarMomento(o.iniciadaEm)}</Dado>
          )}
          {o.concluidaEm && (
            <Dado rotulo="Concluída em">{formatarMomento(o.concluidaEm)}</Dado>
          )}
          {o.nota && (
            <Dado rotulo="Avaliação do cliente">
              {o.nota} de 5{o.comentario ? ` · ${o.comentario}` : ""}
            </Dado>
          )}
          {o.relatorio && (
            <Dado rotulo="Relatório" largo>
              {o.relatorio}
            </Dado>
          )}
          {o.motivoCancelamento && (
            <Dado rotulo="Motivo do cancelamento" largo>
              {o.motivoCancelamento}
            </Dado>
          )}
        </dl>
      </section>
      {podeEditar && o.status === "aberta" && <IniciarOs os={o} />}
      {podeEditar && o.status === "em_execucao" && <ConcluirOs os={o} />}
      {podeEditar && o.status === "concluida" && o.nota === null && (
        <AvaliarOs os={o} />
      )}
      <Anexos
        registro="ordem_de_servico"
        registroId={o.id}
        voltar={`/servicos/ordens/${o.id}`}
        podeEditar={podeEditar}
      />
      {permissoes.includes("servicos.excluir") &&
        (o.status === "aberta" || o.status === "em_execucao") && (
          <CancelarOs os={o} />
        )}
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
