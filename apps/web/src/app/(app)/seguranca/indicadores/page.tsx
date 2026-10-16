import type { Metadata } from "next";
import Link from "next/link";
import type { DadosDoUsuario, IndicadoresSst } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { FaixaDeIndicadores } from "@/components/faixa-de-indicadores";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import { LancarHoras } from "./lancar-horas";

export const metadata: Metadata = { title: "Indicadores de SST" };

const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];
const taxa = (v: number | null) =>
  v === null
    ? "—"
    : v.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
const horas = (v: number | null) =>
  v === null ? "não lançadas" : v.toLocaleString("pt-BR");

export default async function Indicadores({
  searchParams,
}: PageProps<"/seguranca/indicadores">) {
  const { ano: anoPedido, aviso } = (await searchParams) as {
    ano?: string;
    aviso?: string;
  };
  const anoAtual = Number(hojeEmBrasilia().slice(0, 4));
  const ano = /^\d{4}$/.test(anoPedido ?? "") ? Number(anoPedido) : anoAtual;
  const [r, eu] = await Promise.all([
    chamarApi<IndicadoresSst>(`/acidentes/indicadores?ano=${ano}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const ind = r.dados;
  const podeLancar = eu.ok && eu.dados.permissoes.includes("seguranca.editar");
  const mesAtual = hojeEmBrasilia().slice(0, 7);

  return (
    <>
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Indicadores de SST · {ano}</h1>
          <p className="mt-1 text-base text-texto-2">
            Taxas por milhão de horas-homem trabalhadas (NBR 14280). Mês sem
            horas lançadas fica sem taxa e fora do total do ano.
          </p>
        </div>
        <nav aria-label="Ano" className="flex gap-4 text-base">
          <Link
            href={`/seguranca/indicadores?ano=${ano - 1}`}
            className="text-texto-2 hover:underline"
          >
            {ano - 1}
          </Link>
          {ano < anoAtual && (
            <Link
              href={`/seguranca/indicadores?ano=${ano + 1}`}
              className="text-texto-2 hover:underline"
            >
              {ano + 1}
            </Link>
          )}
        </nav>
      </header>
      {aviso === "horas" && (
        <p
          role="status"
          className="mt-4 rounded-sm border border-borda bg-superficie px-4 py-2.5 text-base text-texto"
        >
          Horas lançadas.
        </p>
      )}

      <section className={`${painel} mt-6`}>
        <FaixaDeIndicadores
          itens={[
            {
              rotulo: `Taxa de frequência (TF) em ${ano}`,
              valor: ind.total.tf,
            },
            { rotulo: `Taxa de gravidade (TG) em ${ano}`, valor: ind.total.tg },
            {
              rotulo: "Dias sem acidente com afastamento",
              valor: ind.diasSemAcidente,
            },
          ]}
        />
        <p className="border-t border-borda px-5 py-2.5 text-sm text-texto-2">
          {ind.total.horas === null
            ? "Sem horas lançadas no ano: lance as horas de cada mês para calcular TF e TG."
            : `${ind.total.acidentesComAfastamento} ${ind.total.acidentesComAfastamento === 1 ? "acidente" : "acidentes"} com afastamento e ${ind.total.diasPerdidosEDebitados} ${ind.total.diasPerdidosEDebitados === 1 ? "dia perdido" : "dias perdidos"} em ${ind.total.horas.toLocaleString("pt-BR")} horas.`}
          {ind.ultimoAcidenteComAfastamento &&
            ` Último acidente com afastamento: ${formatarData(ind.ultimoAcidenteComAfastamento)}.`}
        </p>
      </section>

      <section className={`${painel} mt-6`}>
        <h2 className={`${tituloDaSecao} px-5 pt-5`}>Mês a mês</h2>
        <div className="relative mt-3 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-superficie-2 text-sm text-texto-2">
              <tr>
                <th className="px-5 py-2 font-semibold">Mês</th>
                <th className="px-4 py-2 text-right font-semibold">
                  Horas trabalhadas
                </th>
                <th className="px-4 py-2 text-right font-semibold">
                  Acidentes com afastamento
                </th>
                <th className="px-4 py-2 text-right font-semibold">
                  Dias perdidos e debitados
                </th>
                <th className="px-4 py-2 text-right font-semibold">TF</th>
                <th className="px-4 py-2 text-right font-semibold">TG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {ind.meses
                .filter((m) => m.competencia <= mesAtual)
                .map((m) => (
                  <tr key={m.competencia}>
                    <td className="px-5 py-2">
                      {MESES[Number(m.competencia.slice(5)) - 1]}/
                      {m.competencia.slice(0, 4)}
                    </td>
                    <td
                      className={`px-4 py-2 text-right ${m.horas === null ? "text-texto-3" : ""}`}
                    >
                      {horas(m.horas)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {m.acidentesComAfastamento}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {m.diasPerdidosEDebitados}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {taxa(m.tf)}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {taxa(m.tg)}
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot className="border-t-2 border-borda-forte">
              <tr className="font-semibold">
                <td className="px-5 py-2">Ano</td>
                <td className="px-4 py-2 text-right">
                  {horas(ind.total.horas)}
                </td>
                <td className="px-4 py-2 text-right">
                  {ind.total.acidentesComAfastamento}
                </td>
                <td className="px-4 py-2 text-right">
                  {ind.total.diasPerdidosEDebitados}
                </td>
                <td className="px-4 py-2 text-right">{taxa(ind.total.tf)}</td>
                <td className="px-4 py-2 text-right">{taxa(ind.total.tg)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {podeLancar && (
        <LancarHoras
          mesSugerido={
            ind.meses.findLast(
              (m) => m.competencia <= mesAtual && m.horas === null,
            )?.competencia ?? mesAtual
          }
          maximo={mesAtual}
        />
      )}
    </>
  );
}
