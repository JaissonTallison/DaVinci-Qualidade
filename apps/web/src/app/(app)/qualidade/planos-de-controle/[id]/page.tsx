import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import {
  FASES_DO_PLANO_DE_CONTROLE,
  type DadosDoUsuario,
  type FmeaResumo,
  type PlanoDeControle,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { botaoSecundario, painel, tituloDaPagina } from "@/lib/estilos";
import { EditorDoPlanoDeControle } from "../formularios";

export const metadata: Metadata = { title: "Plano de controle" };

export default async function DetalheDoPlanoDeControle({
  params,
  searchParams,
}: PageProps<"/qualidade/planos-de-controle/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, fmeas, eu] = await Promise.all([
    chamarApi<PlanoDeControle>(`/planos-de-controle/${id}`),
    chamarApi<FmeaResumo[]>("/fmeas"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const p = r.dados;
  const podeEditar = eu.ok && eu.dados.permissoes.includes("qualidade.editar");
  return (
    <article>
      <Link
        href="/qualidade/planos-de-controle"
        className="text-sm text-texto-2 hover:underline"
      >
        Planos de controle
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="font-mono text-lg text-texto-2">{p.numero}</span>
          <h1 className={tituloDaPagina}>{p.titulo}</h1>
          <p className="text-base text-texto-2">
            {p.item} · {FASES_DO_PLANO_DE_CONTROLE[p.fase]}
            {p.fmeaId && (
              <>
                {" · "}
                <Link
                  href={`/qualidade/fmea/${p.fmeaId}`}
                  className="text-info hover:underline"
                >
                  {p.fmeaNumero}
                </Link>
              </>
            )}
          </p>
        </div>
        <Link
          href={`/qualidade/planos-de-controle/${p.id}/imprimir`}
          className={botaoSecundario}
        >
          <Printer aria-hidden size={16} strokeWidth={2} />
          Imprimir
        </Link>
      </header>
      <Aviso avisos={{ salvo: "Plano de controle salvo." }} chave={aviso} />
      <section className={`${painel} mt-4 p-5`}>
        {podeEditar ? (
          <EditorDoPlanoDeControle
            plano={p}
            fmeas={fmeas.ok ? fmeas.dados : []}
          />
        ) : (
          <p className="text-base text-texto-2">
            Consulte o plano na versão para imprimir.
          </p>
        )}
      </section>
    </article>
  );
}
