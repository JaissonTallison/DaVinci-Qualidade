import type { Metadata } from "next";
import Link from "next/link";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeInstrumento } from "../formulario";

export const metadata: Metadata = { title: "Cadastrar instrumento" };

export default function NovoInstrumento() {
  return (
    <>
      <Link
        href="/qualidade/calibracao"
        className="dv-voltar"
      >
        Calibração
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Cadastrar instrumento</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Depois do cadastro, registre a última calibração: a próxima é calculada
        pela frequência.
      </p>
      <FormularioDeInstrumento />
    </>
  );
}
