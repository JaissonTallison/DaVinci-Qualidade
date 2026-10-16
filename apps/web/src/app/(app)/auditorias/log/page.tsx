import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Search } from "lucide-react";
import {
  NORMAS,
  PAPEIS_DO_AUDITOR,
  PROCESSOS_AUDITADOS,
  type DadosDoUsuario,
  type LogDoAuditor,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { StatusDaAuditoria } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  campo,
  campoCompacto,
  painel,
  rotulo,
  tituloDaPagina,
  tituloDaSecao,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Log do Auditor" };

/** Histórico consolidado de quem audita: auditorias, horas, referenciais e processos, e a declaração de experiência. */
export default async function LogDoAuditorPage({
  searchParams,
}: PageProps<"/auditorias/log">) {
  const { auditor } = (await searchParams) as { auditor?: string };
  const eu = await chamarApi<DadosDoUsuario>("/auth/eu");
  const nome = (auditor ?? (eu.ok ? eu.dados.usuario.nome : "")).trim();
  const r =
    nome.length >= 3
      ? await chamarApi<LogDoAuditor>(
          `/log-do-auditor?auditor=${encodeURIComponent(nome)}`,
        )
      : null;
  return (
    <>
      <h1 className={tituloDaPagina}>Log do Auditor</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        As auditorias em que a pessoa atuou como líder ou na equipe, com horas,
        referenciais e processos. Papel e horas vêm do plano de cada auditoria.
        Serve de base para a declaração de experiência na qualificação de
        auditor.
      </p>
      <form className="mt-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className={rotulo}>Auditor</span>
          <input
            name="auditor"
            defaultValue={nome}
            minLength={3}
            maxLength={120}
            className={`${campoCompacto} w-72`}
          />
        </label>
        <button type="submit" className={botaoSecundario}>
          <Search aria-hidden size={16} strokeWidth={2} />
          Consultar
        </button>
      </form>
      {r && !r.ok && <AvisoDeErro erro={r.erro} />}
      {r?.ok && (
        <>
          <section
            className={`${painel} mt-6 grid grid-cols-2 gap-5 p-5 sm:grid-cols-4`}
            aria-label="Totais"
          >
            {[
              ["Auditorias", r.dados.auditorias.length],
              [
                "Horas registradas",
                r.dados.horas ? r.dados.horas.toLocaleString("pt-BR") : "—",
              ],
              ["Referenciais", r.dados.referenciais.length],
              ["Processos", r.dados.processos.length],
            ].map(([t, v]) => (
              <div key={t}>
                <p className="text-xs text-texto-2">{t}</p>
                <p className="text-2xl font-semibold tabular-nums">{v}</p>
              </div>
            ))}
            <p className="col-span-full text-sm text-texto-2">
              {r.dados.perguntasConduzidas} pergunta(s) conduzida(s) ·{" "}
              {r.dados.achados} achado(s) registrado(s)
              {r.dados.referenciais.length > 0 &&
                ` · ${r.dados.referenciais.map((n) => NORMAS[n]).join(", ")}`}
            </p>
            {r.dados.processos.length > 0 && (
              <p className="col-span-full -mt-3 text-sm text-texto-2">
                {r.dados.processos
                  .map((p) => PROCESSOS_AUDITADOS[p])
                  .join(" · ")}
              </p>
            )}
          </section>

          <section className={`${painel} mt-6 p-5`}>
            <h2 className={tituloDaSecao}>Declaração de experiência</h2>
            <form
              action="/auditorias/log/declaracao"
              className="mt-3 flex flex-wrap items-end gap-4"
            >
              <input type="hidden" name="auditor" value={nome} />
              <label className="flex flex-col gap-1">
                <span className={rotulo}>Nome que deve constar</span>
                <input
                  name="nome"
                  defaultValue={nome}
                  maxLength={120}
                  className={`${campo} w-72`}
                />
              </label>
              <label className="inline-flex items-center gap-2 text-base">
                <input
                  type="checkbox"
                  name="anonimizar"
                  value="1"
                  defaultChecked
                  className="size-4 accent-primaria"
                />
                Anonimizar as organizações (Organização A, B, C…)
              </label>
              <button type="submit" className={botaoPrimario}>
                <FileText aria-hidden size={16} strokeWidth={2} />
                Gerar declaração
              </button>
            </form>
          </section>

          <section className={`${painel} mt-6`}>
            <h2 className={`${tituloDaSecao} px-5 pt-5`}>
              Auditorias registradas
            </h2>
            {r.dados.auditorias.length === 0 ? (
              <p className="px-5 py-5 text-base text-texto-2">
                Nenhuma auditoria com este nome como líder ou na equipe.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-borda border-t border-borda">
                {r.dados.auditorias.map((a) => (
                  <li
                    key={a.id}
                    className="grid gap-2 px-5 py-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto]"
                  >
                    <Link
                      href={`/auditorias/${a.id}`}
                      className="font-mono text-sm font-medium text-info hover:underline"
                    >
                      {a.numero}
                    </Link>
                    <div className="text-sm">
                      <p className="text-base">{a.organizacao}</p>
                      <p className="text-texto-2">
                        {formatarData(a.dataInicio)}
                        {a.dataFim !== a.dataInicio &&
                          ` a ${formatarData(a.dataFim)}`}{" "}
                        · {a.normas.map((n) => NORMAS[n]).join(", ")}
                      </p>
                      <p className="text-texto-2">
                        {PAPEIS_DO_AUDITOR[a.papel]} ·{" "}
                        {a.horas
                          ? `${a.horas.toLocaleString("pt-BR")} h`
                          : "sem horas"}{" "}
                        · {a.perguntasConduzidas} pergunta(s) · {a.achados}{" "}
                        achado(s)
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-1 sm:items-end">
                      <StatusDaAuditoria status={a.status} />
                      <Link
                        href={`/auditorias/${a.id}/plano`}
                        className="text-sm text-info hover:underline"
                      >
                        Papel e horas
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
