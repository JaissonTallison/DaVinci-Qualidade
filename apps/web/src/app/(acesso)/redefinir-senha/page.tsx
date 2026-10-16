import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoDeAcesso } from "../campo-de-acesso";
import { FormularioNovaSenha } from "./formulario-nova-senha";

export const metadata: Metadata = { title: "Criar nova senha" };

/** Aberta pelo link do e-mail (30 minutos, uso único). */
export default async function RedefinirSenha({
  searchParams,
}: PageProps<"/redefinir-senha">) {
  const { token } = (await searchParams) as { token?: string };
  return (
    <section>
      <CabecalhoDeAcesso titulo="Criar nova senha">
        {token
          ? "Ao salvar, todas as sessões abertas com a senha antiga são encerradas."
          : "Este endereço está incompleto. Abra o link do e-mail de novo ou peça outro."}
      </CabecalhoDeAcesso>
      {token ? (
        <FormularioNovaSenha token={token} />
      ) : (
        <Link href="/esqueci-a-senha" className="dv-acesso-botao mt-5">
          Pedir outro link
        </Link>
      )}
    </section>
  );
}
