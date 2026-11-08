import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { FormularioDeLicenca } from "./formulario";

export const metadata: Metadata = { title: "Nova licença" };

export default function NovaLicenca() {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{ href: "/ambiental/licencas", rotulo: "Licenças" }}
        titulo="Nova licença ou autorização"
      />
      <FormularioDeLicenca />
    </>
  );
}
