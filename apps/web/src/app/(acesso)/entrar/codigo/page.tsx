import type { Metadata } from "next";
import { FormularioCodigo } from "./formulario-codigo";

export const metadata: Metadata = { title: "Código de verificação" };

export default async function Codigo({
  searchParams,
}: PageProps<"/entrar/codigo">) {
  const { volta } = (await searchParams) as { volta?: string };
  return (
    <section>
      <h1 className="text-2xl text-texto">Código de verificação</h1>
      <p className="mt-2 text-base text-texto-2">
        Digite o código de 6 dígitos do aplicativo autenticador ou um código de
        recuperação.
      </p>
      <FormularioCodigo volta={volta} />
    </section>
  );
}
