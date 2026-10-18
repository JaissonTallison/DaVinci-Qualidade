import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  NORMAS,
  PROCESSOS_AUDITADOS,
  TIPOS_AUDITORIA,
  type Auditoria,
  type RoteiroDaAuditoria,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { BotaoImprimir } from "@/components/botao-imprimir";

export const metadata: Metadata = { title: "Roteiro de campo" };

/** Roteiro de campo para levar impresso: perguntas por processo com espaço para anotar a evidência. */
export default async function RoteiroDeCampo({
  params,
}: PageProps<"/auditorias/[id]/roteiro/imprimir">) {
  const { id } = await params;
  const [a, r] = await Promise.all([
    chamarApi<Auditoria>(`/auditorias/${id}`),
    chamarApi<RoteiroDaAuditoria>(`/auditorias/${id}/roteiro`),
  ]);
  if (!a.ok && a.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!a.ok) return <AvisoDeErro erro={a.erro} />;
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const aud = a.dados;
  const grupos = Object.entries(PROCESSOS_AUDITADOS)
    .map(([k, n]) => ({
      k,
      n,
      perguntas: r.dados.perguntas.filter((p) => p.processo === k),
    }))
    .filter((g) => g.perguntas.length);
  return (
    <article className="mx-auto max-w-4xl bg-superficie print:max-w-none">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/auditorias/${id}/roteiro`}
          className="dv-voltar"
        >
          Voltar ao roteiro
        </Link>
        <BotaoImprimir />
      </div>
      <header className="border-b-2 border-texto pb-3">
        <p className="text-sm text-texto-2">Roteiro de campo · {aud.numero}</p>
        <h1 className="font-bold text-2xl">
          Auditoria {TIPOS_AUDITORIA[aud.tipo].toLowerCase()} ·{" "}
          {aud.normas.map((n) => NORMAS[n]).join(", ")}
        </h1>
        <p className="mt-1 text-sm">
          {formatarData(aud.dataInicio)}
          {aud.dataFim !== aud.dataInicio &&
            ` a ${formatarData(aud.dataFim)}`}{" "}
          · Auditor líder: {aud.auditorLider}
          {aud.equipe && ` · Equipe: ${aud.equipe}`}
        </p>
        <p className="mt-1 text-sm whitespace-pre-line">{aud.escopo}</p>
      </header>
      {grupos.map((g) => (
        <section key={g.k} className="mt-6 break-inside-avoid-page">
          <h2 className="border-b border-borda-forte pb-1 text-lg font-semibold">
            {g.n}{" "}
            <span className="text-sm font-normal text-texto-2">
              · entrevistado: ______________________
            </span>
          </h2>
          <ol className="mt-2">
            {g.perguntas.map((p, i) => (
              <li
                key={p.codigo}
                className="break-inside-avoid border-b border-borda py-3"
              >
                <p className="text-base">
                  <span className="font-semibold tabular-nums">{i + 1}.</span>{" "}
                  {p.pergunta}{" "}
                  <span className="font-mono text-xs text-texto-2">
                    ({NORMAS[p.norma]} {p.clausula})
                  </span>
                </p>
                <p className="mt-1 text-xs text-texto-2">
                  Esperada: {p.respostaEsperada} · Alerta: {p.sinalDeAlerta}
                </p>
                <p className="mt-2 flex gap-5 text-sm">
                  {["Conforme", "Parcial", "Não conforme"].map((o) => (
                    <span key={o} className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="inline-block size-3.5 border border-texto"
                      />
                      {o}
                    </span>
                  ))}
                </p>
                <div
                  className="mt-2 h-14 border border-dashed border-borda-forte"
                  aria-label="Espaço para anotar a evidência"
                />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </article>
  );
}
