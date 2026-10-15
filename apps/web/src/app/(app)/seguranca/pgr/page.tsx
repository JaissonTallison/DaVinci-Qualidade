import { ListFilter } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import {
  GRUPOS_DE_RISCO,
  NIVEIS_DE_RISCO,
  type DadosDoUsuario,
  type ResumoPgr,
  type Risco,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { NivelDoRisco } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  campoCompacto,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "PGR" };

export default async function Pgr({
  searchParams,
}: PageProps<"/seguranca/pgr">) {
  const params = (await searchParams) as {
    grupo?: string;
    nivel?: string;
    busca?: string;
  };
  const consulta = new URLSearchParams();
  for (const k of ["grupo", "nivel", "busca"] as const)
    if (params[k]) consulta.set(k, params[k]!);
  const [lista, resumo, eu] = await Promise.all([
    chamarApi<Risco[]>(`/riscos?${consulta}`),
    chamarApi<ResumoPgr>("/riscos/resumo"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("seguranca.editar");
  const filtrando = consulta.size > 0;
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>PGR · Inventário de riscos</h1>
          {resumo.ok && (
            <p className="mt-1 text-base text-texto-2">
              {resumo.dados.criticos}{" "}
              {resumo.dados.criticos === 1 ? "crítico" : "críticos"} ·{" "}
              {resumo.dados.altos} {resumo.dados.altos === 1 ? "alto" : "altos"}{" "}
              ·{" "}
              <span
                className={
                  resumo.dados.acoesVencidas > 0 ? "text-nao-conforme" : ""
                }
              >
                {resumo.dados.acoesVencidas} com prazo de ação vencido
              </span>
            </p>
          )}
        </div>
        {podeCriar && (
          <Link href="/seguranca/pgr/novo" className={botaoPrimario}>
            <IconeDaTela href={"/seguranca/pgr/novo"} />
            Cadastrar risco
          </Link>
        )}
      </header>
      <section className={`${painel} mt-6`}>
        <form
          className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3"
          role="search"
        >
          <input
            name="busca"
            defaultValue={params.busca}
            placeholder="Setor, atividade ou perigo"
            aria-label="Buscar"
            className={`${campoCompacto} w-60`}
          />
          <SelecaoDeFiltro
            nome="grupo"
            rotulo="Grupo"
            opcoes={GRUPOS_DE_RISCO}
            valor={params.grupo}
          />
          <SelecaoDeFiltro
            nome="nivel"
            rotulo="Nível"
            opcoes={NIVEIS_DE_RISCO}
            valor={params.nivel}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          {filtrando && (
            <Link
              href="/seguranca/pgr"
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
              ? "Nenhum risco com esses filtros."
              : "Nenhum risco no inventário. Percorra cada setor e registre os perigos que encontrar."}
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-xs text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Nível</th>
                  <th className="px-4 py-2 font-semibold">
                    Setor ou atividade
                  </th>
                  <th className="px-4 py-2 font-semibold">Perigo</th>
                  <th className="px-4 py-2 font-semibold">Grupo</th>
                  <th className="px-4 py-2 font-semibold">S × P</th>
                  <th className="px-4 py-2 font-semibold">Prazo da ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.map((r) => (
                  <tr key={r.id} className="hover:bg-superficie-2">
                    <td className="px-4 py-2">
                      <NivelDoRisco nivel={r.nivel} />
                    </td>
                    <td className="px-4 py-2">{r.local}</td>
                    <td className="max-w-md px-4 py-2">
                      <Link
                        href={`/seguranca/pgr/${r.id}`}
                        className="text-info hover:underline"
                      >
                        {r.perigo}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-texto-2">
                      {GRUPOS_DE_RISCO[r.grupo]}
                    </td>
                    <td className="px-4 py-2 tabular-nums text-texto-2">
                      {r.severidade} × {r.probabilidade}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {r.prazo ? (
                        <span
                          className={r.acaoVencida ? "text-nao-conforme" : ""}
                        >
                          {formatarData(r.prazo)}
                          {r.acaoVencida && " · vencido"}
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
