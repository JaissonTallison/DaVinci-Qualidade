import type { Metadata } from "next";
import Link from "next/link";
import { NUMEROS_ODS, ODS, type TemaEsg } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { IconeOds } from "@/components/marcadores-esg";
import { chamarApi } from "@/lib/api";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import { MapaDosOds } from "./mapa";

export const metadata: Metadata = { title: "ODS" };

export default async function Ods() {
  const r = await chamarApi<TemaEsg[]>("/esg/temas");
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const porOds = NUMEROS_ODS.map((n) => ({
    n,
    temas: r.dados.filter((t) => t.ods.includes(n)),
  }));
  const comMaterial = porOds.filter((o) =>
    o.temas.some((t) => t.material),
  ).length;
  return (
    <>
      <h1 className={tituloDaPagina}>
        Objetivos de Desenvolvimento Sustentável
      </h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        Os 17 ODS da ONU e os temas da empresa que contribuem para cada um.{" "}
        {comMaterial} ODS têm ao menos um tema material, onde estão as metas.
      </p>
      <MapaDosOds temas={r.dados} />
      <h2 className={`${tituloDaSecao} mt-8`}>
        Os 17 ODS e os temas da empresa
      </h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {porOds.map(({ n, temas }) => {
          const materiais = temas.filter((t) => t.material);
          return (
            <li
              key={n}
              id={`ods-${n}`}
              className={`${painel} flex scroll-mt-20 gap-4 p-4 target:border-texto ${temas.length ? "" : "opacity-70"}`}
            >
              <IconeOds numero={n} tamanho="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold">{ODS[n]}</p>
                <p className="mt-0.5 text-sm text-texto-2">
                  {temas.length === 0
                    ? "Nenhum tema ligado"
                    : `${temas.length === 1 ? "1 tema" : `${temas.length} temas`} · ${materiais.length === 1 ? "1 material" : `${materiais.length} materiais`}`}
                </p>
                {temas.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm">
                    {temas.map((t) => (
                      <li key={t.id} className="flex items-baseline gap-1.5">
                        <Link
                          href={`/esg/temas/${t.id}`}
                          className={`hover:underline ${t.material ? "font-semibold text-texto" : "text-texto-2"}`}
                        >
                          {t.nome}
                        </Link>
                        {t.material && t.prazoMeta && (
                          <span className="text-texto-2 tabular-nums">
                            · {t.progresso}%
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
