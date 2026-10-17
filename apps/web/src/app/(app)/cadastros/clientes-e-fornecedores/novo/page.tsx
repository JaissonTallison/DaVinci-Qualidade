import type { Metadata } from "next";
import Link from "next/link";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeParceiro } from "../formulario";

export const metadata: Metadata = { title: "Cadastrar cliente ou fornecedor" };

export default function NovoParceiro() {
  return (
    <>
      <Link
        href="/cadastros/clientes-e-fornecedores"
        className="dv-voltar"
      >
        Clientes e fornecedores
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>
        Cadastrar cliente ou fornecedor
      </h1>
      <FormularioDeParceiro />
    </>
  );
}
