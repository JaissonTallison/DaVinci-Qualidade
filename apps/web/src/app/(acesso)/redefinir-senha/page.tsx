import type { Metadata } from "next";
import Link from "next/link";
import { botaoLink } from "@/lib/estilos";
import { FormularioNovaSenha } from "./formulario-nova-senha";

export const metadata: Metadata = { title: "Criar nova senha" };

/** Aberta pelo link do e-mail (30 minutos, uso único). */
export default async function RedefinirSenha({
  searchParams,
}: PageProps<"/redefinir-senha">) {
  const { token } = (await searchParams) as { token?: string };
  return (
    <section>
      <h1 className="text-2xl text-texto">Criar nova senha</h1>
      {token ? (
        <>
          <p className="mt-1 text-base text-texto-2">
            Ao salvar, todas as sessões abertas com a senha antiga são
            encerradas.
          </p>
          <FormularioNovaSenha token={token} />
        </>
      ) : (
        <>
          <p className="mt-2 text-base text-texto-2">
            Este endereço está incompleto. Abra o link do e-mail de novo ou peça
            outro.
          </p>
          <Link
            href="/esqueci-a-senha"
            className={`${botaoLink} mt-4 inline-block`}
          >
            Pedir outro link
          </Link>
        </>
      )}
    </section>
  );
}
