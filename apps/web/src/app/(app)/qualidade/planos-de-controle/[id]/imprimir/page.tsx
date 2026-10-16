import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FASES_DO_PLANO_DE_CONTROLE,
  TIPOS_DE_CARACTERISTICA,
  type PlanoDeControle,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { BotaoImprimir } from "@/components/botao-imprimir";
import { chamarApi } from "@/lib/api";
import { formatarMomento } from "@/lib/datas";

export const metadata: Metadata = { title: "Plano de controle" };

/** Plano de controle em folha paisagem, com as colunas do anexo A da IATF 16949. */
export default async function PlanoDeControleImpresso({
  params,
}: PageProps<"/qualidade/planos-de-controle/[id]/imprimir">) {
  const { id } = await params;
  const r = await chamarApi<PlanoDeControle>(`/planos-de-controle/${id}`);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const p = r.dados;
  const cab = [
    "Etapa",
    "Máquina",
    "Característica",
    "Tipo",
    "Classe",
    "Especificação",
    "Método",
    "Amostra",
    "Frequência",
    "Controle",
    "Reação",
  ];
  return (
    <article className="bg-superficie">
      <style>{"@page { size: A4 landscape; margin: 10mm; }"}</style>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/qualidade/planos-de-controle/${id}`}
          className="text-sm text-texto-2 hover:underline"
        >
          Voltar ao plano
        </Link>
        <BotaoImprimir />
      </div>
      <header className="border-b-2 border-texto pb-2">
        <p className="text-sm text-texto-2">
          Plano de controle · {FASES_DO_PLANO_DE_CONTROLE[p.fase]} · {p.numero}
          {p.revisao && ` · rev. ${p.revisao}`}
        </p>
        <h1 className="font-bold text-xl">{p.titulo}</h1>
        <p className="text-sm">
          {p.item}
          {p.fmeaNumero && ` · FMEA ${p.fmeaNumero}`} · Atualizado em{" "}
          {formatarMomento(p.atualizadoEm)}
        </p>
      </header>
      <table className="mt-3 w-full border-collapse text-[10px] leading-tight">
        <thead>
          <tr>
            {cab.map((c) => (
              <th
                key={c}
                className="border border-borda-forte px-1 py-0.5 text-left"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {p.linhas.map((l, i) => (
            <tr key={i} className="break-inside-avoid align-top">
              {[
                l.etapa,
                l.maquina,
                l.caracteristica,
                TIPOS_DE_CARACTERISTICA[l.tipo],
                l.classificacao ?? "",
                l.especificacao,
                l.metodo,
                l.amostra,
                l.frequencia,
                l.controle,
                l.reacao,
              ].map((x, j) => (
                <td key={j} className="border border-borda px-1 py-0.5">
                  {x}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
