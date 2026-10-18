import type { Metadata } from "next";
import Link from "next/link";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeLicenca } from "./formulario";

export const metadata: Metadata = { title: "Nova licença" };

export default function NovaLicenca() {
  return (
    <>
      <Link
        href="/ambiental/licencas"
        className="dv-voltar"
      >
        Licenças
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Nova licença ou autorização</h1>
      <FormularioDeLicenca />
    </>
  );
}
