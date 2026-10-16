import type { Metadata } from "next";
import Link from "next/link";
import { NORMAS, type EvidenciaDaBiblioteca } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { BotaoImprimir } from "@/components/botao-imprimir";
import { filtrosDaBiblioteca } from "../filtros";
import { ListaDeEvidencias } from "../lista";

export const metadata: Metadata = { title: "Evidências para imprimir" };

/** Lista filtrada da biblioteca, aberta, para levar impressa a campo. */
export default async function ImprimirBiblioteca({
  searchParams,
}: PageProps<"/auditorias/biblioteca/imprimir">) {
  const f = (await searchParams) as Record<string, string | undefined>;
  const filtro = filtrosDaBiblioteca(f);
  const r = await chamarApi<EvidenciaDaBiblioteca[]>(
    `/evidencias-de-auditoria?${filtro}`,
  );
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  return (
    <article className="mx-auto max-w-4xl bg-superficie print:max-w-none">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/auditorias/biblioteca?${filtro}`}
          className="text-sm text-texto-2 hover:underline"
        >
          Voltar à biblioteca
        </Link>
        <BotaoImprimir />
      </div>
      <header className="border-b-2 border-texto pb-3">
        <h1 className="font-serif text-2xl">
          Evidências objetivas por cláusula
        </h1>
        <p className="mt-1 text-sm text-texto-2">
          {f.norma ? NORMAS[f.norma as keyof typeof NORMAS] : "Todas as normas"}
          {f.clausula && ` · cláusula ${f.clausula}`}
          {f.busca && ` · "${f.busca}"`} · {r.dados.length} evidências
        </p>
      </header>
      <ListaDeEvidencias evidencias={r.dados} impressao />
    </article>
  );
}
