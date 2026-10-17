import type { Metadata } from "next";
import Link from "next/link";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeModelo } from "../formulario";

export const metadata: Metadata = { title: "Criar modelo de inspeção" };

export default function NovoModelo() {
  return (
    <>
      <Link
        href="/qualidade/modelos-de-inspecao"
        className="dv-voltar"
      >
        Modelos de inspeção
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Criar modelo de inspeção</h1>
      <FormularioDeModelo />
    </>
  );
}
