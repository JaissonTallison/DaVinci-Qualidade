import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { criarRequisito } from "@/lib/acoes-ambiental";
import { FormularioDeRequisito } from "../formulario";

export const metadata: Metadata = { title: "Novo requisito legal" };

export default function NovoRequisito() {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{ href: "/ambiental/requisitos", rotulo: "Requisitos legais" }}
        titulo="Novo requisito legal"
      />
      <FormularioDeRequisito acao={criarRequisito} />
    </>
  );
}
