import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CircleAlert } from "lucide-react";
import {
  FONTES_DE_CONSUMO,
  type DadosDoUsuario,
  type InventarioGee,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { hojeEmBrasilia } from "@/lib/datas";
import { botaoSecundario, painel, tituloDaPagina } from "@/lib/estilos";
import { FormularioDeFator } from "./formulario";

export const metadata: Metadata = { title: "Inventário de GEE" };
const t = (n: number) =>
  n.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 3,
  });

export default async function Gee({
  searchParams,
}: PageProps<"/ambiental/gee">) {
  const { ano: anoUrl, aviso } = (await searchParams) as {
    ano?: string;
    aviso?: string;
  };
  const anoAtual = Number(hojeEmBrasilia().slice(0, 4));
  const ano =
    Number(anoUrl) >= 2000 && Number(anoUrl) <= anoAtual
      ? Number(anoUrl)
      : anoAtual;
  const [r, eu] = await Promise.all([
    chamarApi<InventarioGee>(`/consumo-ambiental/gee?ano=${ano}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("ambiental.editar");
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Inventário de GEE</h1>
          <p className="mt-1 max-w-2xl text-base text-texto-2">
            Emissões de gases de efeito estufa calculadas a partir do consumo:
            escopo 1 (combustíveis queimados na empresa) e escopo 2 (energia
            elétrica comprada). Emissão = consumo × fator de emissão do ano.
          </p>
        </div>
        <nav aria-label="Ano" className="flex items-center gap-2">
          <Link
            href={`/ambiental/gee?ano=${ano - 1}`}
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
              href={`/ambiental/gee?ano=${ano + 1}`}
              className={botaoSecundario}
              aria-label={`Ano ${ano + 1}`}
            >
              <ChevronRight aria-hidden size={16} strokeWidth={2} />
            </Link>
          )}
        </nav>
      </header>
      <Aviso
        avisos={{ fator: "Fator salvo. O inventário foi recalculado." }}
        chave={aviso}
      />
      {!r.ok ? (
        <div className="mt-6">
          <AvisoDeErro erro={r.erro} />
        </div>
      ) : (
        <>
          <section
            className={`${painel} mt-6 grid grid-cols-1 divide-y divide-borda sm:grid-cols-3 sm:divide-x sm:divide-y-0`}
          >
            {[
              ["Escopo 1", r.dados.escopo1],
              ["Escopo 2", r.dados.escopo2],
              ["Total", r.dados.total],
            ].map(([rotulo, valor]) => (
              <div key={rotulo as string} className="p-5">
                <p className="text-sm text-texto-2">{rotulo}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {t(valor as number)}{" "}
                  <span className="text-base font-normal text-texto-2">
                    t CO₂e
                  </span>
                </p>
              </div>
            ))}
          </section>
          {r.dados.semFator.length > 0 && (
            <p className="mt-4 inline-flex items-start gap-2 rounded-xs bg-nao-conforme/10 px-3 py-2 text-base text-nao-conforme">
              <CircleAlert
                aria-hidden
                size={18}
                strokeWidth={2}
                className="mt-0.5 shrink-0"
              />
              Total incompleto: falta o fator de{" "}
              {r.dados.semFator
                .map((f) => FONTES_DE_CONSUMO[f].toLowerCase())
                .join(", ")}{" "}
              em {ano}.
            </p>
          )}
          <section className={`${painel} mt-6`}>
            {r.dados.linhas.length === 0 ? (
              <p className="px-5 py-8 text-base text-texto-2">
                Sem consumo de energia ou combustível em {ano}.{" "}
                <Link
                  href={`/ambiental/consumo?ano=${ano}`}
                  className="text-info hover:underline"
                >
                  Registre as leituras
                </Link>
                .
              </p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-superficie-2 text-xs text-texto-2">
                    <tr>
                      <th className="px-5 py-2 font-semibold">Fonte</th>
                      <th className="px-4 py-2 font-semibold">Escopo</th>
                      <th className="px-4 py-2 text-right font-semibold">
                        Consumo no ano
                      </th>
                      <th className="px-4 py-2 text-right font-semibold">
                        Fator (kg CO₂e)
                      </th>
                      <th className="px-4 py-2 font-semibold">Referência</th>
                      <th className="px-4 py-2 text-right font-semibold">
                        Emissão (t CO₂e)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borda">
                    {r.dados.linhas.map((l) => (
                      <tr key={l.fonte}>
                        <td className="px-5 py-2.5">
                          {FONTES_DE_CONSUMO[l.fonte]}
                        </td>
                        <td className="px-4 py-2.5">{l.escopo}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                          {l.consumo.toLocaleString("pt-BR", {
                            maximumFractionDigits: 1,
                          })}{" "}
                          {l.unidade}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right tabular-nums ${l.fator === null ? "text-nao-conforme" : ""}`}
                        >
                          {l.fator === null
                            ? "Falta informar"
                            : `${l.fator.toLocaleString("pt-BR", { maximumFractionDigits: 6 })} / ${l.unidade}`}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-texto-2">
                          {l.referencia ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                          {l.emissao === null ? "—" : t(l.emissao)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          {podeEditar && (
            <Recolhido titulo={`Informar fator de emissão de ${ano}`}>
              <p className="mb-4 max-w-3xl text-base text-texto-2">
                Use o fator oficial do ano (por exemplo, a ferramenta do
                Programa Brasileiro GHG Protocol ou o fator médio do Sistema
                Interligado Nacional publicado pelo MCTI para a energia
                elétrica) e diga de onde ele veio. Informar de novo a mesma
                fonte substitui o fator.
              </p>
              <FormularioDeFator ano={ano} />
            </Recolhido>
          )}
        </>
      )}
    </>
  );
}
