import type { Metadata } from "next";
import Link from "next/link";
import { criarRequisito } from "@/lib/acoes-ambiental";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeRequisito } from "../formulario";

export const metadata: Metadata = { title: "Novo requisito legal" };

export default function NovoRequisito() {
  return (
    <>
      <Link
        href="/ambiental/requisitos"
        className="dv-voltar"
      >
        Requisitos legais
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Novo requisito legal</h1>
      <FormularioDeRequisito acao={criarRequisito} />
    </>
  );
}
