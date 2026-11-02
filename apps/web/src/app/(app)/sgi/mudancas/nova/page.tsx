import { redirect } from "next/navigation";

/** Rota antiga: propor agora é em Gestão de inovação. */
export default function Pagina() {
  redirect("/sgi/inovacao/nova");
}
