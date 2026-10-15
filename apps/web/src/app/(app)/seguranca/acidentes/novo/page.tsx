import type { Metadata } from "next";
import Link from "next/link";
import { hojeEmBrasilia } from "@/lib/datas";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeAcidente } from "../formulario";

export const metadata: Metadata = { title: "Registrar acidente" };

export default function NovoAcidente() {
  return (
    <>
      <Link
        href="/seguranca/acidentes"
        className="text-sm text-texto-2 hover:underline"
      >
        Acidentes
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>
        Registrar acidente, incidente ou quase-acidente
      </h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Registre no mesmo dia. Acidente com lesão gera CAT até o primeiro dia
        útil seguinte; a investigação vem depois.
      </p>
      <FormularioDeAcidente hoje={hojeEmBrasilia()} />
    </>
  );
}
