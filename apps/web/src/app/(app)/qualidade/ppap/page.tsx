import type { Metadata } from "next";
import Link from "next/link";
import {
  STATUS_DO_PPAP,
  type DadosDoUsuario,
  type FmeaResumo,
  type PlanoDeControleResumo,
  type PpapResumo,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { NovoPpap } from "./formularios";

export const metadata: Metadata = { title: "PPAP" };

/** PPAP (AIAG 4ª ed.): os 18 elementos por nível de submissão, da preparação à decisão do cliente. */
export default async function Ppaps() {
  const [r, fmeas, planos, eu] = await Promise.all([
    chamarApi<PpapResumo[]>("/ppaps"),
    chamarApi<FmeaResumo[]>("/fmeas"),
    chamarApi<PlanoDeControleResumo[]>("/planos-de-controle"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("qualidade.editar");
  return (
    <>
      <h1 className={tituloDaPagina}>PPAP</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        Processo de aprovação de peça de produção. O nível de submissão define
        quais dos 18 elementos vão ao cliente; o sistema só registra a submissão
        com esses elementos concluídos ou justificados.
      </p>
      {podeEditar && (
        <Recolhido titulo="Abrir PPAP">
          <NovoPpap
            fmeas={fmeas.ok ? fmeas.dados : []}
            planos={planos.ok ? planos.dados : []}
          />
        </Recolhido>
      )}
      <section className={`${painel} mt-6`}>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : r.dados.length === 0 ? (
          <p className="px-5 py-6 text-base text-texto-2">
            Nenhum PPAP aberto.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borda text-left text-texto-2">
                <th className="px-4 py-2 font-semibold">Número</th>
                <th className="px-4 py-2 font-semibold">Peça</th>
                <th className="px-4 py-2 font-semibold">Cliente</th>
                <th className="px-4 py-2 font-semibold">Nível</th>
                <th className="px-4 py-2 font-semibold">Situação</th>
                <th className="px-4 py-2 font-semibold">Submetido</th>
              </tr>
            </thead>
            <tbody>
              {r.dados.map((p) => (
                <tr key={p.id} className="border-b border-borda last:border-0">
                  <td data-rotulo="Número" className="px-4 py-2.5">
                    <Link
                      href={`/qualidade/ppap/${p.id}`}
                      className="font-mono text-info hover:underline"
                    >
                      {p.numero}
                    </Link>
                  </td>
                  <td data-rotulo="Peça" className="px-4 py-2.5">
                    {p.peca}
                    <span className="block font-mono text-texto-2">
                      {p.numeroDaPeca}
                    </span>
                  </td>
                  <td data-rotulo="Cliente" className="px-4 py-2.5">
                    {p.cliente}
                  </td>
                  <td data-rotulo="Nível" className="px-4 py-2.5 tabular-nums">
                    {p.nivel}
                  </td>
                  <td
                    data-rotulo="Situação"
                    className={`px-4 py-2.5 ${p.status === "rejeitado" ? "font-semibold text-nao-conforme" : p.status === "aprovado" ? "text-conforme" : ""}`}
                  >
                    {STATUS_DO_PPAP[p.status]}
                    {p.status === "em_preparacao" &&
                      p.pendentesParaSubmeter > 0 && (
                        <span className="block text-texto-2">
                          {p.pendentesParaSubmeter} elemento(s) a concluir
                        </span>
                      )}
                  </td>
                  <td
                    data-rotulo="Submetido"
                    className="px-4 py-2.5 text-texto-2"
                  >
                    {p.submetidoEm ? formatarData(p.submetidoEm) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
