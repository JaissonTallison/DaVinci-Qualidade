import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { FormularioDeModelo } from "../formulario";

export const metadata: Metadata = { title: "Criar modelo de inspeção" };

export default function NovoModelo() {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{
          href: "/qualidade/modelos-de-inspecao",
          rotulo: "Modelos de inspeção",
        }}
        titulo="Criar modelo de inspeção"
      />
      <FormularioDeModelo />
    </>
  );
}
