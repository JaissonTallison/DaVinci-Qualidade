import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { FormularioDeProcesso } from "./formulario";

export const metadata: Metadata = { title: "Novo processo" };

export default function NovoProcesso() {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{ href: "/qualidade/processos", rotulo: "Modelagem de processos" }}
        titulo="Novo processo"
        descricao="O processo nasce em elaboração. Depois você o envia para revisão e um gestor que não seja você o aprova e publica."
      />
      <FormularioDeProcesso />
    </>
  );
}
