import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type Processo } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { chamarApi } from "@/lib/api";
import { FormularioDeProcesso } from "../../novo/formulario";

export const metadata: Metadata = { title: "Editar processo" };

export default async function EditarProcesso({
  params,
}: PageProps<"/qualidade/processos/[id]/editar">) {
  const { id } = await params;
  const r = await chamarApi<Processo>(`/processos/${id}`);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const p = r.dados;
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{ href: `/qualidade/processos/${id}`, rotulo: p.codigo }}
        titulo="Editar processo"
        descricao="Edição permitida enquanto o processo está em elaboração ou em revisão."
      />
      <FormularioDeProcesso processo={p} />
    </>
  );
}
