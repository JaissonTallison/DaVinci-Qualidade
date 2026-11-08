import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { FormularioDeParceiro } from "../formulario";

export const metadata: Metadata = { title: "Cadastrar cliente ou fornecedor" };

export default function NovoParceiro() {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{
          href: "/cadastros/clientes-e-fornecedores",
          rotulo: "Clientes e fornecedores",
        }}
        titulo="Cadastrar cliente ou fornecedor"
        descricao="Identificação e contato da empresa ou pessoa. Usado em Serviços e na avaliação de fornecedores."
      />
      <FormularioDeParceiro />
    </>
  );
}
