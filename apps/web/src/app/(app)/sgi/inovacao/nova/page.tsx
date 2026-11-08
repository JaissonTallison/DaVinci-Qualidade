import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { FormularioDeInovacao } from "./formulario";

export const metadata: Metadata = { title: "Propor inovação" };

export default function NovaInovacao() {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{ href: "/sgi/inovacao", rotulo: "Gestão de inovação" }}
        titulo="Propor inovação"
        descricao="Um gestor que não seja você avalia e aprova ou reprova; depois de implementada, registre os resultados obtidos."
      />
      <FormularioDeInovacao />
    </>
  );
}
