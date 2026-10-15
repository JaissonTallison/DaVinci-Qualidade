import type { Metadata } from "next";
import Link from "next/link";
import { criarAspecto } from "@/lib/acoes-ambiental";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeAspecto } from "../formulario";

export const metadata: Metadata = { title: "Novo aspecto ambiental" };

export default function NovoAspecto() {
  return (
    <>
      <Link
        href="/ambiental/aspectos"
        className="text-sm text-texto-2 hover:underline"
      >
        Aspectos e impactos
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Novo aspecto ambiental</h1>
      <FormularioDeAspecto acao={criarAspecto} />
    </>
  );
}
