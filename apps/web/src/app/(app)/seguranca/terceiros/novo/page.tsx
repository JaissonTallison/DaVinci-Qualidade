import type { Metadata } from "next";
import Link from "next/link";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeTerceiro } from "../formulario";

export const metadata: Metadata = { title: "Cadastrar terceiro" };

export default function NovoTerceiro() {
  return (
    <>
      <Link
        href="/seguranca/terceiros"
        className="text-sm text-texto-2 hover:underline"
      >
        Terceiros
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Cadastrar terceiro</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Depois do cadastro, registre os documentos de SST. Sem PGR, PCMSO e ASO
        válidos, a terceira fica com pendência.
      </p>
      <FormularioDeTerceiro />
    </>
  );
}
