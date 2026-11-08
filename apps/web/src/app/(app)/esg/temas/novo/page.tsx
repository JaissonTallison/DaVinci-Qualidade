import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { criarTema } from "@/lib/acoes-esg";
import { FormularioDeTema } from "../formulario";

export const metadata: Metadata = { title: "Novo tema ESG" };

export default function NovoTema() {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{ href: "/esg/temas", rotulo: "Temas ESG" }}
        titulo="Novo tema ESG"
      />
      <FormularioDeTema acao={criarTema} />
    </>
  );
}
