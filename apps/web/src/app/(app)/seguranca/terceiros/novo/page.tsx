import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { FormularioDeTerceiro } from "../formulario";

export const metadata: Metadata = { title: "Cadastrar terceiro" };

export default function NovoTerceiro() {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{ href: "/seguranca/terceiros", rotulo: "Terceiros" }}
        titulo="Cadastrar terceiro"
        descricao="Depois do cadastro, registre os documentos de SST. Sem PGR, PCMSO e ASO válidos, a terceira fica com pendência."
      />
      <FormularioDeTerceiro />
    </>
  );
}
