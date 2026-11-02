import type { Metadata } from "next";
import { RISCO } from "../../_ro/config";
import { NovoRo } from "../../_ro/novo";

export const metadata: Metadata = { title: "Registrar risco" };

export default function Pagina() {
  return <NovoRo cfg={RISCO} />;
}
