import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { DadosDoUsuario, ModeloDeInspecao } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeModelo } from "../formulario";
import { SituacaoDoModelo } from "./situacao";

export const metadata: Metadata = { title: "Modelo de inspeção" };

export default async function EditarModelo({
  params,
}: PageProps<"/qualidade/modelos-de-inspecao/[id]">) {
  const { id } = await params;
  const [r, eu] = await Promise.all([
    chamarApi<ModeloDeInspecao>(`/modelos-de-inspecao/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  return (
    <>
      <Link
        href="/qualidade/modelos-de-inspecao"
        className="text-sm text-texto-2 hover:underline"
      >
        Modelos de inspeção
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>
        {r.dados.nome}
        {!r.dados.ativo && (
          <span className="ml-3 align-middle font-sans text-base text-texto-3">
            inativo
          </span>
        )}
      </h1>
      {permissoes.includes("qualidade.editar") && (
        <FormularioDeModelo modelo={r.dados} />
      )}
      {permissoes.includes("qualidade.excluir") && (
        <SituacaoDoModelo modelo={r.dados} />
      )}
    </>
  );
}
