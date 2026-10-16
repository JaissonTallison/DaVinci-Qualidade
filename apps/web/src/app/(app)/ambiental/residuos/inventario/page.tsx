import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import {
  CLASSES_RESIDUO,
  UNIDADES_RESIDUO,
  type ClasseResiduo,
  type InventarioDeResiduos,
  type SaidaDeResiduo,
  type UnidadeResiduo,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { BotaoImprimir } from "@/components/botao-imprimir";
import { chamarApi } from "@/lib/api";
import { linkCsv } from "@/lib/csv";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";
import {
  botaoSecundario,
  painel,
  tituloDaPagina,
  tituloDaSecao,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Inventário de resíduos" };

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Inventário anual por resíduo e as saídas do ano em planilha, para o inventário estadual e o lançamento no SINIR. */
export default async function Inventario({
  searchParams,
}: PageProps<"/ambiental/residuos/inventario">) {
  const ano = Number(
    ((await searchParams) as { ano?: string }).ano ??
      hojeEmBrasilia().slice(0, 4),
  );
  const [inv, saidas] = await Promise.all([
    chamarApi<InventarioDeResiduos>(
      `/ecoeficiencia/inventario-de-residuos?ano=${ano}`,
    ),
    chamarApi<SaidaDeResiduo[]>(`/residuos/saidas?ano=${ano}`),
  ]);
  if (!inv.ok) return <AvisoDeErro erro={inv.erro} />;
  const i = inv.dados;
  const csvInventario = linkCsv(
    [
      "Resíduo",
      "Classe",
      "Destinação",
      "Saídas",
      "Quantidade",
      "Unidade",
      "Custo (R$)",
      "Saídas sem CDF",
    ],
    i.linhas.map((l) => [
      l.nome,
      CLASSES_RESIDUO[l.classe as ClasseResiduo],
      l.destinacao,
      l.saidas,
      l.quantidade,
      UNIDADES_RESIDUO[l.unidade as UnidadeResiduo],
      l.custo,
      l.semCdf,
    ]),
  );
  const csvMtr = saidas.ok
    ? linkCsv(
        [
          "Data",
          "MTR",
          "Resíduo",
          "Classe",
          "Quantidade",
          "Unidade",
          "Transportador",
          "Destinador",
          "CDF",
          "Data do CDF",
          "Custo (R$)",
        ],
        saidas.dados.map((s) => [
          s.data,
          s.mtr,
          s.residuoNome,
          s.classe,
          s.quantidade,
          UNIDADES_RESIDUO[s.unidade],
          s.transportador,
          s.destinador,
          s.cdfNumero,
          s.cdfData,
          s.custo,
        ]),
      )
    : null;
  return (
    <article>
      <div className="print:hidden">
        <Link
          href="/ambiental/residuos"
          className="text-sm text-texto-2 hover:underline"
        >
          Resíduos
        </Link>
      </div>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className={tituloDaPagina}>Inventário de resíduos de {ano}</h1>
        <nav aria-label="Ano" className="flex gap-3 text-sm print:hidden">
          <Link href={`?ano=${ano - 1}`} className="text-info hover:underline">
            {ano - 1}
          </Link>
          <Link href={`?ano=${ano + 1}`} className="text-info hover:underline">
            {ano + 1}
          </Link>
        </nav>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <a
          href={csvInventario}
          download={`inventario-residuos-${ano}.csv`}
          className={botaoSecundario}
        >
          <Download aria-hidden size={16} strokeWidth={2} />
          Inventário em planilha
        </a>
        {csvMtr && (
          <a
            href={csvMtr}
            download={`saidas-mtr-${ano}.csv`}
            className={botaoSecundario}
          >
            <Download aria-hidden size={16} strokeWidth={2} />
            Saídas com MTR (para o SINIR)
          </a>
        )}
        <BotaoImprimir />
      </div>
      <section className={`${painel} mt-6`}>
        {i.linhas.length === 0 ? (
          <p className="px-5 py-6 text-base text-texto-2">
            Nenhuma saída de resíduo em {ano}.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borda text-left text-texto-2">
                <th className="px-4 py-2 font-semibold">Resíduo</th>
                <th className="px-4 py-2 font-semibold">Classe</th>
                <th className="px-4 py-2 font-semibold">Destinação</th>
                <th className="px-4 py-2 text-right font-semibold">Saídas</th>
                <th className="px-4 py-2 text-right font-semibold">
                  Quantidade
                </th>
                <th className="px-4 py-2 text-right font-semibold">Custo</th>
                <th className="px-4 py-2 text-right font-semibold">Sem CDF</th>
              </tr>
            </thead>
            <tbody>
              {i.linhas.map((l) => (
                <tr key={l.residuoId} className="border-b border-borda">
                  <td data-rotulo="Resíduo" className="px-4 py-2">
                    {l.nome}
                  </td>
                  <td data-rotulo="Classe" className="px-4 py-2">
                    {CLASSES_RESIDUO[l.classe as ClasseResiduo]}
                  </td>
                  <td data-rotulo="Destinação" className="px-4 py-2">
                    {l.destinacao}
                  </td>
                  <td
                    data-rotulo="Saídas"
                    className="px-4 py-2 text-right tabular-nums"
                  >
                    {l.saidas}
                  </td>
                  <td
                    data-rotulo="Quantidade"
                    className="px-4 py-2 text-right tabular-nums"
                  >
                    {l.quantidade.toLocaleString("pt-BR", {
                      maximumFractionDigits: 3,
                    })}{" "}
                    {UNIDADES_RESIDUO[l.unidade as UnidadeResiduo]}
                  </td>
                  <td
                    data-rotulo="Custo"
                    className="px-4 py-2 text-right tabular-nums"
                  >
                    {brl(l.custo)}
                  </td>
                  <td
                    data-rotulo="Sem CDF"
                    className={`px-4 py-2 text-right tabular-nums ${l.semCdf ? "font-semibold text-nao-conforme" : ""}`}
                  >
                    {l.semCdf}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="px-4 py-2" colSpan={5}>
                  Custo total da destinação
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {brl(i.custoTotal)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </section>
      {saidas.ok && saidas.dados.length > 0 && (
        <section className={`${painel} mt-6`}>
          <h2 className={`${tituloDaSecao} px-5 pt-5`}>Saídas do ano</h2>
          <ul className="mt-3 divide-y divide-borda border-t border-borda text-sm">
            {saidas.dados.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap justify-between gap-2 px-5 py-1.5"
              >
                <span>
                  {formatarData(s.data)} ·{" "}
                  <span className="font-mono">{s.mtr}</span> · {s.residuoNome}
                </span>
                <span className="text-texto-2">
                  {s.destinador}
                  {s.cdfNumero ? ` · CDF ${s.cdfNumero}` : " · sem CDF"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
