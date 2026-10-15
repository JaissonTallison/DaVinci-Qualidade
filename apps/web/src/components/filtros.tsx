import { campoCompacto } from "@/lib/estilos";

/** Seletor de filtro da lista: "Rótulo: todos" quando vazio. Vai na URL pelo formulário GET. */
export function SelecaoDeFiltro({
  nome,
  rotulo,
  opcoes,
  valor,
}: {
  nome: string;
  rotulo: string;
  opcoes: Record<string, string>;
  valor?: string;
}) {
  return (
    <select
      name={nome}
      defaultValue={valor ?? ""}
      aria-label={rotulo}
      className={campoCompacto}
    >
      <option value="">{rotulo}: todos</option>
      {Object.entries(opcoes).map(([chave, nome]) => (
        <option key={chave} value={chave}>
          {nome}
        </option>
      ))}
    </select>
  );
}
