import { ListFilter } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import {
  CLASSES_RO,
  TIPOS_RO,
  type DadosDoUsuario,
  type RiscoOuOportunidade,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { ClasseDoRo } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Riscos e oportunidades" };

export default async function Ros({
  searchParams,
}: PageProps<"/sgi/riscos-e-oportunidades">) {
  const params = (await searchParams) as {
    tipo?: string;
    classe?: string;
    situacao?: string;
  };
  const consulta = new URLSearchParams();
  for (const k of ["tipo", "classe", "situacao"] as const)
    if (params[k]) consulta.set(k, params[k]!);
  const [lista, eu] = await Promise.all([
    chamarApi<RiscoOuOportunidade[]>(`/riscos-e-oportunidades?${consulta}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("sgi.editar");
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Riscos e oportunidades</h1>
          <p className="mt-1 max-w-2xl text-base text-texto-2">
            Dos processos do sistema de gestão (ISO 9001, 6.1). Os riscos de SST
            ficam no PGR.
          </p>
        </div>
        {podeCriar && (
          <Link
            href="/sgi/riscos-e-oportunidades/novo"
            className={botaoPrimario}
          >
            <IconeDaTela href={"/sgi/riscos-e-oportunidades/novo"} />
            Registrar
          </Link>
        )}
      </header>
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3">
          <SelecaoDeFiltro
            nome="tipo"
            rotulo="Tipo"
            opcoes={TIPOS_RO}
            valor={params.tipo}
          />
          <SelecaoDeFiltro
            nome="classe"
            rotulo="Classificação"
            opcoes={CLASSES_RO}
            valor={params.classe}
          />
          <SelecaoDeFiltro
            nome="situacao"
            rotulo="Situação"
            opcoes={{ encerrados: "Encerrados", todos: "Todos" }}
            valor={params.situacao}
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
            Nenhum registro{consulta.size ? " com esses filtros" : ""}.
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-xs text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Classificação</th>
                  <th className="px-4 py-2 font-semibold">Tipo</th>
                  <th className="px-4 py-2 font-semibold">Processo</th>
                  <th className="px-4 py-2 font-semibold">Descrição</th>
                  <th className="px-4 py-2 font-semibold">Prazo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.map((r) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-superficie-2 ${r.encerradoEm ? "text-texto-3" : ""}`}
                  >
                    <td className="px-4 py-2">
                      <ClasseDoRo classe={r.classe} />
                    </td>
                    <td className="px-4 py-2">{TIPOS_RO[r.tipo]}</td>
                    <td className="px-4 py-2 text-texto-2">{r.processo}</td>
                    <td className="max-w-md px-4 py-2">
                      <Link
                        href={`/sgi/riscos-e-oportunidades/${r.id}`}
                        className="text-info hover:underline"
                      >
                        {r.descricao}
                      </Link>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {r.encerradoEm ? (
                        "Encerrado"
                      ) : r.prazo ? (
                        <span
                          className={r.prazoVencido ? "text-nao-conforme" : ""}
                        >
                          {formatarData(r.prazo)}
                          {r.prazoVencido && " · vencido"}
                        </span>
                      ) : (
                        "—"
                      )}
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
