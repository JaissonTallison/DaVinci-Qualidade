import type { Metadata } from "next";
import Link from "next/link";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeRisco } from "../formulario";

export const metadata: Metadata = { title: "Cadastrar risco" };

export default function NovoRisco() {
  return (
    <>
      <Link
        href="/seguranca/pgr"
        className="dv-voltar"
      >
        PGR
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Cadastrar risco</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Risco alto ou crítico entra com plano: o que será feito, por quem e até
        quando (NR-1).
      </p>
      <FormularioDeRisco />
    </>
  );
}
