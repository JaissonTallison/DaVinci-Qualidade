import type { Metadata } from "next";
import Link from "next/link";
import { tituloDaPagina } from "@/lib/estilos";
import { hojeEmBrasilia } from "@/lib/datas";
import { FormularioNovaNc } from "./formulario";

export const metadata: Metadata = { title: "Abrir NC" };

export default function NovaNc() {
  return (
    <>
      <Link
        href="/qualidade/nao-conformidades"
        className="text-sm text-texto-2 hover:underline"
      >
        Não conformidades
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Abrir não conformidade</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Registre o que aconteceu, quem responde e até quando. A causa raiz e a
        ação corretiva entram depois, no tratamento.
      </p>
      <FormularioNovaNc hoje={hojeEmBrasilia()} />
    </>
  );
}
