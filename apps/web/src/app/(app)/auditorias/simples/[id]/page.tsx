import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import type { AuditoriaSimples, DadosDoUsuario } from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { excluirAuditoriaSimples } from "@/lib/acoes-auditoria-simples";
import { chamarApi } from "@/lib/api";
import { botaoSecundario, painel, tituloDaPagina } from "@/lib/estilos";
import { FormularioDaAuditoriaSimples } from "../formulario";

export const metadata: Metadata = { title: "Auditoria interna simples" };

const AVISOS: Record<string, string> = {
  salvo: "Auditoria salva.",
  "erro-excluir": "Não foi possível excluir. Tente de novo.",
};

export default async function EditarAuditoriaSimples({
  params,
  searchParams,
}: PageProps<"/auditorias/simples/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [a, eu] = await Promise.all([
    chamarApi<AuditoriaSimples>(`/auditorias-simples/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!a.ok && a.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!a.ok) return <AvisoDeErro erro={a.erro} />;
  const podeEditar =
    eu.ok && eu.dados.permissoes.includes("auditorias.editar");

  return (
    <>
      <Link href="/auditorias/simples" className="dv-voltar">
        Auditorias internas simples
      </Link>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <h1 className={tituloDaPagina}>
          Auditoria interna simples{" "}
          <span className="font-mono text-texto-2">{a.dados.numero}</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/auditorias/simples/${id}/imprimir`}
            className={botaoSecundario}
          >
            <Printer aria-hidden size={16} strokeWidth={2} />
            Imprimir / PDF
          </Link>
          {podeEditar && (
            <form action={excluirAuditoriaSimples.bind(null, id)}>
              <button type="submit" className={botaoSecundario}>
                Excluir
              </button>
            </form>
          )}
        </div>
      </div>
      <Aviso avisos={AVISOS} chave={aviso} />
      <div className={`${painel} mt-6 p-5`}>
        <FormularioDaAuditoriaSimples auditoria={a.dados} />
      </div>
    </>
  );
}
