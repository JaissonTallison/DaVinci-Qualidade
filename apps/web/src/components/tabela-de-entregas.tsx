import Link from "next/link";
import { MOTIVOS_ENTREGA, type EntregaEpi } from "@davinci/types";
import { AnularEntrega, DevolverEntrega } from "@/components/acoes-da-entrega";
import { SituacaoDaEntrega } from "@/components/marcadores";
import { formatarData, prazoRelativo } from "@/lib/datas";

/**
 * Entregas de EPI: a lista geral e a ficha do funcionário usam a mesma tabela.
 * Na ficha (`comFuncionario` falso) a coluna da pessoa sai.
 */
export function TabelaDeEntregas({
  entregas,
  voltar,
  podeEditar,
  gestor,
  comFuncionario = true,
}: {
  entregas: EntregaEpi[];
  voltar: string;
  podeEditar: boolean;
  gestor: boolean;
  comFuncionario?: boolean;
}) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-superficie-2 text-sm text-texto-2">
          <tr>
            <th className="px-4 py-2 font-semibold">Data</th>
            {comFuncionario && (
              <th className="px-4 py-2 font-semibold">Funcionário</th>
            )}
            <th className="px-4 py-2 font-semibold">EPI</th>
            <th className="px-4 py-2 font-semibold">Qtd.</th>
            <th className="px-4 py-2 font-semibold">Motivo</th>
            <th className="px-4 py-2 font-semibold">Termo</th>
            <th className="px-4 py-2 font-semibold">Próxima troca</th>
            <th className="px-4 py-2 font-semibold">Situação</th>
            {(podeEditar || gestor) && (
              <th className="px-4 py-2">
                <span className="sr-only">Ações</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-borda">
          {entregas.map((e) => {
            const anulada = e.situacao === "anulada";
            const aberta =
              e.situacao === "em_uso" || e.situacao === "troca_vencida";
            return (
              <tr key={e.id} className={anulada ? "text-texto-3" : ""}>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span className={anulada ? "line-through" : ""}>
                    {formatarData(e.data)}
                  </span>
                  {anulada && (
                    <span className="block max-w-xs text-xs">
                      Anulada: {e.motivoAnulacao}
                    </span>
                  )}
                </td>
                {comFuncionario && (
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/cadastros/funcionarios/${e.funcionarioId}`}
                      className="text-info hover:underline"
                    >
                      {e.funcionarioNome}
                    </Link>
                    <span className="block font-mono text-xs text-texto-3">
                      {e.funcionarioMatricula}
                    </span>
                  </td>
                )}
                <td className="px-4 py-2.5">
                  {e.epiNome}
                  <span className="block font-mono text-xs text-texto-3">
                    CA {e.ca}
                  </span>
                </td>
                <td className="px-4 py-2.5 tabular-nums">{e.quantidade}</td>
                <td className="px-4 py-2.5 text-texto-2">
                  {MOTIVOS_ENTREGA[e.motivo]}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {e.termoAssinado ? (
                    "Assinado"
                  ) : (
                    <span className={aberta ? "text-atencao" : ""}>
                      Pendente
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {e.devolvidoEm ? (
                    <span className="text-texto-2">
                      Devolvido em {formatarData(e.devolvidoEm)}
                    </span>
                  ) : e.proximaTroca ? (
                    <>
                      {formatarData(e.proximaTroca)}
                      {aberta && (
                        <span
                          className={`block text-xs ${e.situacao === "troca_vencida" ? "text-nao-conforme" : "text-texto-3"}`}
                        >
                          {prazoRelativo(e.proximaTroca)}
                        </span>
                      )}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <SituacaoDaEntrega situacao={e.situacao} />
                </td>
                {(podeEditar || gestor) && (
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <span className="inline-flex gap-4">
                      {podeEditar && aberta && (
                        <DevolverEntrega entrega={e} voltar={voltar} />
                      )}
                      {gestor && !anulada && (
                        <AnularEntrega entrega={e} voltar={voltar} />
                      )}
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
