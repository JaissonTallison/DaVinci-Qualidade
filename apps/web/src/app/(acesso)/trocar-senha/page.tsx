import type { Metadata } from "next";
import { CabecalhoDeAcesso } from "../campo-de-acesso";
import { FormularioSenha } from "./formulario-senha";

export const metadata: Metadata = { title: "Trocar a senha" };

export default async function TrocarSenha({
  searchParams,
}: PageProps<"/trocar-senha">) {
  const { origem } = (await searchParams) as { origem?: string };
  return (
    <section>
      <CabecalhoDeAcesso titulo="Trocar a senha">
        {origem === "conta"
          ? "Informe a senha atual e escolha a nova."
          : "Antes de continuar, troque a senha provisória por uma só sua."}
      </CabecalhoDeAcesso>
      <FormularioSenha />
    </section>
  );
}
