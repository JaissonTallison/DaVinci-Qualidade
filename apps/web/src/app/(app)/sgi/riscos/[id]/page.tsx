import type { Metadata } from "next";
import { RISCO } from "../../_ro/config";
import { DetalheDoRo } from "../../_ro/detalhe";

export const metadata: Metadata = { title: "Risco" };

export default async function Pagina({
  params,
  searchParams,
}: PageProps<"/sgi/riscos/[id]">) {
  const { id } = await params;
  return <DetalheDoRo cfg={RISCO} id={id} searchParams={searchParams} />;
}
