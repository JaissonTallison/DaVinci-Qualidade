import type { Metadata } from "next";
import Link from "next/link";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeInovacao } from "./formulario";

export const metadata: Metadata = { title: "Propor inovação" };

export default function NovaInovacao() {
  return (
    <>
      <Link href="/sgi/inovacao" className="dv-voltar">
        Gestão de inovação
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Propor inovação</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Um gestor que não seja você avalia e aprova ou reprova; depois de
        implementada, registre os resultados obtidos.
      </p>
      <FormularioDeInovacao />
    </>
  );
}
