import type { Metadata } from "next";
import Link from "next/link";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDePt } from "./formulario";

export const metadata: Metadata = { title: "Solicitar permissão de trabalho" };

export default function NovaPt() {
  return (
    <>
      <Link
        href="/seguranca/permissoes-de-trabalho"
        className="text-sm text-texto-2 hover:underline"
      >
        Permissões de trabalho
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>
        Solicitar permissão de trabalho
      </h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        O serviço só começa depois que outra pessoa autorizada liberar a PT. Ela
        vale por uma jornada.
      </p>
      <FormularioDePt />
    </>
  );
}
