import type { Metadata } from "next";
import { OPORTUNIDADE } from "../../_ro/config";
import { DetalheDoRo } from "../../_ro/detalhe";

export const metadata: Metadata = { title: "Oportunidade" };

export default async function Pagina({
  params,
  searchParams,
}: PageProps<"/sgi/oportunidades/[id]">) {
  const { id } = await params;
  return <DetalheDoRo cfg={OPORTUNIDADE} id={id} searchParams={searchParams} />;
}
