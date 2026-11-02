import type { Metadata } from "next";
import { OPORTUNIDADE } from "../_ro/config";
import { ListaDeRo } from "../_ro/lista";

export const metadata: Metadata = { title: "Oportunidades" };

export default function Pagina({
  searchParams,
}: PageProps<"/sgi/oportunidades">) {
  return <ListaDeRo cfg={OPORTUNIDADE} searchParams={searchParams} />;
}
