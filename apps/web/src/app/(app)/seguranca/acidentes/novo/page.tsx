import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { hojeEmBrasilia } from "@/lib/datas";
import { FormularioDeAcidente } from "../formulario";

export const metadata: Metadata = { title: "Registrar acidente" };

export default function NovoAcidente() {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{ href: "/seguranca/acidentes", rotulo: "Acidentes" }}
        titulo="Registrar acidente, incidente ou quase-acidente"
        descricao="Registre no mesmo dia. Acidente com lesão gera CAT até o primeiro dia útil seguinte; a investigação vem depois."
      />
      <FormularioDeAcidente hoje={hojeEmBrasilia()} />
    </>
  );
}
