import { notFound, redirect } from "next/navigation";
import type { RiscoOuOportunidade } from "@davinci/types";
import { chamarApi } from "@/lib/api";
import { caminhoDoRo } from "../../_ro/config";

/** Rota antiga: manda o link para o detalhe certo (risco ou oportunidade). */
export default async function Pagina({
  params,
}: PageProps<"/sgi/riscos-e-oportunidades/[id]">) {
  const { id } = await params;
  const r = await chamarApi<RiscoOuOportunidade>(
    `/riscos-e-oportunidades/${id}`,
  );
  if (!r.ok) notFound();
  redirect(`${caminhoDoRo(r.dados.tipo)}/${id}`);
}
