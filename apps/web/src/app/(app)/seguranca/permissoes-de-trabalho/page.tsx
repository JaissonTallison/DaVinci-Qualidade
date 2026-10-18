import { ListFilter } from "lucide-react";
import { Pendencias } from "@/components/pendencias";
import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import {
  STATUS_PT,
  TIPOS_PT,
  type DadosDoUsuario,
  type Pagina,
  type PermissaoDeTrabalho,
  type ResumoPts,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { StatusDaPt } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import {
  botaoPrimario,
  botaoSecundario,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";
import { periodoDaPt } from "./periodo";

export const metadata: Metadata = { title: "Permissões de trabalho" };

export default async function PermissoesDeTrabalho({
  searchParams,
}: PageProps<"/seguranca/permissoes-de-trabalho">) {
  const params = (await searchParams) as { status?: string; tipo?: string };
  const consulta = new URLSearchParams();
  if (params.status) consulta.set("status", params.status);
  if (params.tipo) consulta.set("tipo", params.tipo);
  const [lista, resumo, eu] = await Promise.all([
    chamarApi<Pagina<PermissaoDeTrabalho>>(
      `/permissoes-de-trabalho?${consulta}`,
    ),
    chamarApi<ResumoPts>("/permissoes-de-trabalho/resumo"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("seguranca.editar");
  const filtrando = consulta.size > 0;
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Permissões de trabalho</h1>
          {resumo.ok && (
            <Pendencias
              itens={[
                {
                  valor: resumo.dados.aguardandoLiberacao,
                  rotulo: "aguardando liberação",
                },
                { valor: resumo.dados.emExecucao, rotulo: "em execução" },
                {
                  valor: resumo.dados.vencidas,
                  rotulo: "com horário vencido",
                  alerta: true,
                },
              ]}
            />
          )}
        </div>
        {podeCriar && (
          <Link
            href="/seguranca/permissoes-de-trabalho/nova"
            className={botaoPrimario}
          >
            <IconeDaTela href={"/seguranca/permissoes-de-trabalho/nova"} />
            Solicitar PT
          </Link>
        )}
      </header>
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3">
          <SelecaoDeFiltro
            nome="status"
            rotulo="Status"
            opcoes={STATUS_PT}
            valor={params.status}
          />
          <SelecaoDeFiltro
            nome="tipo"
            rotulo="Tipo"
            opcoes={TIPOS_PT}
            valor={params.tipo}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          {filtrando && (
            <Link
              href="/seguranca/permissoes-de-trabalho"
              className="h-9 content-center dv-voltar"
            >
              Limpar filtros
            </Link>
          )}
        </form>
        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : lista.dados.itens.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            {filtrando
              ? "Nenhuma PT com esses filtros."
              : "Nenhuma permissão de trabalho emitida."}
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-sm text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Número</th>
                  <th className="px-4 py-2 font-semibold">Tipo</th>
                  <th className="px-4 py-2 font-semibold">Local e serviço</th>
                  <th className="px-4 py-2 font-semibold">Período</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.itens.map((p) => (
                  <tr key={p.id} className="">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Link
                        href={`/seguranca/permissoes-de-trabalho/${p.id}`}
                        className="font-mono text-sm font-medium text-info hover:underline"
                      >
                        {p.numero}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-texto-2">
                      {TIPOS_PT[p.tipo]}
                    </td>
                    <td className="max-w-md px-4 py-2">
                      {p.local}
                      <span className="block truncate text-sm text-texto-2">
                        {p.servico}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {periodoDaPt(p.inicio, p.fim)}
                    </td>
                    <td className="px-4 py-2">
                      <StatusDaPt
                        status={p.status}
                        vencida={p.vencida}
                        fim={p.fim}
                      />
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
