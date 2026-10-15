import type { Metadata } from "next";
import { FormularioEntrar } from "./formulario-entrar";

export const metadata: Metadata = { title: "Entrar" };

const AVISOS: Record<string, string> = {
  "sessao-encerrada": "Sua sessão foi encerrada. Entre novamente.",
};

export default async function Entrar({ searchParams }: PageProps<"/entrar">) {
  const { volta, aviso } = (await searchParams) as {
    volta?: string;
    aviso?: string;
  };
  return (
    <section>
      <h1 className="text-2xl text-texto">Entrar</h1>
      {aviso && AVISOS[aviso] && (
        <p
          role="status"
          className="mt-4 rounded-sm border border-borda bg-superficie px-4 py-2.5 text-base text-texto-2"
        >
          {AVISOS[aviso]}
        </p>
      )}
      <FormularioEntrar volta={volta} />
      <p className="mt-6 text-sm text-texto-3">
        Esqueceu a senha ou ainda não tem acesso? Fale com o administrador da
        sua empresa.
      </p>
    </section>
  );
}
