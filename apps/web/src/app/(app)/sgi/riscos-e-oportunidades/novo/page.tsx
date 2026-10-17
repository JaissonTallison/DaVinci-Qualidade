import type { Metadata } from "next";
import Link from "next/link";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeRo } from "../formulario";

export const metadata: Metadata = { title: "Registrar risco ou oportunidade" };

export default function NovoRo() {
  return (
    <>
      <Link
        href="/sgi/riscos-e-oportunidades"
        className="dv-voltar"
      >
        Riscos e oportunidades
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>
        Registrar risco ou oportunidade
      </h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Classificação alta exige ação, responsável e prazo.
      </p>
      <FormularioDeRo />
    </>
  );
}
