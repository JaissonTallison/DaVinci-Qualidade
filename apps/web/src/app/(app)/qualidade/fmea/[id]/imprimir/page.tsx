import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { DadosDoUsuario, Fmea } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { FolhaDeDocumento } from "@/components/folha-de-documento";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento, hojeEmBrasilia } from "@/lib/datas";

export const metadata: Metadata = { title: "FMEA" };

/** FMEA em folha paisagem, no formato de colunas do manual AIAG-VDA (passos 2 a 6). */
export default async function FmeaImpresso({
  params,
}: PageProps<"/qualidade/fmea/[id]/imprimir">) {
  const { id } = await params;
  const [r, eu] = await Promise.all([
    chamarApi<Fmea>(`/fmeas/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const f = r.dados;
  const empresa = eu.ok ? eu.dados.empresa.nome : undefined;
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
    <FolhaDeDocumento
      paisagem
      tipo="FMEA de processo"
      numero={`${f.numero}${f.revisao ? ` · rev. ${f.revisao}` : ""}`}
      titulo={f.titulo}
      subtitulo={`${f.item}${f.cliente ? ` · Cliente: ${f.cliente}` : ""}${f.equipe ? ` · Equipe: ${f.equipe}` : ""} · Atualizado em ${formatarMomento(f.atualizadoEm)}`}
      empresa={empresa}
      emitidoEm={formatarData(hojeEmBrasilia())}
      voltarHref={`/qualidade/fmea/${id}`}
      voltarRotulo="Voltar ao FMEA"
    >
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
    </FolhaDeDocumento>
  );
}
