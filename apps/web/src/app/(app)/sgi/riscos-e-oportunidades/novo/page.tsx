import { redirect } from "next/navigation";

/** Rota antiga: o cadastro agora é por tela (risco ou oportunidade). */
export default function Pagina() {
  redirect("/sgi/riscos/novo");
}
