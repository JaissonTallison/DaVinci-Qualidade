import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { criarAspecto } from "@/lib/acoes-ambiental";
import { FormularioDeAspecto } from "../formulario";

export const metadata: Metadata = { title: "Novo aspecto ambiental" };

export default function NovoAspecto() {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{ href: "/ambiental/aspectos", rotulo: "Aspectos e impactos" }}
        titulo="Novo aspecto ambiental"
      />
      <FormularioDeAspecto acao={criarAspecto} />
    </>
  );
}
