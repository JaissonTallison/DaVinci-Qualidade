import type { Metadata } from "next";
import Link from "next/link";
import {
  FASES_DO_PLANO_DE_CONTROLE,
  type DadosDoUsuario,
  type FmeaResumo,
  type PlanoDeControleResumo,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { formatarMomento } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { NovoPlanoDeControle } from "./formularios";

export const metadata: Metadata = { title: "Planos de controle" };

/** Plano de controle (IATF 8.5.1.1): cada característica com especificação, método, amostra, frequência e reação. */
export default async function PlanosDeControle({
  searchParams,
}: PageProps<"/qualidade/planos-de-controle">) {
  const { fmea } = (await searchParams) as { fmea?: string };
  const [r, fmeas, eu] = await Promise.all([
    chamarApi<PlanoDeControleResumo[]>("/planos-de-controle"),
    chamarApi<FmeaResumo[]>("/fmeas"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("qualidade.editar");
  return (
    <>
      <h1 className={tituloDaPagina}>Planos de controle</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        O que controlar em cada etapa, com que método, amostra e frequência, e o
        que fazer quando sai do especificado. Gerado do FMEA, o plano já vem com
        as etapas, as características e os controles; complete especificação e
        reação.
      </p>
      {podeEditar && (
        <details className={`${painel} mt-4 px-5 py-3`} open={Boolean(fmea)}>
          <summary className="cursor-pointer text-base font-semibold text-texto-2">
            Novo plano de controle
          </summary>
          <div className="mt-3">
            <NovoPlanoDeControle
              fmeas={fmeas.ok ? fmeas.dados : []}
              fmeaInicial={fmea}
            />
          </div>
        </details>
      )}
      <section className={`${painel} mt-6`}>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : r.dados.length === 0 ? (
          <p className="px-5 py-6 text-base text-texto-2">
            Nenhum plano de controle cadastrado.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borda text-left text-texto-2">
                <th className="px-4 py-2 font-semibold">Número</th>
                <th className="px-4 py-2 font-semibold">Título</th>
                <th className="px-4 py-2 font-semibold">Fase</th>
                <th className="px-4 py-2 font-semibold">Características</th>
                <th className="px-4 py-2 font-semibold">FMEA</th>
                <th className="px-4 py-2 font-semibold">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {r.dados.map((p) => (
                <tr key={p.id} className="border-b border-borda last:border-0">
                  <td data-rotulo="Número" className="px-4 py-2.5">
                    <Link
                      href={`/qualidade/planos-de-controle/${p.id}`}
                      className="font-mono text-info hover:underline"
                    >
                      {p.numero}
                    </Link>
                  </td>
                  <td data-rotulo="Título" className="px-4 py-2.5">
                    {p.titulo}
                    <span className="block text-texto-2">{p.item}</span>
                  </td>
                  <td data-rotulo="Fase" className="px-4 py-2.5">
                    {FASES_DO_PLANO_DE_CONTROLE[p.fase]}
                  </td>
                  <td
                    data-rotulo="Características"
                    className="px-4 py-2.5 tabular-nums"
                  >
                    {p.totalDeLinhas}
                  </td>
                  <td data-rotulo="FMEA" className="px-4 py-2.5 font-mono">
                    {p.fmeaId ? (
                      <Link
                        href={`/qualidade/fmea/${p.fmeaId}`}
                        className="text-info hover:underline"
                      >
                        {p.fmeaNumero}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    data-rotulo="Atualizado"
                    className="px-4 py-2.5 text-texto-2"
                  >
                    {formatarMomento(p.atualizadoEm)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
