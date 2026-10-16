import type { Metadata } from "next";
import Link from "next/link";
import {
  SITUACOES_DO_CONTRATO,
  type Contrato,
  type DadosDoUsuario,
  type Pagina,
  type ParceiroResumo,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { NovoContrato } from "./formularios";
import { COR_DA_SITUACAO } from "./situacao";

export const metadata: Metadata = { title: "Contratos e SLA" };

/** Contratos com cliente: vigência, SLA de atendimento e o cumprimento medido nas OS. */
export default async function Contratos() {
  const [r, clientes, eu] = await Promise.all([
    chamarApi<Contrato[]>("/contratos"),
    chamarApi<Pagina<ParceiroResumo>>("/parceiros?papel=cliente&porPagina=100"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("servicos.editar");
  return (
    <>
      <h1 className={tituloDaPagina}>Contratos e SLA</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        Cada contrato define o prazo de atendimento (SLA) das OS abertas nele e
        a meta de OS concluídas no prazo. O cumprimento é medido nos últimos 12
        meses; o fim da vigência entra no painel de vencimentos 60 dias antes.
      </p>
      {podeEditar && clientes.ok && (
        <Recolhido titulo="Novo contrato">
          <NovoContrato clientes={clientes.dados.itens} />
        </Recolhido>
      )}
      <section className={`${painel} mt-6`}>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : r.dados.length === 0 ? (
          <p className="px-5 py-6 text-base text-texto-2">
            Nenhum contrato cadastrado.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borda text-left text-texto-2">
                <th className="px-4 py-2 font-semibold">Número</th>
                <th className="px-4 py-2 font-semibold">Cliente</th>
                <th className="px-4 py-2 font-semibold">Vigência</th>
                <th className="px-4 py-2 font-semibold">SLA</th>
                <th className="px-4 py-2 font-semibold">No prazo (12 meses)</th>
                <th className="px-4 py-2 font-semibold">OS abertas</th>
              </tr>
            </thead>
            <tbody>
              {r.dados.map((c) => (
                <tr key={c.id} className="border-b border-borda last:border-0">
                  <td data-rotulo="Número" className="px-4 py-2.5">
                    <Link
                      href={`/servicos/contratos/${c.id}`}
                      className="font-mono text-info hover:underline"
                    >
                      {c.numero}
                    </Link>
                  </td>
                  <td data-rotulo="Cliente" className="px-4 py-2.5">
                    {c.clienteNome}
                    <span className="block text-texto-2">{c.objeto}</span>
                  </td>
                  <td
                    data-rotulo="Vigência"
                    className={`px-4 py-2.5 ${COR_DA_SITUACAO[c.situacao]}`}
                  >
                    {formatarData(c.inicio)} a {formatarData(c.fim)}
                    <span className="block">
                      {SITUACOES_DO_CONTRATO[c.situacao]}
                    </span>
                  </td>
                  <td data-rotulo="SLA" className="px-4 py-2.5 tabular-nums">
                    {c.prazoAtendimentoDias} dia(s)
                  </td>
                  <td
                    data-rotulo="No prazo"
                    className={`px-4 py-2.5 tabular-nums ${c.sla.atendeMeta === false ? "font-semibold text-nao-conforme" : ""}`}
                  >
                    {c.sla.percentual === null ? "—" : `${c.sla.percentual}%`}{" "}
                    <span className="text-texto-2">meta {c.metaNoPrazo}%</span>
                  </td>
                  <td
                    data-rotulo="OS abertas"
                    className="px-4 py-2.5 tabular-nums"
                  >
                    {c.osAbertas}
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
