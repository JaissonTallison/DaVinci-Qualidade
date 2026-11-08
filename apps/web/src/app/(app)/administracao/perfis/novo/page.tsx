import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { FormularioDePerfil } from "../formulario";

export const metadata: Metadata = { title: "Criar perfil" };

export default function NovoPerfil() {
  return (
    <div className="w-full">
      <CabecalhoDeCadastro
        voltar={{ href: "/administracao/perfis", rotulo: "Perfis de acesso" }}
        titulo="Criar perfil"
        descricao="Defina o que quem tiver este perfil pode ver e fazer no sistema."
      />
      <FormularioDePerfil />
    </div>
  );
}
