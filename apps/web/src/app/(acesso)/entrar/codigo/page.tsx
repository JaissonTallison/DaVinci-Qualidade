import type { Metadata } from "next";
import { CabecalhoDeAcesso } from "../../campo-de-acesso";
import { FormularioCodigo } from "./formulario-codigo";

export const metadata: Metadata = { title: "Código de verificação" };

export default async function Codigo({
  searchParams,
}: PageProps<"/entrar/codigo">) {
  const { volta } = (await searchParams) as { volta?: string };
  return (
    <section>
      <CabecalhoDeAcesso titulo="Código de verificação">
        Digite o código de 6 dígitos do aplicativo autenticador ou um código de
        recuperação.
      </CabecalhoDeAcesso>
      <FormularioCodigo volta={volta} />
    </section>
  );
}
