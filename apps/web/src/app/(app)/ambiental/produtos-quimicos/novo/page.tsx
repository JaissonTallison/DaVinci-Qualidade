import type { Metadata } from "next";
import Link from "next/link";
import { criarProduto } from "@/lib/acoes-ambiental";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeProduto } from "../formulario";

export const metadata: Metadata = { title: "Novo produto químico" };

export default function NovoProduto() {
  return (
    <>
      <Link
        href="/ambiental/produtos-quimicos"
        className="dv-voltar"
      >
        Produtos químicos
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Novo produto químico</h1>
      <FormularioDeProduto acao={criarProduto} />
    </>
  );
}
