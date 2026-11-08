import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { criarProduto } from "@/lib/acoes-ambiental";
import { FormularioDeProduto } from "../formulario";

export const metadata: Metadata = { title: "Novo produto químico" };

export default function NovoProduto() {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{
          href: "/ambiental/produtos-quimicos",
          rotulo: "Produtos químicos",
        }}
        titulo="Novo produto químico"
      />
      <FormularioDeProduto acao={criarProduto} />
    </>
  );
}
