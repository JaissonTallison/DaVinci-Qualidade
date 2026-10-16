import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ELEMENTOS_DO_PPAP,
  MOTIVOS_DO_PPAP,
  STATUS_DO_ELEMENTO,
  STATUS_DO_PPAP,
  type DadosDoUsuario,
  type FmeaResumo,
  type PlanoDeControleResumo,
  type Ppap,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento, hojeEmBrasilia } from "@/lib/datas";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import { DecisaoDoCliente, EditorDoPpap, SubmeterPpap } from "../formularios";

export const metadata: Metadata = { title: "PPAP" };

const AVISOS = {
  salvo: "PPAP salvo.",
  submetido: "Submissão registrada.",
  decidido: "Decisão do cliente registrada.",
};

export default async function DetalheDoPpap({
  params,
  searchParams,
}: PageProps<"/qualidade/ppap/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, fmeas, planos, eu] = await Promise.all([
    chamarApi<Ppap>(`/ppaps/${id}`),
    chamarApi<FmeaResumo[]>("/fmeas"),
    chamarApi<PlanoDeControleResumo[]>("/planos-de-controle"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const p = r.dados;
  const podeEditar = eu.ok && eu.dados.permissoes.includes("qualidade.editar");
  const editavel = p.status === "em_preparacao" || p.status === "rejeitado";
  return (
    <article className="max-w-6xl">
      <Link
        href="/qualidade/ppap"
        className="text-sm text-texto-2 hover:underline"
      >
        PPAP
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-lg text-texto-2">{p.numero}</span>
        <span
          className={
            p.status === "rejeitado"
              ? "font-semibold text-nao-conforme"
              : p.status === "aprovado"
                ? "text-conforme"
                : ""
          }
        >
          {STATUS_DO_PPAP[p.status]}
        </span>
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>
        {p.peca}{" "}
        <span className="font-mono text-texto-2">{p.numeroDaPeca}</span>
      </h1>
      <p className="text-base text-texto-2">
        {p.cliente} · nível {p.nivel} · {MOTIVOS_DO_PPAP[p.motivo]}
        {p.submetidoEm && ` · submetido em ${formatarData(p.submetidoEm)}`}
      </p>
      <Aviso avisos={AVISOS} chave={aviso} />
      {p.parecer && (
        <section className={`${painel} mt-4 p-5`}>
          <h2 className={tituloDaSecao}>Parecer do cliente</h2>
          {p.decididoEm && (
            <p className="text-sm text-texto-2">
              {formatarMomento(p.decididoEm)}
            </p>
          )}
          <p className="mt-2 text-base whitespace-pre-line">{p.parecer}</p>
        </section>
      )}
      {podeEditar && editavel ? (
        <section className={`${painel} mt-6 p-5`}>
          <EditorDoPpap
            ppap={p}
            fmeas={fmeas.ok ? fmeas.dados : []}
            planos={planos.ok ? planos.dados : []}
          />
        </section>
      ) : (
        <section className={`${painel} mt-6`}>
          <h2 className={`${tituloDaSecao} px-5 pt-5`}>Elementos</h2>
          <ul className="mt-3 divide-y divide-borda border-t border-borda">
            {p.elementos.map((e) => (
              <li
                key={e.elemento}
                className="flex flex-wrap justify-between gap-2 px-5 py-2 text-sm"
              >
                <span>{ELEMENTOS_DO_PPAP[e.elemento]}</span>
                <span className="text-texto-2">
                  {STATUS_DO_ELEMENTO[e.status]}
                  {e.observacao && ` · ${e.observacao}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {podeEditar && p.status === "em_preparacao" && (
        <SubmeterPpap ppap={p} hoje={hojeEmBrasilia()} />
      )}
      {podeEditar && p.status === "submetido" && <DecisaoDoCliente ppap={p} />}
    </article>
  );
}
