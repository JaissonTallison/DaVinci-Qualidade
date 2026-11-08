import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { FormularioDeRisco } from "../formulario";

export const metadata: Metadata = { title: "Cadastrar risco" };

export default function NovoRisco() {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{ href: "/seguranca/pgr", rotulo: "PGR" }}
        titulo="Cadastrar risco"
        descricao="Risco alto ou crítico entra com plano: o que será feito, por quem e até quando (NR-1)."
      />
      <FormularioDeRisco />
    </>
  );
}
