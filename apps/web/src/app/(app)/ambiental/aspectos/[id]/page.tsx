import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  INCIDENCIAS,
  SITUACOES_OPERACIONAIS,
  type AspectoAmbiental,
  type DadosDoUsuario,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { SignificanciaDoAspecto } from "@/components/marcadores-ambientais";
import { atualizarAspecto } from "@/lib/acoes-ambiental";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { FormularioDeAspecto } from "../formulario";
import { SituacaoDoAspecto } from "./situacao";

export const metadata: Metadata = { title: "Aspecto ambiental" };
const AVISOS: Record<string, string> = {
  criado: "Aspecto cadastrado.",
  salvo: "Alterações salvas.",
  inativado: "Aspecto inativado: sai do levantamento e dos prazos.",
  reativado: "Aspecto reativado.",
};

export default async function DetalheDoAspecto({
  params,
  searchParams,
}: PageProps<"/ambiental/aspectos/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<AspectoAmbiental>(`/aspectos-ambientais/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const a = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  return (
    <article className="max-w-5xl">
      <Link
        href="/ambiental/aspectos"
        className="text-sm text-texto-2 hover:underline"
      >
        Aspectos e impactos
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4">
        <SignificanciaDoAspecto
          significancia={a.significancia}
          significativo={a.significativo}
        />
        {!a.ativo && <span className="text-texto-2">Inativo</span>}
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>
        {a.atividade} · {a.aspecto}
      </h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <Dado rotulo="Impacto" largo>
            {a.impacto}
          </Dado>
          <Dado rotulo="Situação">{SITUACOES_OPERACIONAIS[a.situacao]}</Dado>
          <Dado rotulo="Incidência">{INCIDENCIAS[a.incidencia]}</Dado>
          <Dado rotulo="Severidade × frequência">
            {a.severidade} × {a.frequencia} = {a.severidade * a.frequencia}
            {a.requisitoLegal && " · com requisito legal"}
          </Dado>
          {a.controles && (
            <Dado rotulo="Controles existentes" largo>
              {a.controles}
            </Dado>
          )}
          {a.acoes && (
            <Dado rotulo="Ações de controle" largo>
              {a.acoes}
            </Dado>
          )}
          {a.responsavel && <Dado rotulo="Responsável">{a.responsavel}</Dado>}
          {a.prazo && (
            <Dado rotulo="Prazo">
              <span className={a.prazoVencido ? "text-nao-conforme" : ""}>
                {formatarData(a.prazo)}
                {a.prazoVencido && " · vencido"}
              </span>
            </Dado>
          )}
        </dl>
      </section>
      {permissoes.includes("ambiental.editar") && a.ativo && (
        <Recolhido titulo="Editar o aspecto">
          <FormularioDeAspecto
            acao={atualizarAspecto.bind(null, a.id)}
            aspecto={a}
          />
        </Recolhido>
      )}
      {permissoes.includes("ambiental.excluir") && (
        <SituacaoDoAspecto aspecto={a} />
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
