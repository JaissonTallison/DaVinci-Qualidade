import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { FormularioDeInstrumento } from "../formulario";

export const metadata: Metadata = { title: "Cadastrar instrumento" };

export default function NovoInstrumento() {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{ href: "/qualidade/calibracao", rotulo: "Calibração" }}
        titulo="Cadastrar instrumento"
        descricao="Depois do cadastro, registre a última calibração: a próxima é calculada pela frequência."
      />
      <FormularioDeInstrumento />
    </>
  );
}
