import { ListFilter, Plus } from "@/components/icones";
import type { Metadata } from "next";
import Link from "next/link";
import {
  STATUS_PROCESSO,
  type DadosDoUsuario,
  type Processo,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { StatusDoProcesso } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel } from "@/lib/estilos";
import { Botao } from "@/components/botao";
import { CabecalhoDaPagina } from "@/components/cabecalho-da-pagina";

export const metadata: Metadata = { title: "Modelagem de processos" };

export default async function Processos({
  searchParams,
}: PageProps<"/qualidade/processos">) {
  const { status } = (await searchParams) as { status?: string };
  const [lista, eu] = await Promise.all([
    chamarApi<Processo[]>(
      `/processos${status ? `?status=${encodeURIComponent(status)}` : ""}`,
    ),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("qualidade.editar");
  return (
    <>
      <CabecalhoDaPagina
        titulo="Modelagem de processos"
        descricao="Cadastro e governança dos processos da organização: elaboração, revisão, aprovação, publicação e histórico. O editor de diagramas chega na próxima fase."
        acoes={
          podeCriar && (
            <Botao
              href="/qualidade/processos/novo"
              variante="primario"
              tamanho="grande"
              icone={Plus}
            >
              Novo processo
            </Botao>
          )
        }
      />
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3">
          <SelecaoDeFiltro
            nome="status"
            rotulo="Situação"
            opcoes={STATUS_PROCESSO}
            valor={status}
          />
          <Botao type="submit" icone={ListFilter}>
            Filtrar
          </Botao>
        </form>
        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : lista.dados.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            Nenhum processo{status ? " com esta situação" : " cadastrado"}.
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-xs uppercase tracking-[0.04em] text-texto-2">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Código</th>
                  <th className="px-4 py-2.5 font-semibold">Processo</th>
                  <th className="px-4 py-2.5 font-semibold">Departamento</th>
                  <th className="px-4 py-2.5 font-semibold">Rev.</th>
                  <th className="px-4 py-2.5 font-semibold">Situação</th>
                  <th className="px-4 py-2.5 font-semibold">Próxima revisão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono text-sm whitespace-nowrap">
                      <Link
                        href={`/qualidade/processos/${p.id}`}
                        className="text-info hover:underline"
                      >
                        {p.codigo}
                      </Link>
                    </td>
                    <td className="max-w-md px-4 py-3">{p.nome}</td>
                    <td className="px-4 py-3 text-texto-2">
                      {p.departamento ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-texto-2">
                      {p.revisaoAtual > 0 ? `Rev. ${p.revisaoAtual}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusDoProcesso
                        status={p.status}
                        vencida={p.revisaoVencida}
                        proximaRevisao={p.dataProximaRevisao}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-texto-2">
                      {p.dataProximaRevisao
                        ? formatarData(p.dataProximaRevisao)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
