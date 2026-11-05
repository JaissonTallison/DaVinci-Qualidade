import type { Metadata } from "next";
import Link from "next/link";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { FormularioDaAuditoriaSimples } from "../formulario";

export const metadata: Metadata = { title: "Nova auditoria interna simples" };

export default function NovaAuditoriaSimples() {
  return (
    <>
      <Link href="/auditorias/simples" className="dv-voltar">
        Auditorias internas simples
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>
        Nova auditoria interna simples
      </h1>
      <div className={`${painel} mt-6 p-5`}>
        <FormularioDaAuditoriaSimples />
      </div>
    </>
  );
}
