import type { Metadata } from "next";
import Link from "next/link";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDePerfil } from "../formulario";

export const metadata: Metadata = { title: "Criar perfil" };

export default function NovoPerfil() {
  return (
    <div className="w-full">
      <Link
        href="/administracao/perfis"
        className="dv-voltar"
      >
        Perfis de acesso
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Criar perfil</h1>
      <FormularioDePerfil />
    </div>
  );
}
