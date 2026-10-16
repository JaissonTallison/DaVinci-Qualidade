import type { Metadata } from "next";
import Link from "next/link";
import type { DadosDoUsuario, FmeaResumo } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { formatarMomento } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { MarcadorDeAp, NovoFmea } from "./formularios";

export const metadata: Metadata = { title: "FMEA de processo" };

/** PFMEA (AIAG-VDA): modos de falha por etapa, com S, O, D e a Prioridade de Ação. */
export default async function Fmeas() {
  const [r, eu] = await Promise.all([
    chamarApi<FmeaResumo[]>("/fmeas"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("qualidade.editar");
  return (
    <>
      <h1 className={tituloDaPagina}>FMEA de processo</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        Análise de modos de falha do processo no método AIAG-VDA: cada falha com
        severidade, ocorrência e detecção, e a Prioridade de Ação (alta, média,
        baixa) no lugar do NPR. Base do plano de controle e elemento do PPAP.
      </p>
      {podeEditar && (
        <Recolhido titulo="Novo FMEA">
          <NovoFmea />
        </Recolhido>
      )}
      <section className={`${painel} mt-6`}>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : r.dados.length === 0 ? (
          <p className="px-5 py-6 text-base text-texto-2">
            Nenhum FMEA cadastrado.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borda text-left text-texto-2">
                <th className="px-4 py-2 font-semibold">Número</th>
                <th className="px-4 py-2 font-semibold">Título</th>
                <th className="px-4 py-2 font-semibold">
                  AP alta · média · baixa
                </th>
                <th className="px-4 py-2 font-semibold">Ações altas abertas</th>
                <th className="px-4 py-2 font-semibold">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {r.dados.map((f) => (
                <tr key={f.id} className="border-b border-borda last:border-0">
                  <td data-rotulo="Número" className="px-4 py-2.5">
                    <Link
                      href={`/qualidade/fmea/${f.id}`}
                      className="font-mono text-info hover:underline"
                    >
                      {f.numero}
                    </Link>
                  </td>
                  <td data-rotulo="Título" className="px-4 py-2.5">
                    {f.titulo}
                    <span className="block text-texto-2">
                      {f.item}
                      {f.cliente && ` · ${f.cliente}`}
                    </span>
                  </td>
                  <td data-rotulo="AP" className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-2 tabular-nums">
                      <MarcadorDeAp ap="H" /> {f.contagem.H}{" "}
                      <MarcadorDeAp ap="M" /> {f.contagem.M}{" "}
                      <MarcadorDeAp ap="L" /> {f.contagem.L}
                    </span>
                  </td>
                  <td
                    data-rotulo="Ações altas abertas"
                    className={`px-4 py-2.5 tabular-nums ${f.acoesAltasAbertas ? "font-semibold text-nao-conforme" : "text-texto-2"}`}
                  >
                    {f.acoesAltasAbertas}
                  </td>
                  <td
                    data-rotulo="Atualizado"
                    className="px-4 py-2.5 text-texto-2"
                  >
                    {formatarMomento(f.atualizadoEm)}
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
