import type { Metadata } from "next";
import Link from "next/link";
import {
  SITUACOES_INSTRUMENTO,
  type DadosDoUsuario,
  type InstrumentoResumo,
  type Pagina,
  type ResumoCalibracao,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { SituacaoDoInstrumento } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, prazoRelativo } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  campoCompacto,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Calibração" };

const FILTROS = ["busca", "situacao", "pagina"] as const;

export default async function ListaDeInstrumentos({
  searchParams,
}: PageProps<"/qualidade/calibracao">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number], string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const [lista, resumo, eu] = await Promise.all([
    chamarApi<Pagina<InstrumentoResumo>>(`/instrumentos?${consulta}`),
    chamarApi<ResumoCalibracao>("/instrumentos/resumo"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("qualidade.editar");
  const filtrando = Boolean(params.busca || params.situacao);

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Calibração</h1>
          {resumo.ok && (
            <p className="mt-1 text-base text-texto-2">
              {resumo.dados.vencidos}{" "}
              {resumo.dados.vencidos === 1 ? "vencido" : "vencidos"} ·{" "}
              {resumo.dados.reprovados}{" "}
              {resumo.dados.reprovados === 1 ? "reprovado" : "reprovados"} ·{" "}
              {resumo.dados.vencemEmBreve} vencem em até 30 dias ·{" "}
              {resumo.dados.semCalibracao} sem calibração
            </p>
          )}
        </div>
        {podeCriar && (
          <Link href="/qualidade/calibracao/novo" className={botaoPrimario}>
            Cadastrar instrumento
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
            placeholder="TAG ou descrição"
            aria-label="Buscar por TAG ou descrição"
            className={`${campoCompacto} w-56`}
          />
          <SelecaoDeFiltro
            nome="situacao"
            rotulo="Situação"
            opcoes={SITUACOES_INSTRUMENTO}
            valor={params.situacao}
          />
          <button type="submit" className={botaoSecundario}>
            Filtrar
          </button>
          {filtrando && (
            <Link
              href="/qualidade/calibracao"
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
              ? "Nenhum instrumento com esses filtros."
              : "Nenhum instrumento cadastrado. Cadastre os instrumentos usados nas inspeções e medições."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-xs text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">TAG</th>
                  <th className="px-4 py-2 font-semibold">Instrumento</th>
                  <th className="px-4 py-2 font-semibold">Local</th>
                  <th className="px-4 py-2 font-semibold">Última</th>
                  <th className="px-4 py-2 font-semibold">Próxima</th>
                  <th className="px-4 py-2 font-semibold">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.itens.map((i) => (
                  <tr key={i.id} className="hover:bg-superficie-2">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Link
                        href={`/qualidade/calibracao/${i.id}`}
                        className="font-mono text-sm font-medium text-info hover:underline"
                      >
                        {i.tag}
                      </Link>
                    </td>
                    <td className="max-w-md px-4 py-2">
                      {i.descricao}
                      <span className="block text-xs text-texto-3">
                        a cada {i.frequenciaMeses}{" "}
                        {i.frequenciaMeses === 1 ? "mês" : "meses"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-texto-2">{i.local}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {i.ultimaCalibracao
                        ? formatarData(i.ultimaCalibracao)
                        : "—"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {i.proximaCalibracao
                        ? formatarData(i.proximaCalibracao)
                        : "—"}
                      {i.proximaCalibracao &&
                        i.situacao !== "fora_de_uso" &&
                        i.situacao !== "reprovado" && (
                          <span
                            className={`block text-xs ${i.situacao === "vencido" ? "text-nao-conforme" : "text-texto-3"}`}
                          >
                            {prazoRelativo(i.proximaCalibracao)}
                          </span>
                        )}
                    </td>
                    <td className="px-4 py-2">
                      <SituacaoDoInstrumento situacao={i.situacao} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-borda px-4 py-2.5 text-sm text-texto-2">
              {lista.dados.total.toLocaleString("pt-BR")}{" "}
              {lista.dados.total === 1 ? "instrumento" : "instrumentos"}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
