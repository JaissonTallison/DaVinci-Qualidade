import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  GRUPOS_DE_RISCO,
  PROBABILIDADES,
  SEVERIDADES,
  type DadosDoUsuario,
  type Risco,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { NivelDoRisco } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { FormularioDeRisco } from "../formulario";
import { SituacaoDoRisco } from "./situacao";

export const metadata: Metadata = { title: "Risco" };

const AVISOS: Record<string, string> = {
  criado: "Risco cadastrado no inventário.",
  salvo: "Avaliação salva.",
  eliminado: "Risco marcado como eliminado: ele sai do inventário ativo.",
  reativado: "Risco de volta ao inventário.",
};

export default async function DetalheDoRisco({
  params,
  searchParams,
}: PageProps<"/seguranca/pgr/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Risco>(`/riscos/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const x = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  return (
    <article className="max-w-5xl">
      <Link
        href="/seguranca/pgr"
        className="text-sm text-texto-2 hover:underline"
      >
        PGR
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <NivelDoRisco nivel={x.nivel} />
        <span className="text-texto-2">
          {GRUPOS_DE_RISCO[x.grupo]} · {x.local}
          {x.ativo ? "" : " · Eliminado"}
        </span>
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>{x.perigo}</h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <Dado rotulo="Possíveis danos" largo>
            {x.danos}
          </Dado>
          <Dado rotulo="Severidade">
            {x.severidade} · {SEVERIDADES[x.severidade as 1]}
          </Dado>
          <Dado rotulo="Probabilidade">
            {x.probabilidade} · {PROBABILIDADES[x.probabilidade as 1]}
          </Dado>
          <Dado rotulo="Última revisão">{formatarMomento(x.revisadoEm)}</Dado>
          {x.controles && (
            <Dado rotulo="Controles existentes" largo>
              {x.controles}
            </Dado>
          )}
          {x.acoes && (
            <Dado rotulo="Medidas a implementar" largo>
              {x.acoes}
            </Dado>
          )}
          {x.responsavel && <Dado rotulo="Responsável">{x.responsavel}</Dado>}
          {x.prazo && (
            <Dado rotulo="Prazo">
              <span className={x.acaoVencida ? "text-nao-conforme" : ""}>
                {formatarData(x.prazo)}
                {x.acaoVencida && " · vencido"}
              </span>
            </Dado>
          )}
        </dl>
      </section>
      {x.ativo && permissoes.includes("seguranca.editar") && (
        <Recolhido titulo="Reavaliar ou corrigir">
          <FormularioDeRisco risco={x} embutido />
        </Recolhido>
      )}
      {permissoes.includes("seguranca.excluir") && (
        <SituacaoDoRisco risco={x} />
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
