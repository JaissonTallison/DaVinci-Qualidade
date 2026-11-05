import type { Metadata } from "next";
import Link from "next/link";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeAnalise } from "./formulario";

export const metadata: Metadata = { title: "Registrar análise crítica" };

export default function NovaAnalise() {
  return (
    <>
      <Link href="/sgi/analises-criticas" className="dv-voltar">
        Análises críticas
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Registrar análise crítica</h1>
      <FormularioDeAnalise />
    </>
  );
}
