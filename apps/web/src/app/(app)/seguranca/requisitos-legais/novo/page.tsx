import type { Metadata } from "next";
import Link from "next/link";
import { criarRequisitoSst } from "@/lib/acoes-requisitos-sst";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeRequisitoSst } from "../formulario";

export const metadata: Metadata = { title: "Novo requisito legal de SST" };

export default function NovoRequisitoSst() {
  return (
    <>
      <Link href="/seguranca/requisitos-legais" className="dv-voltar">
        Requisitos legais de SST
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Novo requisito legal de SST</h1>
      <FormularioDeRequisitoSst acao={criarRequisitoSst} />
    </>
  );
}
