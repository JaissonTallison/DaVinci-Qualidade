import type { FuncionarioResumo, Pagina } from "@davinci/types";
import { chamarApi } from "@/lib/api";

/**
 * Sugestões de responsável vindas do cadastro de funcionários: um `<datalist id="pessoas">` por página.
 * Campos de pessoa (responsável, inspetor, auditor) usam `list="pessoas"`; quem é de fora (consultor,
 * terceiro) continua podendo ser digitado. Sem `funcionarios.ver`, não há sugestões.
 */
export async function ListaDePessoas({ podeVer }: { podeVer: boolean }) {
  if (!podeVer) return null;
  const pessoas: FuncionarioResumo[] = [];
  for (let pagina = 1; pagina <= 5; pagina++) {
    const r = await chamarApi<Pagina<FuncionarioResumo>>(
      `/funcionarios?situacao=ativos&porPagina=100&pagina=${pagina}`,
    );
    if (!r.ok) break;
    pessoas.push(...r.dados.itens);
    if (pessoas.length >= r.dados.total || r.dados.itens.length === 0) break;
  }
  return (
    <datalist id="pessoas">
      {pessoas.map((p) => (
        <option
          key={p.id}
          value={p.nome}
          label={`${p.funcaoNome} · ${p.setorNome}`}
        />
      ))}
    </datalist>
  );
}
