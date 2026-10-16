import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Fmea } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { BotaoImprimir } from "@/components/botao-imprimir";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento } from "@/lib/datas";

export const metadata: Metadata = { title: "FMEA" };

/** FMEA em folha paisagem, no formato de colunas do manual AIAG-VDA (passos 2 a 6). */
export default async function FmeaImpresso({
  params,
}: PageProps<"/qualidade/fmea/[id]/imprimir">) {
  const { id } = await params;
  const r = await chamarApi<Fmea>(`/fmeas/${id}`);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const f = r.dados;
  const cab = [
    "Etapa",
    "Função / requisito",
    "Modo de falha",
    "Efeito",
    "S",
    "Classe",
    "Causa",
    "Prevenção",
    "O",
    "Detecção",
    "D",
    "AP",
    "Ação",
    "Responsável",
    "Prazo",
    "Status",
  ];
  return (
    <article className="bg-superficie">
      <style>{"@page { size: A4 landscape; margin: 10mm; }"}</style>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/qualidade/fmea/${id}`}
          className="text-sm text-texto-2 hover:underline"
        >
          Voltar ao FMEA
        </Link>
        <BotaoImprimir />
      </div>
      <header className="border-b-2 border-texto pb-2">
        <p className="text-sm text-texto-2">
          FMEA de processo · {f.numero}
          {f.revisao && ` · rev. ${f.revisao}`}
        </p>
        <h1 className="font-serif text-xl">{f.titulo}</h1>
        <p className="text-sm">
          {f.item}
          {f.cliente && ` · Cliente: ${f.cliente}`}
          {f.equipe && ` · Equipe: ${f.equipe}`} · Atualizado em{" "}
          {formatarMomento(f.atualizadoEm)}
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
          {f.linhas.map((l, i) => (
            <tr key={i} className="break-inside-avoid align-top">
              {[
                l.etapa,
                l.funcao,
                l.modoDeFalha,
                l.efeito,
                l.severidade,
                l.classificacao ?? "",
                l.causa,
                l.prevencao ?? "",
                l.ocorrencia,
                l.deteccao ?? "",
                l.notaDeteccao,
                l.ap,
                l.acao ?? "",
                l.responsavel ?? "",
                l.prazo ? formatarData(l.prazo) : "",
                l.statusAcao === "concluida" ? "Concluída" : "Aberta",
              ].map((x, j) => (
                <td
                  key={j}
                  className={`border border-borda px-1 py-0.5 ${j === 11 ? "font-semibold" : ""}`}
                >
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
