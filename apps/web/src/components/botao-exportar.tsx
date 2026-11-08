import { Download } from "@/components/icones";
import { Botao } from "@/components/botao";

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
    <Botao href={`/exportar?${q}`} prefetch={false} download icone={Download}>
      Exportar
    </Botao>
  );
}
