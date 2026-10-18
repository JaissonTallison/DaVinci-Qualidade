import type { SetorDaEmpresa } from "@davinci/types";
import { chamarApi } from "@/lib/api";

/**
 * Sugestões de setor vindas do cadastro: um `<datalist id="setores">` global. Campos de local/onde
 * (`list="setores"`) autocompletam; quem é de fora continua podendo digitar. Sem `funcionarios.ver`, não há sugestões.
 */
export async function ListaDeSetores({ podeVer }: { podeVer: boolean }) {
  if (!podeVer) return null;
  const r = await chamarApi<SetorDaEmpresa[]>("/setores-da-empresa");
  if (!r.ok) return null;
  return (
    <datalist id="setores">
      {r.dados.map((s) => (
        <option key={s.id} value={s.nome} />
      ))}
    </datalist>
  );
}
