import type { ParceiroResumo } from "@davinci/types";
import { Selecao } from "@/components/selecao";
import { campo } from "@/lib/estilos";

/** Lista de clientes ou fornecedores ativos do cadastro (codex). */
export function EscolhaDeParceiro({
  id,
  parceiros,
  valor,
  invalido,
}: {
  id: string;
  parceiros: ParceiroResumo[];
  valor?: string;
  invalido: boolean;
}) {
  return (
    <Selecao
      id={id}
      name={id}
      defaultValue={valor ?? ""}
      className={campo}
      aria-invalid={invalido}
    >
      <option value="">Escolha</option>
      {parceiros.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nomeFantasia ?? p.nome}
        </option>
      ))}
    </Selecao>
  );
}
