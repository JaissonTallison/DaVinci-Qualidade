import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type Documento } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { chamarApi } from "@/lib/api";
import { FormularioDeDocumento } from "../../nova/formulario";

export const metadata: Metadata = { title: "Editar documento" };

export default async function EditarDocumento({
  params,
}: PageProps<"/sgi/documentos/[id]/editar">) {
  const { id } = await params;
  const r = await chamarApi<Documento>(`/documentos/${id}`);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const d = r.dados;
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{ href: `/sgi/documentos/${id}`, rotulo: d.codigo }}
        titulo="Editar documento"
        descricao="Edição permitida enquanto o documento está em rascunho ou em revisão."
      />
      <FormularioDeDocumento documento={d} />
    </>
  );
}
