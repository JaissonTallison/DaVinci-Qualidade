import type { Metadata } from "next";
import Link from "next/link";
import {
  RESPOSTAS_ITEM,
  type Inspecao,
  type Instrumento,
  type TipoInspecao,
  type TipoNc,
} from "@davinci/types";
import { chamarApi } from "@/lib/api";
import { hojeEmBrasilia } from "@/lib/datas";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioNovaNc } from "./formulario";

export const metadata: Metadata = { title: "Abrir NC" };

/** Tipo da NC conforme o que a inspeção conferia. */
const TIPO_DA_NC: Record<TipoInspecao, TipoNc> = {
  recebimento: "produto",
  produto_final: "produto",
  processo: "processo",
  seguranca: "processo",
  servico: "servico",
  outra: "processo",
};

/** Vinda de uma inspeção reprovada: origem, referência, objeto, lote e os itens NOK com o que foi encontrado. */
function aPartirDaInspecao(i: Inspecao): Record<string, string> {
  const encontrados = i.itens
    .filter((item) => item.resposta === "nok")
    .map(
      (item) =>
        `- Item ${item.ordem + 1} (${item.verificar}): ${item.observacao ?? RESPOSTAS_ITEM.nok}`,
    )
    .join("\n");
  return {
    titulo: `Reprovação na ${i.numero}: ${i.objeto}`.slice(0, 150),
    descricao: `Inspeção ${i.numero} de ${i.data.split("-").reverse().join("/")}, por ${i.inspetor}, reprovada nos itens:\n${encontrados}`,
    origem: "inspecao",
    origemRef: i.numero,
    tipo: TIPO_DA_NC[i.tipo],
    produto: i.objeto.slice(0, 150),
    lote: i.lote ?? "",
  };
}

/** Vinda de um instrumento reprovado: avaliar as medições feitas com ele desde a última calibração aprovada. */
function aPartirDoInstrumento(i: Instrumento): Record<string, string> {
  const reprovada = i.calibracoes.find((c) => !c.anulada);
  const aprovadaAnterior = i.calibracoes.find((c) => !c.anulada && c.aprovada);
  const data = (d: string) => d.split("-").reverse().join("/");
  return {
    titulo: `Instrumento ${i.tag} reprovado na calibração`.slice(0, 150),
    descricao: [
      `${i.descricao} (${i.tag}) reprovado na calibração de ${reprovada ? data(reprovada.data) : "data não informada"}${reprovada?.laboratorio ? `, ${reprovada.laboratorio}` : ""}${reprovada?.certificado ? `, certificado ${reprovada.certificado}` : ""}.`,
      reprovada?.erroEncontrado
        ? `Erro encontrado: ${reprovada.erroEncontrado}.`
        : "",
      i.criterioAceitacao
        ? `Critério de aceitação: ${i.criterioAceitacao}.`
        : "",
      `Avaliar as medições feitas com o instrumento desde ${aprovadaAnterior ? `a calibração aprovada de ${data(aprovadaAnterior.data)}` : "o início do uso"}.`,
    ]
      .filter(Boolean)
      .join("\n"),
    origem: "calibracao",
    origemRef: i.tag,
    tipo: "processo",
    setor: i.local ?? "",
    responsavel: i.responsavel ?? "",
  };
}

export default async function NovaNc({
  searchParams,
}: PageProps<"/qualidade/nao-conformidades/nova">) {
  const { inspecao: inspecaoId, instrumento: instrumentoId } =
    (await searchParams) as { inspecao?: string; instrumento?: string };
  // A NC pode vir de uma inspeção reprovada ou de um instrumento reprovado na calibração, já preenchida
  const [inspecao, instrumento] = await Promise.all([
    inspecaoId ? chamarApi<Inspecao>(`/inspecoes/${inspecaoId}`) : null,
    instrumentoId
      ? chamarApi<Instrumento>(`/instrumentos/${instrumentoId}`)
      : null,
  ]);
  const daInspecao =
    inspecao?.ok && inspecao.dados.status === "reprovada"
      ? inspecao.dados
      : null;
  const doInstrumento =
    instrumento?.ok && instrumento.dados.situacao === "reprovado"
      ? instrumento.dados
      : null;
  const origem = daInspecao
    ? {
        href: `/qualidade/inspecoes/${daInspecao.id}`,
        rotulo: daInspecao.numero,
        inicial: aPartirDaInspecao(daInspecao),
      }
    : doInstrumento
      ? {
          href: `/qualidade/calibracao/${doInstrumento.id}`,
          rotulo: doInstrumento.tag,
          inicial: aPartirDoInstrumento(doInstrumento),
        }
      : null;
  return (
    <>
      <Link
        href={origem?.href ?? "/qualidade/nao-conformidades"}
        className="text-sm text-texto-2 hover:underline"
      >
        {origem?.rotulo ?? "Não conformidades"}
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Abrir não conformidade</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Registre o que aconteceu, quem responde e até quando. A causa raiz e a
        ação corretiva entram depois, no tratamento.
      </p>
      <FormularioNovaNc hoje={hojeEmBrasilia()} inicial={origem?.inicial} />
    </>
  );
}
