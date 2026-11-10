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
      // pr-8: espaço para a seta nativa do select não cair sobre o texto (filtro é auto-width)
      className={`${campoCompacto} pr-8`}
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
