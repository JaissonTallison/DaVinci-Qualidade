import { ListFilter } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import {
  STATUS_MUDANCA,
  type DadosDoUsuario,
  type Mudanca,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { StatusDaMudanca } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Gestão de mudanças" };

export default async function Mudancas({
  searchParams,
}: PageProps<"/sgi/mudancas">) {
  const { status } = (await searchParams) as { status?: string };
  const [lista, eu] = await Promise.all([
    chamarApi<Mudanca[]>(
      `/mudancas${status ? `?status=${encodeURIComponent(status)}` : ""}`,
    ),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("sgi.editar");
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Gestão de mudanças</h1>
          <p className="mt-1 max-w-2xl text-base text-texto-2">
            Mudanças planejadas no sistema de gestão (ISO 9001, 6.3): avaliadas
            antes, verificadas depois.
          </p>
        </div>
        {podeCriar && (
          <Link href="/sgi/mudancas/nova" className={botaoPrimario}>
            <IconeDaTela href={"/sgi/mudancas/nova"} />
            Propor mudança
          </Link>
        )}
      </header>
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3">
          <SelecaoDeFiltro
            nome="status"
            rotulo="Status"
            opcoes={STATUS_MUDANCA}
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
        ) : lista.dados.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            Nenhuma mudança{status ? " com este status" : " registrada"}.
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-xs text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Número</th>
                  <th className="px-4 py-2 font-semibold">Mudança</th>
                  <th className="px-4 py-2 font-semibold">Responsável</th>
                  <th className="px-4 py-2 font-semibold">Prevista</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.map((m) => (
                  <tr key={m.id} className="hover:bg-superficie-2">
                    <td className="px-4 py-2 font-mono text-sm whitespace-nowrap">
                      <Link
                        href={`/sgi/mudancas/${m.id}`}
                        className="text-info hover:underline"
                      >
                        {m.numero}
                      </Link>
                    </td>
                    <td className="max-w-md px-4 py-2">{m.titulo}</td>
                    <td className="px-4 py-2 text-texto-2">{m.responsavel}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatarData(m.dataPrevista)}
                    </td>
                    <td className="px-4 py-2">
                      <StatusDaMudanca status={m.status} />
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
