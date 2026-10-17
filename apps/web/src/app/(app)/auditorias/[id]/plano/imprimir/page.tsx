import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  METODOLOGIA_PADRAO,
  NORMAS,
  PROCESSOS_AUDITADOS,
  TIPOS_AUDITORIA,
  criteriosSugeridos,
  type Auditoria,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { BotaoImprimir } from "@/components/botao-imprimir";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";

export const metadata: Metadata = { title: "Plano de auditoria" };

/** Plano de auditoria em folha: dados, objetivo, critérios, cronograma, convocados, logística e assinaturas. */
export default async function PlanoImpresso({
  params,
}: PageProps<"/auditorias/[id]/plano/imprimir">) {
  const { id } = await params;
  const a = await chamarApi<Auditoria>(`/auditorias/${id}`);
  if (!a.ok && a.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!a.ok) return <AvisoDeErro erro={a.erro} />;
  const aud = a.dados;
  const p = aud.plano;
  return (
    <article className="mx-auto max-w-4xl bg-superficie print:max-w-none">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/auditorias/${id}/plano`}
          className="dv-voltar"
        >
          Voltar ao plano
        </Link>
        <BotaoImprimir />
      </div>
      <header className="border-b-2 border-texto pb-3">
        <p className="text-sm text-texto-2">
          Plano de auditoria · {aud.numero}
        </p>
        <h1 className="font-bold text-2xl">
          {p.empresaAuditada ?? "Organização auditada"}
        </h1>
        <p className="mt-1 text-sm">
          Auditoria {TIPOS_AUDITORIA[aud.tipo].toLowerCase()} ·{" "}
          {aud.normas.map((n) => NORMAS[n]).join(", ")}
          {p.unidade && ` · ${p.unidade}`}
        </p>
      </header>
      <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
        <Dado rotulo="Período">
          {aud.dataInicio === aud.dataFim
            ? formatarData(aud.dataInicio)
            : `${formatarData(aud.dataInicio)} a ${formatarData(aud.dataFim)}`}
        </Dado>
        <Dado rotulo="Auditor líder">{aud.auditorLider}</Dado>
        <Dado rotulo="Equipe">{aud.equipe ?? "—"}</Dado>
        <Dado rotulo="Representante do auditado">
          {aud.representante ?? "—"}
        </Dado>
      </dl>
      <Secao titulo="Escopo">{aud.escopo}</Secao>
      {p.objetivo && <Secao titulo="Objetivo">{p.objetivo}</Secao>}
      <Secao titulo="Critérios">
        {p.criterios ?? criteriosSugeridos(aud.normas)}
      </Secao>
      <Secao titulo="Metodologia">{p.metodologia || METODOLOGIA_PADRAO}</Secao>
      {p.processos.length > 0 && (
        <Secao titulo="Processos auditados">
          {p.processos.map((k) => PROCESSOS_AUDITADOS[k]).join(" · ")}
        </Secao>
      )}
      {p.cronograma.length > 0 && (
        <section className="mt-5 break-inside-avoid">
          <h2 className="border-b border-borda-forte pb-1 text-lg font-semibold">
            Cronograma
          </h2>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-borda text-left">
                <th className="py-1 pr-3">Horário</th>
                <th className="py-1 pr-3">Processo ou atividade</th>
                <th className="py-1 pr-3">Auditado</th>
                <th className="py-1">Local</th>
              </tr>
            </thead>
            <tbody>
              {p.cronograma.map((l, i) => (
                <tr key={i} className="border-b border-borda">
                  <td className="py-1 pr-3 whitespace-nowrap tabular-nums">
                    {l.horaInicio}
                    {l.horaFim && ` – ${l.horaFim}`}
                  </td>
                  <td className="py-1 pr-3">{l.processo}</td>
                  <td className="py-1 pr-3">{l.auditado}</td>
                  <td className="py-1">{l.local}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      {p.auditados.length > 0 && (
        <section className="mt-5 break-inside-avoid">
          <h2 className="border-b border-borda-forte pb-1 text-lg font-semibold">
            Auditados convocados
          </h2>
          <ul className="mt-2 text-sm">
            {p.auditados.map((x, i) => (
              <li key={i} className="border-b border-borda py-1">
                <span className="font-semibold">{x.nome}</span>
                {x.funcao && ` · ${x.funcao}`}
                {x.processo && ` · ${x.processo}`}
              </li>
            ))}
          </ul>
        </section>
      )}
      {(p.logistica.sala ||
        p.logistica.epi ||
        p.logistica.acompanhante ||
        p.logistica.observacoes) && (
        <section className="mt-5 break-inside-avoid">
          <h2 className="border-b border-borda-forte pb-1 text-lg font-semibold">
            Logística
          </h2>
          <dl className="mt-2 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            {p.logistica.sala && (
              <Dado rotulo="Sala de apoio">{p.logistica.sala}</Dado>
            )}
            {p.logistica.epi && <Dado rotulo="EPI">{p.logistica.epi}</Dado>}
            {p.logistica.acompanhante && (
              <Dado rotulo="Acompanhante">{p.logistica.acompanhante}</Dado>
            )}
            {p.logistica.observacoes && (
              <Dado rotulo="Observações">{p.logistica.observacoes}</Dado>
            )}
          </dl>
        </section>
      )}
      <section className="mt-12 grid grid-cols-2 gap-10 text-sm break-inside-avoid">
        {[
          `Auditor líder: ${aud.auditorLider}`,
          `Representante do auditado${aud.representante ? `: ${aud.representante}` : ""}`,
        ].map((t) => (
          <div key={t} className="border-t border-texto pt-1 text-center">
            {t}
          </div>
        ))}
      </section>
      {p.emissor && (
        <p className="mt-6 text-xs text-texto-2">Emitido por {p.emissor}.</p>
      )}
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
