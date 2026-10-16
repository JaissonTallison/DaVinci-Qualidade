import type { Metadata } from "next";
import Link from "next/link";
import {
  CANAIS_DE_RECLAMACAO,
  STATUS_DA_RECLAMACAO,
  type DadosDoUsuario,
  type OrdemDeServico,
  type Pagina,
  type ParceiroResumo,
  type Reclamacao,
  type ResumoReclamacoes,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";
import { botaoSecundario, painel, tituloDaPagina } from "@/lib/estilos";
import { NovaReclamacao } from "./formularios";

export const metadata: Metadata = { title: "Reclamações de clientes" };

/** SAC: registro, análise de procedência, resposta e encerramento, com prazo e indicadores (ISO 10002). */
export default async function Reclamacoes({
  searchParams,
}: PageProps<"/servicos/reclamacoes">) {
  const { status } = (await searchParams) as { status?: string };
  const [r, resumo, clientes, ordens, eu] = await Promise.all([
    chamarApi<Reclamacao[]>(`/reclamacoes${status ? `?status=${status}` : ""}`),
    chamarApi<ResumoReclamacoes>("/reclamacoes/resumo"),
    chamarApi<Pagina<ParceiroResumo>>("/parceiros?papel=cliente&porPagina=100"),
    chamarApi<Pagina<OrdemDeServico>>("/ordens-de-servico?porPagina=100"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("servicos.editar");
  const pct = (v: number | null) => (v === null ? "—" : `${v}%`);
  return (
    <>
      <h1 className={tituloDaPagina}>Reclamações de clientes</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        Toda reclamação tem prazo de resposta. A análise diz se procede;
        procedente pode abrir a não conformidade na Qualidade. A resposta ao
        cliente e a satisfação com a solução fecham o ciclo.
      </p>
      {resumo.ok && (
        <section
          className={`${painel} mt-6 grid grid-cols-2 gap-5 p-5 sm:grid-cols-5`}
          aria-label="Indicadores"
        >
          {[
            ["Em aberto", String(resumo.dados.abertas), false],
            [
              "Fora do prazo",
              String(resumo.dados.atrasadas),
              resumo.dados.atrasadas > 0,
            ],
            ["Procedentes (12 meses)", pct(resumo.dados.procedentes), false],
            [
              "Tempo médio de resposta",
              resumo.dados.tempoMedioResposta === null
                ? "—"
                : `${resumo.dados.tempoMedioResposta.toLocaleString("pt-BR")} dias`,
              false,
            ],
            ["Satisfeitos com a solução", pct(resumo.dados.satisfacao), false],
          ].map(([t, v, alerta]) => (
            <div key={String(t)}>
              <p className="text-xs text-texto-2">{t}</p>
              <p
                className={`text-2xl font-semibold tabular-nums ${alerta ? "text-nao-conforme" : ""}`}
              >
                {v}
              </p>
            </div>
          ))}
        </section>
      )}
      {podeEditar && clientes.ok && (
        <Recolhido titulo="Registrar reclamação">
          <NovaReclamacao
            clientes={clientes.dados.itens}
            ordens={ordens.ok ? ordens.dados.itens : []}
            hoje={hojeEmBrasilia()}
          />
        </Recolhido>
      )}
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-2 border-b border-borda px-4 py-3">
          <SelecaoDeFiltro
            nome="status"
            rotulo="Situação"
            opcoes={STATUS_DA_RECLAMACAO}
            valor={status}
          />
          <button type="submit" className={botaoSecundario}>
            Filtrar
          </button>
        </form>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : r.dados.length === 0 ? (
          <p className="px-5 py-6 text-base text-texto-2">
            Nenhuma reclamação.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borda text-left text-texto-2">
                <th className="px-4 py-2 font-semibold">Número</th>
                <th className="px-4 py-2 font-semibold">Cliente</th>
                <th className="px-4 py-2 font-semibold">Recebida</th>
                <th className="px-4 py-2 font-semibold">Responder até</th>
                <th className="px-4 py-2 font-semibold">Situação</th>
                <th className="px-4 py-2 font-semibold">NC</th>
              </tr>
            </thead>
            <tbody>
              {r.dados.map((x) => (
                <tr key={x.id} className="border-b border-borda last:border-0">
                  <td data-rotulo="Número" className="px-4 py-2.5">
                    <Link
                      href={`/servicos/reclamacoes/${x.id}`}
                      className="font-mono text-info hover:underline"
                    >
                      {x.numero}
                    </Link>
                  </td>
                  <td data-rotulo="Cliente" className="px-4 py-2.5">
                    {x.clienteNome}
                    <span className="block text-texto-2">
                      {CANAIS_DE_RECLAMACAO[x.canal]}
                      {x.produto && ` · ${x.produto}`}
                    </span>
                  </td>
                  <td data-rotulo="Recebida" className="px-4 py-2.5">
                    {formatarData(x.recebidaEm)}
                  </td>
                  <td
                    data-rotulo="Responder até"
                    className={`px-4 py-2.5 ${x.atrasada ? "font-semibold text-nao-conforme" : ""}`}
                  >
                    {formatarData(x.prazoResposta)}
                    {x.atrasada && " · atrasada"}
                  </td>
                  <td data-rotulo="Situação" className="px-4 py-2.5">
                    {STATUS_DA_RECLAMACAO[x.status]}
                    {x.procedente !== null && (
                      <span className="block text-texto-2">
                        {x.procedente ? "Procedente" : "Improcedente"}
                      </span>
                    )}
                  </td>
                  <td data-rotulo="NC" className="px-4 py-2.5 font-mono">
                    {x.ncId ? (
                      <Link
                        href={`/qualidade/nao-conformidades/${x.ncId}`}
                        className="text-info hover:underline"
                      >
                        {x.ncNumero}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
