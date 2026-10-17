import type { Metadata } from "next";
import Link from "next/link";
import { criarTema } from "@/lib/acoes-esg";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeTema } from "../formulario";

export const metadata: Metadata = { title: "Novo tema ESG" };

export default function NovoTema() {
  return (
    <>
      <Link href="/esg/temas" className="dv-voltar">
        Temas ESG
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Novo tema ESG</h1>
      <FormularioDeTema acao={criarTema} />
    </>
  );
}
