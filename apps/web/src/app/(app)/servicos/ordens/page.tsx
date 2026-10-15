import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import { ListFilter } from "lucide-react";
import {
  STATUS_OS,
  type DadosDoUsuario,
  type OrdemDeServico,
  type Pagina,
  type ResumoServicos,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { StatusDaOs } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Ordens de serviço" };

export default async function Ordens({
  searchParams,
}: PageProps<"/servicos/ordens">) {
  const { status } = (await searchParams) as { status?: string };
  const [lista, resumo, eu] = await Promise.all([
    chamarApi<Pagina<OrdemDeServico>>(
      `/ordens-de-servico${status ? `?status=${encodeURIComponent(status)}` : ""}`,
    ),
    chamarApi<ResumoServicos>("/servicos/resumo"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("servicos.editar");
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Ordens de serviço</h1>
          {resumo.ok && (
            <p className="mt-1 text-base text-texto-2">
              {resumo.dados.osAbertas} em aberto ·{" "}
              <span
                className={resumo.dados.osAtrasadas ? "text-nao-conforme" : ""}
              >
                {resumo.dados.osAtrasadas} atrasadas
              </span>
            </p>
          )}
        </div>
        {podeCriar && (
          <Link href="/servicos/ordens/nova" className={botaoPrimario}>
            <IconeDaTela href={"/servicos/ordens/nova"} />
            Abrir OS
          </Link>
        )}
      </header>
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3">
          <SelecaoDeFiltro
            nome="status"
            rotulo="Status"
            opcoes={STATUS_OS}
            valor={status}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
        </form>
        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : lista.dados.itens.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            Nenhuma ordem de serviço{status ? " com este status" : ""}.
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-xs text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Número</th>
                  <th className="px-4 py-2 font-semibold">Serviço</th>
                  <th className="px-4 py-2 font-semibold">Cliente</th>
                  <th className="px-4 py-2 font-semibold">Prazo</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold">Avaliação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.itens.map((o) => (
                  <tr key={o.id} className="hover:bg-superficie-2">
                    <td className="px-4 py-2 font-mono text-sm whitespace-nowrap">
                      <Link
                        href={`/servicos/ordens/${o.id}`}
                        className="text-info hover:underline"
                      >
                        {o.numero}
                      </Link>
                    </td>
                    <td className="max-w-md px-4 py-2">{o.titulo}</td>
                    <td className="px-4 py-2 text-texto-2">{o.clienteNome}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatarData(o.prazo)}
                    </td>
                    <td className="px-4 py-2">
                      <StatusDaOs status={o.status} atrasada={o.atrasada} />
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {o.nota ? `${o.nota} de 5` : "—"}
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
