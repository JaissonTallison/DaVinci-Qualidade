import type { Metadata } from "next";
import Link from "next/link";
import {
  STATUS_INSPECAO,
  TIPOS_INSPECAO,
  type DadosDoUsuario,
  type InspecaoResumo,
  type Pagina,
  type ResumoInspecoes,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { StatusDaInspecao } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  campoCompacto,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Inspeções" };

const FILTROS = ["busca", "status", "tipo", "pagina"] as const;

export default async function ListaDeInspecoes({
  searchParams,
}: PageProps<"/qualidade/inspecoes">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number], string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const [lista, resumo, eu] = await Promise.all([
    chamarApi<Pagina<InspecaoResumo>>(`/inspecoes?${consulta}`),
    chamarApi<ResumoInspecoes>("/inspecoes/resumo"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("qualidade.editar");
  const filtrando = FILTROS.some((f) => f !== "pagina" && params[f]);

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Inspeções</h1>
          {resumo.ok && (
            <p className="mt-1 text-base text-texto-2">
              {resumo.dados.emAndamento} em andamento ·{" "}
              {resumo.dados.reprovadas30Dias}{" "}
              {resumo.dados.reprovadas30Dias === 1 ? "reprovada" : "reprovadas"}{" "}
              nos últimos 30 dias
              {resumo.dados.taxaDeAprovacao30Dias !== null &&
                ` · ${resumo.dados.taxaDeAprovacao30Dias}% de aprovação`}
            </p>
          )}
        </div>
        {podeCriar && (
          <Link href="/qualidade/inspecoes/nova" className={botaoPrimario}>
            Nova inspeção
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
            placeholder="Número, objeto ou lote"
            aria-label="Buscar por número, objeto ou lote"
            className={`${campoCompacto} w-56`}
          />
          <SelecaoDeFiltro
            nome="status"
            rotulo="Status"
            opcoes={STATUS_INSPECAO}
            valor={params.status}
          />
          <SelecaoDeFiltro
            nome="tipo"
            rotulo="Tipo"
            opcoes={TIPOS_INSPECAO}
            valor={params.tipo}
          />
          <button type="submit" className={botaoSecundario}>
            Filtrar
          </button>
          {filtrando && (
            <Link
              href="/qualidade/inspecoes"
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
        ) : lista.dados.itens.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            {filtrando
              ? "Nenhuma inspeção com esses filtros."
              : "Nenhuma inspeção registrada. Para listas que se repetem, crie antes um modelo de inspeção."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-xs text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Número</th>
                  <th className="px-4 py-2 font-semibold">Objeto</th>
                  <th className="px-4 py-2 font-semibold">Tipo</th>
                  <th className="px-4 py-2 font-semibold">Data</th>
                  <th className="px-4 py-2 font-semibold">Inspetor</th>
                  <th className="px-4 py-2 font-semibold">Itens</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.itens.map((i) => (
                  <tr key={i.id} className="hover:bg-superficie-2">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Link
                        href={`/qualidade/inspecoes/${i.id}`}
                        className="font-mono text-sm font-medium text-info hover:underline"
                      >
                        {i.numero}
                      </Link>
                    </td>
                    <td className="max-w-md px-4 py-2">
                      <span className="line-clamp-2">{i.objeto}</span>
                      {i.lote && (
                        <span className="font-mono text-xs text-texto-3">
                          Lote {i.lote}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-texto-2">
                      {TIPOS_INSPECAO[i.tipo]}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatarData(i.data)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-texto-2">
                      {i.inspetor}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-texto-2">
                      {i.status === "em_andamento"
                        ? `${i.respondidos} de ${i.totalDeItens} respondidos`
                        : `${i.totalDeItens} itens`}
                      {i.naoConformes > 0 && (
                        <span className="block text-xs text-nao-conforme">
                          {i.naoConformes} NOK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <StatusDaInspecao status={i.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-borda px-4 py-2.5 text-sm text-texto-2">
              {lista.dados.total.toLocaleString("pt-BR")}{" "}
              {lista.dados.total === 1 ? "inspeção" : "inspeções"}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
