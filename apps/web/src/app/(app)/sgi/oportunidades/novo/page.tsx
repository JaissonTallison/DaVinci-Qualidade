import type { Metadata } from "next";
import { OPORTUNIDADE } from "../../_ro/config";
import { NovoRo } from "../../_ro/novo";

export const metadata: Metadata = { title: "Registrar oportunidade" };

export default function Pagina() {
  return <NovoRo cfg={OPORTUNIDADE} />;
}
