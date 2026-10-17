import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  STATUS_DO_PASSO,
  STATUS_OS,
  type OrdemDeServico,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { BotaoImprimir } from "@/components/botao-imprimir";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento } from "@/lib/datas";

export const metadata: Metadata = { title: "Relatório da OS" };

/** Relatório da ordem de serviço para o cliente conferir e assinar o aceite. */
export default async function RelatorioDaOs({
  params,
}: PageProps<"/servicos/ordens/[id]/imprimir">) {
  const { id } = await params;
  const r = await chamarApi<OrdemDeServico>(`/ordens-de-servico/${id}`);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const o = r.dados;
  return (
    <article className="mx-auto max-w-4xl bg-superficie print:max-w-none">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/servicos/ordens/${id}`}
          className="dv-voltar"
        >
          Voltar à OS
        </Link>
        <BotaoImprimir />
      </div>
      <header className="border-b-2 border-texto pb-3">
        <p className="text-sm text-texto-2">
          Relatório de ordem de serviço · {o.numero} · {STATUS_OS[o.status]}
        </p>
        <h1 className="font-bold text-2xl">{o.titulo}</h1>
        <p className="mt-1 text-sm">
          Cliente: {o.clienteNome}
          {o.contratoNumero && ` · Contrato ${o.contratoNumero}`} · Prazo{" "}
          {formatarData(o.prazo)}
        </p>
      </header>
      <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
        <Dado rotulo="Responsável">{o.responsavel}</Dado>
        <Dado rotulo="Início">
          {o.iniciadaEm ? formatarMomento(o.iniciadaEm) : "—"}
        </Dado>
        <Dado rotulo="Conclusão">
          {o.concluidaEm ? formatarMomento(o.concluidaEm) : "—"}
        </Dado>
        <Dado rotulo="Horas">
          {o.horasTotais ? `${o.horasTotais.toLocaleString("pt-BR")} h` : "—"}
        </Dado>
      </dl>
      <Secao titulo="Solicitação">{o.descricao}</Secao>
      {o.checklist.length > 0 && (
        <section className="mt-5 break-inside-avoid">
          <h2 className="border-b border-borda-forte pb-1 text-lg font-semibold">
            Execução
          </h2>
          <ol className="mt-2 text-sm">
            {o.checklist.map((p, i) => (
              <li
                key={i}
                className="flex justify-between gap-4 border-b border-borda py-1"
              >
                <span>
                  {i + 1}. {p.item}
                  {p.observacao && (
                    <span className="text-texto-2"> · {p.observacao}</span>
                  )}
                </span>
                <span className="shrink-0">{STATUS_DO_PASSO[p.status]}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
      {o.apontamentos.length > 0 && (
        <section className="mt-5 break-inside-avoid">
          <h2 className="border-b border-borda-forte pb-1 text-lg font-semibold">
            Horas
          </h2>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {o.apontamentos.map((a, i) => (
                <tr key={i} className="border-b border-borda">
                  <td className="py-1 pr-3 whitespace-nowrap">
                    {formatarData(a.data)}
                  </td>
                  <td className="py-1 pr-3">{a.tecnico}</td>
                  <td className="py-1 pr-3 text-right tabular-nums">
                    {a.horas.toLocaleString("pt-BR")} h
                  </td>
                  <td className="py-1">{a.descricao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      {o.materiais.length > 0 && (
        <section className="mt-5 break-inside-avoid">
          <h2 className="border-b border-borda-forte pb-1 text-lg font-semibold">
            Materiais
          </h2>
          <ul className="mt-2 text-sm">
            {o.materiais.map((m, i) => (
              <li key={i} className="border-b border-borda py-1">
                {m.quantidade.toLocaleString("pt-BR")} {m.unidade} ·{" "}
                {m.descricao}
              </li>
            ))}
          </ul>
        </section>
      )}
      {o.relatorio && (
        <Secao titulo="Relatório do que foi feito">{o.relatorio}</Secao>
      )}
      <section className="mt-14 grid grid-cols-2 gap-10 text-sm break-inside-avoid">
        <div className="border-t border-texto pt-1 text-center">
          Responsável técnico: {o.responsavel}
        </div>
        <div className="border-t border-texto pt-1 text-center">
          Aceite do cliente{o.recebidoPor ? `: ${o.recebidoPor}` : ""} · data
          ____/____/______
        </div>
      </section>
    </article>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h2 className="border-b border-borda-forte pb-1 text-lg font-semibold">
        {titulo}
      </h2>
      <p className="mt-2 text-sm whitespace-pre-line">{children}</p>
    </section>
  );
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd>{children}</dd>
    </div>
  );
}
