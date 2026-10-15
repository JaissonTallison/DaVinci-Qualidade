import type { Metadata } from "next";
import Link from "next/link";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeMudanca } from "./formulario";

export const metadata: Metadata = { title: "Propor mudança" };

export default function NovaMudanca() {
  return (
    <>
      <Link
        href="/sgi/mudancas"
        className="text-sm text-texto-2 hover:underline"
      >
        Gestão de mudanças
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Propor mudança</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Um gestor que não seja você aprova ou rejeita; depois de implementada,
        registre como foi verificada.
      </p>
      <FormularioDeMudanca />
    </>
  );
}
