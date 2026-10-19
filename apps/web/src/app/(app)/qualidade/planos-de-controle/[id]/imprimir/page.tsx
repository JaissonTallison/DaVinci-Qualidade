import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  FASES_DO_PLANO_DE_CONTROLE,
  TIPOS_DE_CARACTERISTICA,
  type DadosDoUsuario,
  type PlanoDeControle,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { FolhaDeDocumento } from "@/components/folha-de-documento";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento, hojeEmBrasilia } from "@/lib/datas";

export const metadata: Metadata = { title: "Plano de controle" };

/** Plano de controle em folha paisagem, com as colunas do anexo A da IATF 16949. */
export default async function PlanoDeControleImpresso({
  params,
}: PageProps<"/qualidade/planos-de-controle/[id]/imprimir">) {
  const { id } = await params;
  const [r, eu] = await Promise.all([
    chamarApi<PlanoDeControle>(`/planos-de-controle/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const p = r.dados;
  const empresa = eu.ok ? eu.dados.empresa.nome : undefined;
  const cab = [
    "Etapa",
    "Máquina",
    "Característica",
    "Tipo",
    "Classe",
    "Especificação",
    "Método",
    "Amostra",
    "Frequência",
    "Controle",
    "Reação",
  ];
  return (
    <FolhaDeDocumento
      paisagem
      tipo="Plano de controle"
      numero={`${p.numero}${p.revisao ? ` · rev. ${p.revisao}` : ""}`}
      titulo={p.titulo}
      subtitulo={`${FASES_DO_PLANO_DE_CONTROLE[p.fase]} · ${p.item}${p.fmeaNumero ? ` · FMEA ${p.fmeaNumero}` : ""} · Atualizado em ${formatarMomento(p.atualizadoEm)}`}
      empresa={empresa}
      emitidoEm={formatarData(hojeEmBrasilia())}
      voltarHref={`/qualidade/planos-de-controle/${id}`}
      voltarRotulo="Voltar ao plano"
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
          {p.linhas.map((l, i) => (
            <tr key={i} className="break-inside-avoid align-top">
              {[
                l.etapa,
                l.maquina,
                l.caracteristica,
                TIPOS_DE_CARACTERISTICA[l.tipo],
                l.classificacao ?? "",
                l.especificacao,
                l.metodo,
                l.amostra,
                l.frequencia,
                l.controle,
                l.reacao,
              ].map((x, j) => (
                <td key={j} className="border border-borda px-1 py-0.5">
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
