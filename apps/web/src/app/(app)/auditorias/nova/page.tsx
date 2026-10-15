import type { Metadata } from "next";
import Link from "next/link";
import { hojeEmBrasilia } from "@/lib/datas";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeAuditoria } from "../formulario";

export const metadata: Metadata = { title: "Planejar auditoria" };

export default function NovaAuditoria() {
  return (
    <>
      <Link href="/auditorias" className="text-sm text-texto-2 hover:underline">
        Auditorias
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Planejar auditoria</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Defina escopo, normas e equipe. As constatações são registradas depois
        de iniciar a auditoria.
      </p>
      <FormularioDeAuditoria hoje={hojeEmBrasilia()} />
    </>
  );
}
