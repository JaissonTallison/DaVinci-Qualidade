import type { Metadata } from "next";
import Link from "next/link";
import {
  NOTA_MATERIAL,
  nivelDeMaterialidade,
  PILARES,
  type NivelDeMaterialidade,
  type TemaEsg,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Materialidade } from "@/components/marcadores-esg";
import { chamarApi } from "@/lib/api";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";

export const metadata: Metadata = { title: "Matriz de materialidade" };

/** Fundo da casa pelo nível (impacto × relevância): tom leve, a cor forte fica no marcador da lista. */
const FUNDO: Record<NivelDeMaterialidade, string> = {
  baixa: "bg-nivel-baixo/10",
  media: "bg-nivel-medio/15",
  alta: "bg-nivel-alto/15",
};
const NOTAS = [1, 2, 3, 4, 5];

export default async function MatrizDeMaterialidade() {
  const r = await chamarApi<TemaEsg[]>("/esg/temas");
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const avaliados = r.dados.filter((t) => t.nota !== null);
  const numero = new Map(avaliados.map((t, i) => [t.id, i + 1]));
  const naCasa = (impacto: number, relevancia: number) =>
    avaliados.filter(
      (t) => t.impacto === impacto && t.relevancia === relevancia,
    );
  const materiais = avaliados.filter((t) => t.material).length;
  const semAvaliacao = r.dados.length - avaliados.length;
  return (
    <>
      <h1 className={tituloDaPagina}>Matriz de materialidade</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        {avaliados.length === 0
          ? "Nenhum tema avaliado ainda."
          : `${materiais} de ${avaliados.length} temas avaliados são materiais (nota ${NOTA_MATERIAL} ou mais).`}{" "}
        Impacto: quanto a empresa afeta pessoas e ambiente. Relevância: quanto o
        tema pesa no negócio e para as partes interessadas.
        {semAvaliacao > 0 && (
          <>
            {" "}
            <Link href="/esg/temas" className="text-info hover:underline">
              {semAvaliacao === 1
                ? "1 tema sem avaliação"
                : `${semAvaliacao} temas sem avaliação`}
            </Link>
            .
          </>
        )}
      </p>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section
          className={`${painel} p-5`}
          aria-label="Matriz impacto × relevância"
        >
          <div className="flex gap-2">
            <div className="flex w-5 items-center justify-center">
              <span className="-rotate-90 text-xs whitespace-nowrap text-texto-2">
                Impacto →
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="grid grid-cols-[1.25rem_repeat(5,minmax(0,1fr))] gap-0.5">
                {[...NOTAS].reverse().map((impacto) => (
                  <div key={impacto} className="contents">
                    <span className="flex items-center justify-center text-xs text-texto-2 tabular-nums">
                      {impacto}
                    </span>
                    {NOTAS.map((relevancia) => {
                      const nota = impacto * relevancia;
                      const temas = naCasa(impacto, relevancia);
                      return (
                        <div
                          key={relevancia}
                          title={`Impacto ${impacto} × relevância ${relevancia} = ${nota}`}
                          className={`flex aspect-square min-h-12 flex-wrap content-start gap-1 rounded-xs p-1.5 ${FUNDO[nivelDeMaterialidade(nota)]}`}
                        >
                          <span className="w-full text-[10px] leading-none text-texto-3 tabular-nums">
                            {nota}
                          </span>
                          {temas.map((t) => (
                            <Link
                              key={t.id}
                              href={`/esg/temas/${t.id}`}
                              title={`${t.nome} · ${PILARES[t.pilar]} · nota ${t.nota}`}
                              className="flex size-6 items-center justify-center rounded-xs border border-borda-forte bg-superficie text-xs font-semibold text-texto tabular-nums hover:border-texto"
                            >
                              {numero.get(t.id)}
                            </Link>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <span />
                {NOTAS.map((n) => (
                  <span
                    key={n}
                    className="pt-1 text-center text-xs text-texto-2 tabular-nums"
                  >
                    {n}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-center text-xs text-texto-2">
                Relevância →
              </p>
            </div>
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-texto-2">
            <li className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2.5 rounded-xs bg-nivel-baixo"
              />
              Baixa: até 5
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2.5 rounded-xs bg-nivel-medio"
              />
              Média: 6 a 14
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-xs bg-nivel-alto" />
              Alta (material): 15 ou mais
            </li>
          </ul>
        </section>
        <section className={painel}>
          <h2 className={`${tituloDaSecao} px-5 pt-5`}>Temas avaliados</h2>
          {avaliados.length === 0 ? (
            <p className="px-5 pt-2 pb-5 text-base text-texto-2">
              Avalie impacto e relevância em cada{" "}
              <Link href="/esg/temas" className="text-info hover:underline">
                tema
              </Link>
              .
            </p>
          ) : (
            <div className="relative mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-superficie-2 text-xs text-texto-2">
                  <tr>
                    <th className="px-5 py-2 font-semibold">Nº</th>
                    <th className="px-4 py-2 font-semibold">Tema</th>
                    <th className="px-4 py-2 font-semibold">Pilar</th>
                    <th className="px-4 py-2 font-semibold">Materialidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {avaliados.map((t) => (
                    <tr key={t.id} className="hover:bg-superficie-2">
                      <td className="px-5 py-2 font-semibold tabular-nums">
                        {numero.get(t.id)}
                      </td>
                      <td className="px-4 py-2">
                        <Link
                          href={`/esg/temas/${t.id}`}
                          className="text-info hover:underline"
                        >
                          {t.nome}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-texto-2">
                        {PILARES[t.pilar]}
                      </td>
                      <td className="px-4 py-2">
                        <Materialidade nivel={t.nivel} nota={t.nota} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
