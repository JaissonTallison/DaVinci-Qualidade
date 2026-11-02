import { redirect } from "next/navigation";

/** Rota antiga: o módulo virou Gestão de inovação. */
export default function Pagina() {
  redirect("/sgi/inovacao");
}
