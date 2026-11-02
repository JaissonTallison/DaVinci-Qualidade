import type { Metadata } from "next";
import { RISCO } from "../_ro/config";
import { ListaDeRo } from "../_ro/lista";

export const metadata: Metadata = { title: "Riscos" };

export default function Pagina({ searchParams }: PageProps<"/sgi/riscos">) {
  return <ListaDeRo cfg={RISCO} searchParams={searchParams} />;
}
