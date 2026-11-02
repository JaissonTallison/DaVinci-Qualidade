import { redirect } from "next/navigation";

/** Rota antiga: manda para o detalhe em Gestão de inovação. */
export default async function Pagina({
  params,
}: PageProps<"/sgi/mudancas/[id]">) {
  const { id } = await params;
  redirect(`/sgi/inovacao/${id}`);
}
