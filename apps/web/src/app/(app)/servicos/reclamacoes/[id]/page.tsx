import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  CANAIS_DE_RECLAMACAO,
  STATUS_DA_RECLAMACAO,
  type DadosDoUsuario,
  type Reclamacao,
} from "@davinci/types";
import { Anexos } from "@/components/anexos";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import {
  AnalisarReclamacao,
  EncerrarReclamacao,
  ResponderReclamacao,
} from "../formularios";
import { LinhaDoTempoDaReclamacao } from "./linha-do-tempo";

export const metadata: Metadata = { title: "Reclamação" };
const AVISOS = {
  registrada: "Reclamação registrada.",
  analisada: "Análise registrada.",
  respondida: "Resposta registrada.",
  encerrada: "Reclamação encerrada.",
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
};

export default async function DetalheDaReclamacao({
  params,
  searchParams,
}: PageProps<"/servicos/reclamacoes/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Reclamacao>(`/reclamacoes/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const x = r.dados;
  const podeEditar = eu.ok && eu.dados.permissoes.includes("servicos.editar");
  return (
    <article>
      <Link
        href="/servicos/reclamacoes"
        className="dv-voltar"
      >
        Reclamações de clientes
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4">
        <span className="font-mono text-lg text-texto-2">{x.numero}</span>
        <span className={x.atrasada ? "font-semibold text-nao-conforme" : ""}>
          {STATUS_DA_RECLAMACAO[x.status]}
          {x.atrasada && " · resposta atrasada"}
        </span>
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>{x.clienteNome}</h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      <section className={`${painel} mt-6 p-5`}>
        <h2 className={tituloDaSecao}>Linha do tempo</h2>
        <LinhaDoTempoDaReclamacao r={x} />
      </section>
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-4">
          <Dado rotulo="Canal">{CANAIS_DE_RECLAMACAO[x.canal]}</Dado>
          <Dado rotulo="Recebida em">{formatarData(x.recebidaEm)}</Dado>
          <Dado rotulo="Responder até">{formatarData(x.prazoResposta)}</Dado>
          {x.osId && (
            <Dado rotulo="Ordem de serviço">
              <Link
                href={`/servicos/ordens/${x.osId}`}
                className="font-mono text-info hover:underline"
              >
                {x.osNumero}
              </Link>
            </Dado>
          )}
          {x.produto && <Dado rotulo="Produto ou serviço">{x.produto}</Dado>}
          <Dado rotulo="Relato do cliente" largo>
            {x.descricao}
          </Dado>
          {x.analise && (
            <Dado
              rotulo={`Análise · ${x.procedente ? "procedente" : "improcedente"}`}
              largo
            >
              {x.analise}
            </Dado>
          )}
          {x.ncId && (
            <Dado rotulo="Não conformidade">
              <Link
                href={`/qualidade/nao-conformidades/${x.ncId}`}
                className="font-mono text-info hover:underline"
              >
                {x.ncNumero}
              </Link>
            </Dado>
          )}
          {x.resposta && (
            <Dado
              rotulo={`Resposta · ${x.respondidaEm ? formatarData(x.respondidaEm) : ""}`}
              largo
            >
              {x.resposta}
            </Dado>
          )}
          {x.clienteSatisfeito !== null && (
            <Dado rotulo="Cliente satisfeito" largo>
              {x.clienteSatisfeito ? "Sim" : "Não"}
              {x.observacaoEncerramento && ` · ${x.observacaoEncerramento}`}
            </Dado>
          )}
        </dl>
      </section>
      {podeEditar && (x.status === "aberta" || x.status === "analisada") && (
        <AnalisarReclamacao r={x} />
      )}
      {podeEditar && x.status === "analisada" && <ResponderReclamacao r={x} />}
      {podeEditar && x.status === "respondida" && <EncerrarReclamacao r={x} />}
      <Anexos
        registro="reclamacao"
        registroId={x.id}
        voltar={`/servicos/reclamacoes/${x.id}`}
        podeEditar={podeEditar}
      />
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
    <div className={largo ? "sm:col-span-4" : ""}>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd className="mt-0.5 text-base whitespace-pre-line">{children}</dd>
    </div>
  );
}
