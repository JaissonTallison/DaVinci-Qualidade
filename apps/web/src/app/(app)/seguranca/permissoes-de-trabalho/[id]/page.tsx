import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  TIPOS_PT,
  type DadosDoUsuario,
  type PermissaoDeTrabalho,
} from "@davinci/types";
import { Anexos } from "@/components/anexos";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { StatusDaPt } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarMomento } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { periodoDaPt } from "../periodo";
import { CancelarPt, EncerrarPt, LiberarPt } from "./acoes";

export const metadata: Metadata = { title: "Permissão de trabalho" };

const AVISOS: Record<string, string> = {
  solicitada: "PT solicitada. Agora outra pessoa autorizada precisa liberá-la.",
  liberada: "PT liberada: o serviço pode começar.",
  encerrada: "PT encerrada.",
  cancelada: "PT cancelada.",
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
};

export default async function DetalheDaPt({
  params,
  searchParams,
}: PageProps<"/seguranca/permissoes-de-trabalho/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<PermissaoDeTrabalho>(`/permissoes-de-trabalho/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const pt = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const podeEditar = permissoes.includes("seguranca.editar");
  const aberta = pt.status === "solicitada" || pt.status === "liberada";
  return (
    <article className="max-w-5xl">
      <Link
        href="/seguranca/permissoes-de-trabalho"
        className="text-sm text-texto-2 hover:underline"
      >
        Permissões de trabalho
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-lg text-texto-2">{pt.numero}</span>
        <StatusDaPt status={pt.status} vencida={pt.vencida} />
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>
        {TIPOS_PT[pt.tipo]} · {pt.local}
      </h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <Dado rotulo="Serviço" largo>
            {pt.servico}
          </Dado>
          <Dado rotulo="Executantes" largo>
            {pt.executantes}
          </Dado>
          <Dado rotulo="Período">{periodoDaPt(pt.inicio, pt.fim)}</Dado>
          {pt.liberadaEm && (
            <Dado rotulo="Liberada em">{formatarMomento(pt.liberadaEm)}</Dado>
          )}
          {pt.encerradaEm && (
            <Dado rotulo="Encerrada em">{formatarMomento(pt.encerradaEm)}</Dado>
          )}
          <Dado rotulo="Riscos e medidas de controle" largo>
            {pt.riscos}
          </Dado>
          {pt.epis && (
            <Dado rotulo="EPIs exigidos" largo>
              {pt.epis}
            </Dado>
          )}
          {pt.observacaoEncerramento && (
            <Dado rotulo="Observação do encerramento" largo>
              {pt.observacaoEncerramento}
            </Dado>
          )}
          {pt.motivoCancelamento && (
            <Dado rotulo="Motivo do cancelamento" largo>
              {pt.motivoCancelamento}
            </Dado>
          )}
        </dl>
      </section>
      {pt.status === "solicitada" &&
        permissoes.includes("seguranca.liberar-pt") &&
        !pt.solicitadaPorMim && <LiberarPt pt={pt} />}
      {pt.status === "solicitada" && pt.solicitadaPorMim && (
        <p className="mt-6 text-base text-texto-2">
          Você solicitou esta PT: a liberação é feita por outra pessoa
          autorizada.
        </p>
      )}
      {pt.status === "liberada" && podeEditar && <EncerrarPt pt={pt} />}
      <Anexos
        registro="permissao_de_trabalho"
        registroId={pt.id}
        voltar={`/seguranca/permissoes-de-trabalho/${pt.id}`}
        podeEditar={podeEditar}
      />
      {aberta && podeEditar && <CancelarPt pt={pt} />}
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
