import type { Metadata } from "next";
import Link from "next/link";
import {
  CLASSIFICACOES_FORNECEDOR,
  type AvaliacaoDeFornecedor,
  type DadosDoUsuario,
  type Pagina,
  type ParceiroResumo,
  type RecebimentoDoFornecedor,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { Validade } from "@/components/situacao-do-vencimento";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import { FormularioDeAvaliacao } from "./formulario";

export const metadata: Metadata = { title: "Avaliação de fornecedores" };
const COR = {
  aprovado: "text-conforme",
  aprovado_com_restricao: "text-atencao",
  reprovado: "text-nao-conforme",
};
const num = (v: number) =>
  v.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });

export default async function Fornecedores({
  searchParams,
}: PageProps<"/servicos/fornecedores">) {
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu, fornecedores] = await Promise.all([
    chamarApi<AvaliacaoDeFornecedor[]>("/avaliacoes-de-fornecedores"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
    chamarApi<Pagina<ParceiroResumo>>(
      "/parceiros?papel=fornecedor&porPagina=100",
    ),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("servicos.editar");
  const vigentes = r.ok ? r.dados.filter((a) => a.vigente) : [];
  // Recebimento (inspeções da Qualidade nos últimos 12 meses): base para a nota de qualidade
  const veRecebimento =
    eu.ok &&
    eu.dados.recursos.includes("qualidade") &&
    eu.dados.permissoes.includes("qualidade.ver");
  const recebimentos = new Map(
    veRecebimento
      ? (
          await Promise.all(
            vigentes.map((a) =>
              chamarApi<RecebimentoDoFornecedor>(
                `/inspecoes/fornecedor/${a.fornecedorId}`,
              ),
            ),
          )
        ).flatMap((x) =>
          x.ok ? [[x.dados.fornecedorId, x.dados] as const] : [],
        )
      : [],
  );
  const historico = r.ok ? r.dados.filter((a) => !a.vigente) : [];
  return (
    <>
      <h1 className={tituloDaPagina}>Avaliação de fornecedores</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Média dos quatro critérios: 4 ou mais, aprovado (reavaliar em 12 meses);
        de 3 a 4, aprovado com restrição (6 meses); abaixo de 3, reprovado (3
        meses). Vale a avaliação mais recente.
      </p>
      <Aviso avisos={{ avaliado: "Avaliação registrada." }} chave={aviso} />
      {podeEditar && fornecedores.ok && (
        <Recolhido titulo="Avaliar fornecedor">
          {fornecedores.dados.itens.length ? (
            <FormularioDeAvaliacao fornecedores={fornecedores.dados.itens} />
          ) : (
            <p className="text-base text-texto-2">
              Nenhum fornecedor cadastrado.{" "}
              <Link
                href="/cadastros/clientes-e-fornecedores/novo"
                className="text-info hover:underline"
              >
                Cadastre em Clientes e fornecedores
              </Link>
              .
            </p>
          )}
        </Recolhido>
      )}
      {!r.ok ? (
        <div className="mt-6">
          <AvisoDeErro erro={r.erro} />
        </div>
      ) : (
        <section className={`${painel} mt-6`}>
          <h2 className={`${tituloDaSecao} px-5 pt-5`}>Situação atual</h2>
          {vigentes.length === 0 ? (
            <p className="px-5 pt-2 pb-5 text-base text-texto-2">
              Nenhum fornecedor avaliado.
            </p>
          ) : (
            <div className="relative mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-superficie-2 text-sm text-texto-2">
                  <tr>
                    <th className="px-5 py-2 font-semibold">Fornecedor</th>
                    <th className="px-4 py-2 font-semibold">Avaliado em</th>
                    <th className="px-4 py-2 font-semibold">Q · P · A · D</th>
                    <th className="px-4 py-2 font-semibold">Média</th>
                    <th className="px-4 py-2 font-semibold">Classificação</th>
                    {veRecebimento && (
                      <th className="px-4 py-2 font-semibold">
                        Recebimento (12 meses)
                      </th>
                    )}
                    <th className="px-4 py-2 font-semibold">
                      Próxima avaliação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {vigentes.map((a) => (
                    <tr key={a.id}>
                      <td className="px-5 py-2.5">
                        <Link
                          href={`/cadastros/clientes-e-fornecedores/${a.fornecedorId}`}
                          className="text-info hover:underline"
                        >
                          {a.fornecedorNome}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {formatarData(a.data)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-texto-2">
                        {a.notas.qualidade} · {a.notas.prazo} ·{" "}
                        {a.notas.atendimento} · {a.notas.documentacao}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {num(a.media)}
                      </td>
                      <td
                        className={`px-4 py-2.5 font-semibold ${COR[a.classificacao]}`}
                      >
                        {CLASSIFICACOES_FORNECEDOR[a.classificacao]}
                      </td>
                      {veRecebimento && (
                        <td className="px-4 py-2.5 text-sm">
                          {(() => {
                            const x = recebimentos.get(a.fornecedorId);
                            if (!x || x.inspecoes === 0)
                              return (
                                <span className="text-texto-3">
                                  Sem inspeção
                                </span>
                              );
                            return (
                              <Link
                                href={`/qualidade/inspecoes?busca=${encodeURIComponent(a.fornecedorNome)}`}
                                className="hover:underline"
                              >
                                <span
                                  className={`font-semibold tabular-nums ${x.reprovadas ? "text-nao-conforme" : "text-texto"}`}
                                >
                                  {x.indiceDeAprovacao ?? "—"}%
                                </span>{" "}
                                <span className="text-texto-2">
                                  aprovado em {x.aprovadas + x.reprovadas}
                                </span>
                              </Link>
                            );
                          })()}
                        </td>
                      )}
                      <td className="px-4 py-2.5">
                        <Validade validade={a.proximaAvaliacao} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-borda px-5 py-2 text-xs text-texto-3">
                Q qualidade · P prazo · A atendimento · D documentação
              </p>
            </div>
          )}
          {historico.length > 0 && (
            <details className="border-t border-borda px-5 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-texto-2">
                Avaliações anteriores ({historico.length})
              </summary>
              <ul className="mt-2 divide-y divide-borda text-sm">
                {historico.map((a) => (
                  <li key={a.id} className="py-1.5 text-texto-2">
                    {formatarData(a.data)} · {a.fornecedorNome} · média{" "}
                    {num(a.media)} ·{" "}
                    {CLASSIFICACOES_FORNECEDOR[a.classificacao]}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}
    </>
  );
}
