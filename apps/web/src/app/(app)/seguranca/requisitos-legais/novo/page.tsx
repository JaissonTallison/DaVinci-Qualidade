import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { criarRequisitoSst } from "@/lib/acoes-requisitos-sst";
import { FormularioDeRequisitoSst } from "../formulario";

export const metadata: Metadata = { title: "Novo requisito legal de SST" };

export default function NovoRequisitoSst() {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{
          href: "/seguranca/requisitos-legais",
          rotulo: "Requisitos legais de SST",
        }}
        titulo="Novo requisito legal de SST"
      />
      <FormularioDeRequisitoSst acao={criarRequisitoSst} />
    </>
  );
}
