import type { Metadata } from "next";
import Link from "next/link";
import type { DadosDoUsuario, Ecoeficiencia as Eco } from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { hojeEmBrasilia } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { RegistrarProducao } from "./formulario";

export const metadata: Metadata = { title: "Ecoeficiência" };

const n = (v: number | null, casas = 2) =>
  v === null
    ? "—"
    : v.toLocaleString("pt-BR", { maximumFractionDigits: casas });
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

/** Água, energia, resíduos e emissões por unidade produzida: a ecoeficiência da operação. */
export default async function Ecoeficiencia({
  searchParams,
}: PageProps<"/ambiental/ecoeficiencia">) {
  const f = (await searchParams) as { ano?: string; aviso?: string };
  const ano = Number(f.ano ?? hojeEmBrasilia().slice(0, 4));
  const [r, eu] = await Promise.all([
    chamarApi<Eco>(`/ecoeficiencia?ano=${ano}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const e = r.dados;
  const u = e.unidadeDeProducao ?? "unid.";
  const podeEditar = eu.ok && eu.dados.permissoes.includes("ambiental.editar");
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className={tituloDaPagina}>Ecoeficiência {ano}</h1>
        <nav aria-label="Ano" className="flex gap-3 text-sm">
          <Link href={`?ano=${ano - 1}`} className="text-info hover:underline">
            {ano - 1}
          </Link>
          <Link href={`?ano=${ano + 1}`} className="text-info hover:underline">
            {ano + 1}
          </Link>
        </nav>
      </div>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        O consumo de água e energia vem de Consumo, os resíduos das saídas (em
        kg) e as emissões dos fatores do inventário de GEE. Divididos pela
        produção do mês, mostram se a operação está ficando mais eficiente, não
        só se produziu menos.
      </p>
      <Aviso avisos={{ producao: "Produção registrada." }} chave={f.aviso} />
      {podeEditar && (
        <Recolhido titulo="Registrar produção do mês">
          <RegistrarProducao
            mes={hojeEmBrasilia().slice(0, 7)}
            unidade={e.unidadeDeProducao}
          />
        </Recolhido>
      )}
      <section
        className={`${painel} mt-6 grid grid-cols-2 gap-5 p-5 sm:grid-cols-4`}
        aria-label="Por unidade produzida no ano"
      >
        {[
          ["Água", e.porUnidade.agua, `m³/${u}`],
          ["Energia", e.porUnidade.energia, `kWh/${u}`],
          ["Resíduos", e.porUnidade.residuos, `kg/${u}`],
          ["Emissões", e.porUnidade.gee, `kg CO₂e/${u}`],
        ].map(([t, v, un]) => (
          <div key={String(t)}>
            <p className="text-xs text-texto-2">{t}</p>
            <p className="text-2xl font-semibold tabular-nums">
              {n(v as number | null, 3)}
            </p>
            <p className="text-xs text-texto-3">{un}</p>
          </div>
        ))}
      </section>
      <section className={`${painel} relative mt-6 overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borda text-left text-texto-2">
              <th className="px-4 py-2 font-semibold">Mês</th>
              <th className="px-4 py-2 text-right font-semibold">
                Produção ({u})
              </th>
              <th className="px-4 py-2 text-right font-semibold">Água (m³)</th>
              <th className="px-4 py-2 text-right font-semibold">
                Energia (kWh)
              </th>
              <th className="px-4 py-2 text-right font-semibold">
                Resíduos (kg)
              </th>
              <th className="px-4 py-2 text-right font-semibold">
                Emissões (kg CO₂e)
              </th>
              <th className="px-4 py-2 text-right font-semibold">Água/{u}</th>
              <th className="px-4 py-2 text-right font-semibold">kWh/{u}</th>
            </tr>
          </thead>
          <tbody>
            {e.meses.map((m, i) => (
              <tr
                key={m.competencia}
                className="border-b border-borda last:border-0"
              >
                <td className="px-4 py-1.5">{MESES[i]}</td>
                <td className="px-4 py-1.5 text-right tabular-nums">
                  {n(m.producao)}
                </td>
                <td className="px-4 py-1.5 text-right tabular-nums">
                  {n(m.agua)}
                </td>
                <td className="px-4 py-1.5 text-right tabular-nums">
                  {n(m.energia)}
                </td>
                <td className="px-4 py-1.5 text-right tabular-nums">
                  {n(m.residuos)}
                </td>
                <td className="px-4 py-1.5 text-right tabular-nums">
                  {n(m.gee)}
                </td>
                <td className="px-4 py-1.5 text-right tabular-nums">
                  {m.producao && m.agua !== null
                    ? n(m.agua / m.producao, 3)
                    : "—"}
                </td>
                <td className="px-4 py-1.5 text-right tabular-nums">
                  {m.producao && m.energia !== null
                    ? n(m.energia / m.producao, 3)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
