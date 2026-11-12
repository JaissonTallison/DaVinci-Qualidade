import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { FormularioDeDocumento } from "./formulario";

export const metadata: Metadata = { title: "Novo documento" };

export default function NovoDocumento() {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{ href: "/sgi/documentos", rotulo: "Normas e procedimentos" }}
        titulo="Novo documento"
        descricao="O documento nasce como rascunho. Depois você o envia para revisão e um gestor que não seja você o aprova."
      />
      <FormularioDeDocumento />
    </>
  );
}
