import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import type { DadosDoUsuario, Fmea } from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { botaoSecundario, painel, tituloDaPagina } from "@/lib/estilos";
import { EditorDoFmea, MarcadorDeAp } from "../formularios";

export const metadata: Metadata = { title: "FMEA" };

export default async function DetalheDoFmea({
  params,
  searchParams,
}: PageProps<"/qualidade/fmea/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Fmea>(`/fmeas/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const f = r.dados;
  const podeEditar = eu.ok && eu.dados.permissoes.includes("qualidade.editar");
  return (
    <article>
      <Link
        href="/qualidade/fmea"
        className="dv-voltar"
      >
        FMEA de processo
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="font-mono text-lg text-texto-2">{f.numero}</span>
          <h1 className={tituloDaPagina}>{f.titulo}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/qualidade/planos-de-controle?fmea=${f.id}`}
            className={botaoSecundario}
          >
            Gerar plano de controle
          </Link>
          <Link
            href={`/qualidade/fmea/${f.id}/imprimir`}
            className={botaoSecundario}
          >
            <Printer aria-hidden size={16} strokeWidth={2} />
            Imprimir
          </Link>
        </div>
      </header>
      <Aviso avisos={{ salvo: "FMEA salvo." }} chave={aviso} />
      <section
        className={`${painel} mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 text-base`}
      >
        {(["H", "M", "L"] as const).map((ap) => (
          <span key={ap} className="inline-flex items-center gap-2">
            <MarcadorDeAp ap={ap} />{" "}
            <span className="tabular-nums">{f.contagem[ap]}</span>
          </span>
        ))}
        <span
          className={
            f.acoesAltasAbertas
              ? "font-semibold text-nao-conforme"
              : "text-texto-2"
          }
        >
          {f.acoesAltasAbertas} ação(ões) de AP alta em aberto
        </span>
      </section>
      <section className={`${painel} mt-4 p-5`}>
        {podeEditar ? (
          <EditorDoFmea fmea={f} />
        ) : (
          <p className="text-base text-texto-2">
            Consulte o FMEA na versão para imprimir.
          </p>
        )}
      </section>
    </article>
  );
}
