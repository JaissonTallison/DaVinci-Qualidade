import type { Metadata } from "next";
import { FormularioSenha } from "./formulario-senha";

export const metadata: Metadata = { title: "Trocar a senha" };

export default function TrocarSenha() {
  return (
    <section>
      <h1 className="text-2xl text-texto">Trocar a senha</h1>
      <p className="mt-2 text-base text-texto-2">
        Antes de continuar, troque a senha provisória por uma só sua.
      </p>
      <FormularioSenha />
    </section>
  );
}
