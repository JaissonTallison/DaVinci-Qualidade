import { Download } from "lucide-react";
import Link from "next/link";
import { botaoSecundario } from "@/lib/estilos";

/**
 * Baixa a lista atual em CSV, com os filtros aplicados (não só a página na tela). Aponta para /exportar,
 * que monta o arquivo no servidor. `recurso` é a chave da lista permitida lá.
 */
export function BotaoExportar({
  recurso,
  consulta,
}: {
  recurso: string;
  consulta: URLSearchParams;
}) {
  const q = new URLSearchParams(consulta);
  q.delete("pagina");
  q.set("recurso", recurso);
  return (
    <Link
      href={`/exportar?${q}`}
      prefetch={false}
      download
      className={botaoSecundario}
    >
      <Download aria-hidden size={16} strokeWidth={2} />
      Exportar
    </Link>
  );
}
