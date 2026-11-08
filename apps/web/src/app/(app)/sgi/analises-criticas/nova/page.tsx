import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { FormularioDeAnalise } from "./formulario";

export const metadata: Metadata = { title: "Registrar análise crítica" };

export default function NovaAnalise() {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{ href: "/sgi/analises-criticas", rotulo: "Análises críticas" }}
        titulo="Registrar análise crítica"
      />
      <FormularioDeAnalise />
    </>
  );
}
