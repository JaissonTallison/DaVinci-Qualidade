import type { Metadata } from "next";
import { FormularioSenha } from "./formulario-senha";

export const metadata: Metadata = { title: "Trocar a senha" };

export default async function TrocarSenha({
  searchParams,
}: PageProps<"/trocar-senha">) {
  const { origem } = (await searchParams) as { origem?: string };
  return (
    <section>
      <h1 className="text-2xl text-texto">Trocar a senha</h1>
      <p className="mt-2 text-base text-texto-2">
        {origem === "conta"
          ? "Informe a senha atual e escolha a nova."
          : "Antes de continuar, troque a senha provisória por uma só sua."}
      </p>
      <FormularioSenha />
    </section>
  );
}
