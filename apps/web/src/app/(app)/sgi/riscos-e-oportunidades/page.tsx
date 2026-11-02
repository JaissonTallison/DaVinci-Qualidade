import { redirect } from "next/navigation";

/** Rota antiga: a tela virou duas (Riscos e Oportunidades). */
export default function Pagina() {
  redirect("/sgi/riscos");
}
