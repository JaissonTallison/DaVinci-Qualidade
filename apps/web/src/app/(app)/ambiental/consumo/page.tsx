import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  FONTES_DE_CONSUMO,
  UNIDADE_DA_FONTE,
  type ConsumoDoMes,
  type DadosDoUsuario,
  type FonteDeConsumo,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Bloco } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { hojeEmBrasilia } from "@/lib/datas";
import {
  botaoSecundario,
  painel,
  tituloDaPagina,
  tituloDaSecao,
} from "@/lib/estilos";
import { FormularioDeConsumo } from "./formulario";
import { GraficoDeConsumo } from "./grafico";

export const metadata: Metadata = { title: "Consumo de água e energia" };
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const num = (n: number) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export default async function Consumo({
  searchParams,
}: PageProps<"/ambiental/consumo">) {
  const { ano: anoUrl, aviso } = (await searchParams) as {
    ano?: string;
    aviso?: string;
  };
  const hoje = hojeEmBrasilia();
  const anoAtual = Number(hoje.slice(0, 4));
  const ano =
    Number(anoUrl) >= 2000 && Number(anoUrl) <= anoAtual
      ? Number(anoUrl)
      : anoAtual;
  const [r, eu] = await Promise.all([
    chamarApi<ConsumoDoMes[]>(`/consumo-ambiental?ano=${ano}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("ambiental.editar");
  const dados = r.ok ? r.dados : [];
  const fontes = (Object.keys(FONTES_DE_CONSUMO) as FonteDeConsumo[]).filter(
    (f) => dados.some((c) => c.fonte === f),
  );
  const meses = ano === anoAtual ? Number(hoje.slice(5, 7)) : 12;
  const valor = (f: FonteDeConsumo, m: number) =>
    dados.find(
      (c) =>
        c.fonte === f &&
        c.competencia === `${ano}-${String(m).padStart(2, "0")}`,
    );
  const custoTotal = dados.reduce((t, c) => t + (c.custo ?? 0), 0);
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Consumo de água e energia</h1>
          <p className="mt-1 max-w-2xl text-base text-texto-2">
            Leitura mensal de água, energia e combustíveis, uma por fonte e mês.
            Os combustíveis e a energia alimentam o inventário de GEE.
          </p>
        </div>
        <nav aria-label="Ano" className="flex items-center gap-2">
          <Link
            href={`/ambiental/consumo?ano=${ano - 1}`}
            className={botaoSecundario}
            aria-label={`Ano ${ano - 1}`}
          >
            <ChevronLeft aria-hidden size={16} strokeWidth={2} />
          </Link>
          <span className="min-w-14 text-center text-lg font-semibold tabular-nums">
            {ano}
          </span>
          {ano < anoAtual && (
            <Link
              href={`/ambiental/consumo?ano=${ano + 1}`}
              className={botaoSecundario}
              aria-label={`Ano ${ano + 1}`}
            >
              <ChevronRight aria-hidden size={16} strokeWidth={2} />
            </Link>
          )}
        </nav>
      </header>
      <Aviso avisos={{ registrado: "Leitura registrada." }} chave={aviso} />
      {podeEditar && (
        <Bloco
          titulo="Registrar leitura"
          descricao="Valor da conta ou do medidor no mês. O mesmo mês de novo substitui o valor."
        >
          <FormularioDeConsumo mesAtual={hoje.slice(0, 7)} />
        </Bloco>
      )}
      {!r.ok ? (
        <div className="mt-6">
          <AvisoDeErro erro={r.erro} />
        </div>
      ) : fontes.length === 0 ? (
        <p className={`${painel} mt-6 px-5 py-8 text-base text-texto-2`}>
          Nenhuma leitura em {ano}.
        </p>
      ) : (
        <>
          <section className={`${painel} mt-6 p-5`}>
            <h2 className={tituloDaSecao}>Evolução no ano</h2>
            <div className="mt-3">
              <GraficoDeConsumo ano={ano} consumos={dados} fontes={fontes} />
            </div>
          </section>
          <section className={`${painel} mt-6`}>
            <h2 className={`${tituloDaSecao} px-5 pt-5`}>Leituras de {ano}</h2>
            <div className="relative mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-superficie-2 text-sm text-texto-2">
                  <tr>
                    <th className="px-5 py-2 font-semibold">Mês</th>
                    {fontes.map((f) => (
                      <th
                        key={f}
                        className="px-4 py-2 text-right font-semibold"
                      >
                        {FONTES_DE_CONSUMO[f]} ({UNIDADE_DA_FONTE[f]})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {Array.from({ length: meses }, (_, i) => i + 1).map((m) => (
                    <tr key={m}>
                      <td className="px-5 py-2">{MESES[m - 1]}</td>
                      {fontes.map((f) => {
                        const c = valor(f, m);
                        return (
                          <td
                            key={f}
                            className={`px-4 py-2 text-right tabular-nums ${c ? "" : "text-texto-3"}`}
                          >
                            {c ? num(c.quantidade) : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-borda-forte font-semibold">
                  <tr>
                    <td className="px-5 py-2">Total</td>
                    {fontes.map((f) => (
                      <td key={f} className="px-4 py-2 text-right tabular-nums">
                        {num(
                          dados
                            .filter((c) => c.fonte === f)
                            .reduce((t, c) => t + c.quantidade, 0),
                        )}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
            {custoTotal > 0 && (
              <p className="border-t border-borda px-5 py-2 text-sm text-texto-2">
                Custo informado no ano:{" "}
                {custoTotal.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            )}
          </section>
        </>
      )}
    </>
  );
}
