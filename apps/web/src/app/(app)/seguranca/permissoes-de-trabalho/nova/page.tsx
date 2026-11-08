import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { FormularioDePt } from "./formulario";

export const metadata: Metadata = { title: "Solicitar permissão de trabalho" };

export default function NovaPt() {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{
          href: "/seguranca/permissoes-de-trabalho",
          rotulo: "Permissões de trabalho",
        }}
        titulo="Solicitar permissão de trabalho"
        descricao="O serviço só começa depois que outra pessoa autorizada liberar a PT. Ela vale por uma jornada."
      />
      <FormularioDePt />
    </>
  );
}
