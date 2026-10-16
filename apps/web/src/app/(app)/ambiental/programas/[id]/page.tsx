import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  INDICADORES_DO_PROGRAMA,
  type DadosDoUsuario,
  type ProgramaAmbiental,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import { EditarPrograma, MedirPrograma } from "../formularios";

export const metadata: Metadata = { title: "Programa ambiental" };
const n = (v: number | null) =>
  v === null ? "—" : v.toLocaleString("pt-BR", { maximumFractionDigits: 3 });

export default async function DetalheDoPrograma({
  params,
  searchParams,
}: PageProps<"/ambiental/programas/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<ProgramaAmbiental>(`/programas-ambientais/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const p = r.dados;
  const podeEditar = eu.ok && eu.dados.permissoes.includes("ambiental.editar");
  return (
    <article className="max-w-5xl">
      <Link
        href="/ambiental/programas"
        className="text-sm text-texto-2 hover:underline"
      >
        Programas e metas ambientais
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>{p.nome}</h1>
      <Aviso
        avisos={{
          criado: "Programa criado.",
          salvo: "Programa salvo.",
          medido: "Medição registrada.",
        }}
        chave={aviso}
      />
      <section
        className={`${painel} mt-6 grid gap-x-8 gap-y-4 p-5 sm:grid-cols-4`}
      >
        <Dado rotulo="Indicador">{INDICADORES_DO_PROGRAMA[p.indicador]}</Dado>
        <Dado rotulo={`Linha de base (${p.anoBase})`}>
          {n(p.linhaDeBase)} {p.unidade}
        </Dado>
        <Dado rotulo={`Meta até ${formatarData(p.prazo)}`}>
          {n(p.meta)} {p.unidade}
        </Dado>
        <Dado rotulo="Atual">
          <span className="font-semibold">{n(p.atual)}</span> {p.unidade}
          {p.progresso !== null && (
            <span
              className={`block text-sm ${p.progresso >= 100 ? "text-conforme" : "text-texto-2"}`}
            >
              {p.progresso}% do caminho
            </span>
          )}
        </Dado>
        <Dado rotulo="Responsável">{p.responsavel}</Dado>
        <div className="sm:col-span-3">
          <dt className="text-xs text-texto-2">Objetivo</dt>
          <dd className="mt-0.5 text-base">{p.objetivo}</dd>
        </div>
      </section>
      {p.acoes.length > 0 && (
        <section className={`${painel} mt-6`}>
          <h2 className={`${tituloDaSecao} px-5 pt-5`}>Ações</h2>
          <ul className="mt-3 divide-y divide-borda border-t border-borda text-sm">
            {p.acoes.map((a, i) => (
              <li
                key={i}
                className="flex flex-wrap justify-between gap-2 px-5 py-2"
              >
                <span
                  className={a.concluida ? "text-texto-3 line-through" : ""}
                >
                  {a.oQue}
                </span>
                <span className="text-texto-2">
                  {a.responsavel}
                  {a.prazo && ` · ${formatarData(a.prazo)}`}
                  {a.concluida && " · concluída"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {p.indicador === "manual" && p.medicoes.length > 0 && (
        <section className={`${painel} mt-6 p-5`}>
          <h2 className={tituloDaSecao}>Medições</h2>
          <p className="mt-2 text-sm">
            {p.medicoes
              .map((m) => `${m.competencia}: ${n(m.valor)}`)
              .join(" · ")}
          </p>
        </section>
      )}
      {podeEditar && p.indicador === "manual" && !p.encerrado && (
        <MedirPrograma p={p} mes={hojeEmBrasilia().slice(0, 7)} />
      )}
      {podeEditar && (
        <Recolhido titulo="Editar programa">
          <EditarPrograma p={p} />
        </Recolhido>
      )}
    </article>
  );
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd className="mt-0.5 text-base">{children}</dd>
    </div>
  );
}
