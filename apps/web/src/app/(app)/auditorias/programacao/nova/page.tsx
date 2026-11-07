import type { Metadata } from "next";
import Link from "next/link";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDaProgramacao } from "../formulario";

export const metadata: Metadata = { title: "Novo item da programação" };

export default async function NovoItemDaProgramacao({
  searchParams,
}: PageProps<"/auditorias/programacao/nova">) {
  const { ano } = (await searchParams) as { ano?: string };
  const anoInicial = Number(ano) || new Date().getFullYear();
  return (
    <>
      <Link href="/auditorias/programacao" className="dv-voltar">
        Programação de auditorias
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Adicionar à programação</h1>
      <FormularioDaProgramacao ano={anoInicial} />
    </>
  );
}
