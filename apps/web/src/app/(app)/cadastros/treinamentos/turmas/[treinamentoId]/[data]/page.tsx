import type { Metadata } from "next";
import Link from "next/link";
import type { DadosDoUsuario, Turma } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { BotaoImprimir } from "@/components/botao-imprimir";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";

export const metadata: Metadata = { title: "Turma de treinamento" };

const cpf = (c: string) =>
  `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;

/** Lista de presença para assinar ou um certificado por participante (uma página cada). */
export default async function TurmaImpressa({
  params,
  searchParams,
}: PageProps<"/cadastros/treinamentos/turmas/[treinamentoId]/[data]">) {
  const { treinamentoId, data } = await params;
  const { certificados } = (await searchParams) as { certificados?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Turma>(`/turmas-de-treinamento/${treinamentoId}/${data}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const t = r.dados;
  const empresa = eu.ok ? eu.dados.empresa.nome : "";
  const titulo = `${t.treinamento.nome}${t.treinamento.norma ? ` (${t.treinamento.norma})` : ""}`;
  return (
    <article className="mx-auto max-w-4xl bg-superficie print:max-w-none">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/cadastros/treinamentos/turmas"
          className="text-sm text-texto-2 hover:underline"
        >
          Turmas
        </Link>
        <Link
          href={certificados ? "?" : "?certificados=1"}
          className="text-sm text-info hover:underline"
        >
          {certificados ? "Ver lista de presença" : "Ver certificados"}
        </Link>
        <BotaoImprimir />
      </div>
      {certificados ? (
        t.participantes.map((p) => (
          <section
            key={p.funcionarioId}
            className="flex min-h-[60vh] flex-col justify-between border-2 border-texto p-10 break-after-page print:min-h-[90vh]"
          >
            <div>
              <p className="text-sm tracking-[0.2em] text-texto-2 uppercase">
                Certificado
              </p>
              <h1 className="mt-4 font-serif text-3xl">{p.nome}</h1>
              <p className="mt-4 max-w-[60ch] text-base">
                concluiu o treinamento <strong>{titulo}</strong>, com carga
                horária de {t.treinamento.cargaHoraria} hora(s), realizado em{" "}
                {formatarData(t.data)}
                {t.instrutor && `, ministrado por ${t.instrutor}`}.
                {p.validade && ` Válido até ${formatarData(p.validade)}.`}
              </p>
              <p className="mt-2 text-sm text-texto-2">
                CPF {cpf(p.cpf)} · {p.funcaoNome}
              </p>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-10 text-sm">
              <div className="border-t border-texto pt-1 text-center">
                {t.instrutor ?? "Instrutor"}
              </div>
              <div className="border-t border-texto pt-1 text-center">
                {empresa || "Responsável pela empresa"}
              </div>
            </div>
          </section>
        ))
      ) : (
        <>
          <header className="border-b-2 border-texto pb-3">
            <p className="text-sm text-texto-2">Lista de presença</p>
            <h1 className="font-serif text-2xl">{titulo}</h1>
            <p className="text-sm">
              {empresa} · {formatarData(t.data)} · {t.treinamento.cargaHoraria}{" "}
              h{t.instrutor && ` · Instrutor: ${t.instrutor}`}
            </p>
          </header>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-borda-forte text-left">
                <th className="py-1 pr-3">Nº</th>
                <th className="py-1 pr-3">Nome</th>
                <th className="py-1 pr-3">Matrícula</th>
                <th className="py-1 pr-3">Função</th>
                <th className="w-48 py-1">Assinatura</th>
              </tr>
            </thead>
            <tbody>
              {t.participantes.map((p, i) => (
                <tr
                  key={p.funcionarioId}
                  className="h-10 border-b border-borda"
                >
                  <td className="pr-3 tabular-nums">{i + 1}</td>
                  <td className="pr-3">{p.nome}</td>
                  <td className="pr-3 font-mono">{p.matricula}</td>
                  <td className="pr-3">{p.funcaoNome}</td>
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-14 grid grid-cols-2 gap-10 text-sm">
            <div className="border-t border-texto pt-1 text-center">
              {t.instrutor ?? "Instrutor"}
            </div>
            <div className="border-t border-texto pt-1 text-center">
              Responsável pela empresa
            </div>
          </div>
        </>
      )}
    </article>
  );
}
