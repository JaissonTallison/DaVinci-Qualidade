import { ListFilter } from "lucide-react";
import { Pendencias } from "@/components/pendencias";
import type { Metadata } from "next";
import Link from "next/link";
import {
  SITUACOES_VENCIMENTO,
  type ResumoVencimentos,
  type Vencimento,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { Validade } from "@/components/situacao-do-vencimento";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { botaoSecundario, painel, tituloDaPagina } from "@/lib/estilos";

export const metadata: Metadata = {
  title: "Vencimentos de ASO e treinamentos",
};

export default async function Vencimentos({
  searchParams,
}: PageProps<"/seguranca/vencimentos">) {
  const params = (await searchParams) as { situacao?: string; tipo?: string };
  const consulta = new URLSearchParams();
  if (params.situacao) consulta.set("situacao", params.situacao);
  if (params.tipo) consulta.set("tipo", params.tipo);
  const [lista, resumo] = await Promise.all([
    chamarApi<Vencimento[]>(`/vencimentos?${consulta}`),
    chamarApi<ResumoVencimentos>("/vencimentos/resumo"),
  ]);
  const filtrando = Boolean(params.situacao || params.tipo);
  return (
    <>
      <h1 className={tituloDaPagina}>Vencimentos de ASO e treinamentos</h1>
      {resumo.ok && (
        <Pendencias
          itens={[
            {
              valor: resumo.dados.vencidos,
              rotulo: "vencidos",
              singular: "vencido",
              alerta: true,
            },
            {
              valor: resumo.dados.vencemEmBreve,
              rotulo: "vencem em até 30 dias",
            },
            {
              valor: resumo.dados.semAso,
              rotulo: "funcionários sem ASO",
              singular: "funcionário sem ASO",
              alerta: true,
            },
          ]}
        />
      )}
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3">
          <SelecaoDeFiltro
            nome="situacao"
            rotulo="Situação"
            opcoes={SITUACOES_VENCIMENTO}
            valor={params.situacao}
          />
          <SelecaoDeFiltro
            nome="tipo"
            rotulo="Tipo"
            opcoes={{ aso: "ASO", treinamento: "Treinamento" }}
            valor={params.tipo}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          {filtrando && (
            <Link
              href="/seguranca/vencimentos"
              className="h-9 content-center text-sm text-texto-2 hover:underline"
            >
              Limpar filtros
            </Link>
          )}
        </form>
        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : lista.dados.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            {filtrando
              ? "Nada com esses filtros."
              : "Nenhum ASO ou treinamento com validade registrado. Registre na página de cada funcionário."}
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-sm text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Vence em</th>
                  <th className="px-4 py-2 font-semibold">Funcionário</th>
                  <th className="px-4 py-2 font-semibold">O quê</th>
                  <th className="px-4 py-2 font-semibold">Realizado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.map((v) => (
                  <tr
                    key={`${v.tipo}-${v.funcionarioId}-${v.descricao}`}
                    className=""
                  >
                    <td className="px-4 py-2">
                      <Validade validade={v.validade} situacao={v.situacao} />
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/cadastros/funcionarios/${v.funcionarioId}`}
                        className="text-info hover:underline"
                      >
                        {v.funcionarioNome}
                      </Link>
                      <span className="block font-mono text-xs text-texto-3">
                        {v.matricula}
                      </span>
                    </td>
                    <td className="px-4 py-2">{v.descricao}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-texto-2">
                      {formatarData(v.data)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-borda px-4 py-2.5 text-sm text-texto-2">
              {lista.dados.length} {lista.dados.length === 1 ? "item" : "itens"}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
