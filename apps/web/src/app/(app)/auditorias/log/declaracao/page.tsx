import type { Metadata } from "next";
import Link from "next/link";
import {
  NORMAS,
  PAPEIS_DO_AUDITOR,
  PROCESSOS_AUDITADOS,
  type DadosDoUsuario,
  type LogDoAuditor,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { BotaoImprimir } from "@/components/botao-imprimir";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";

export const metadata: Metadata = { title: "Declaração de experiência" };

/** "Organização A", …, "Organização Z", "Organização AA"… na ordem em que aparecem. */
function letra(i: number): string {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26))
    s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

/** Declaração de experiência como auditor, para imprimir e assinar; organizações podem sair anonimizadas. */
export default async function Declaracao({
  searchParams,
}: PageProps<"/auditorias/log/declaracao">) {
  const {
    auditor = "",
    nome,
    anonimizar,
  } = (await searchParams) as {
    auditor?: string;
    nome?: string;
    anonimizar?: string;
  };
  const [r, eu] = await Promise.all([
    chamarApi<LogDoAuditor>(
      `/log-do-auditor?auditor=${encodeURIComponent(auditor)}`,
    ),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const log = r.dados;
  const apelidos = new Map<string, string>();
  const organizacao = (o: string) => {
    if (!anonimizar) return o;
    if (!apelidos.has(o))
      apelidos.set(o, `Organização ${letra(apelidos.size)}`);
    return apelidos.get(o)!;
  };
  const empresa = eu.ok ? eu.dados.empresa.nome : "";
  return (
    <article className="mx-auto max-w-4xl bg-superficie print:max-w-none">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/auditorias/log?auditor=${encodeURIComponent(auditor)}`}
          className="text-sm text-texto-2 hover:underline"
        >
          Voltar ao log
        </Link>
        <BotaoImprimir />
      </div>
      <header className="border-b-2 border-texto pb-3">
        <h1 className="font-serif text-2xl">
          Declaração de experiência em auditoria
        </h1>
        <p className="mt-1 text-sm text-texto-2">
          Emitida em {formatarData(hojeEmBrasilia())}
        </p>
      </header>
      <p className="mt-5 max-w-[72ch] text-base">
        Declaramos que <strong>{(nome || log.auditor).trim()}</strong>{" "}
        participou das auditorias de sistemas de gestão relacionadas abaixo,
        somando {log.auditorias.length} auditoria(s)
        {log.horas
          ? ` e ${log.horas.toLocaleString("pt-BR")} horas de auditoria`
          : ""}
        , nos referenciais{" "}
        {log.referenciais.map((n) => NORMAS[n]).join(", ") || "—"}, com{" "}
        {log.perguntasConduzidas} pergunta(s) de entrevista conduzida(s) e{" "}
        {log.achados} achado(s) registrado(s).
      </p>
      <table className="mt-5 w-full text-sm">
        <thead>
          <tr className="border-b border-borda-forte text-left">
            <th className="py-1 pr-3">Período</th>
            <th className="py-1 pr-3">Organização</th>
            <th className="py-1 pr-3">Referenciais</th>
            <th className="py-1 pr-3">Papel</th>
            <th className="py-1 text-right">Horas</th>
          </tr>
        </thead>
        <tbody>
          {log.auditorias.map((a) => (
            <tr
              key={a.id}
              className="break-inside-avoid border-b border-borda align-top"
            >
              <td className="py-1.5 pr-3 whitespace-nowrap">
                {formatarData(a.dataInicio)}
                {a.dataFim !== a.dataInicio && ` a ${formatarData(a.dataFim)}`}
              </td>
              <td className="py-1.5 pr-3">{organizacao(a.organizacao)}</td>
              <td className="py-1.5 pr-3">
                {a.normas.map((n) => NORMAS[n]).join(", ")}
              </td>
              <td className="py-1.5 pr-3">{PAPEIS_DO_AUDITOR[a.papel]}</td>
              <td className="py-1.5 text-right tabular-nums">
                {a.horas ? a.horas.toLocaleString("pt-BR") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {log.processos.length > 0 && (
        <p className="mt-4 text-sm">
          Processos auditados:{" "}
          {log.processos.map((p) => PROCESSOS_AUDITADOS[p]).join(", ")}.
        </p>
      )}
      {anonimizar && (
        <p className="mt-2 text-xs text-texto-2">
          Organizações anonimizadas a pedido do declarante.
        </p>
      )}
      <section className="mt-16 grid grid-cols-2 gap-10 text-sm break-inside-avoid">
        <div className="border-t border-texto pt-1 text-center">
          Responsável pela declaração{empresa && ` · ${empresa}`}
        </div>
        <div className="border-t border-texto pt-1 text-center">
          {(nome || log.auditor).trim()}
        </div>
      </section>
    </article>
  );
}
