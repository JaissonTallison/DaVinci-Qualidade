import type { Metadata } from "next";
import Link from "next/link";
import { TIPOS_REGISTRO_SST, type TipoRegistroSst } from "@davinci/types";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeRegistro } from "./formulario";

export const metadata: Metadata = { title: "Novo registro de segurança" };

export default async function NovoRegistro({
  searchParams,
}: PageProps<"/seguranca/registros/novo">) {
  const { tipo } = (await searchParams) as { tipo?: string };
  return (
    <>
      <Link
        href="/seguranca/registros"
        className="text-sm text-texto-2 hover:underline"
      >
        Registros de segurança
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Novo registro</h1>
      <FormularioDeRegistro
        tipoInicial={
          tipo && tipo in TIPOS_REGISTRO_SST
            ? (tipo as TipoRegistroSst)
            : undefined
        }
      />
    </>
  );
}
