import type { Metadata } from "next";
import Link from "next/link";
import {
  RESPOSTAS_ITEM,
  type Inspecao,
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

export default async function NovaNc({
  searchParams,
}: PageProps<"/qualidade/nao-conformidades/nova">) {
  const { inspecao: inspecaoId } = (await searchParams) as {
    inspecao?: string;
  };
  const inspecao = inspecaoId
    ? await chamarApi<Inspecao>(`/inspecoes/${inspecaoId}`)
    : null;
  const daInspecao =
    inspecao?.ok && inspecao.dados.status === "reprovada"
      ? inspecao.dados
      : null;
  return (
    <>
      <Link
        href={
          daInspecao
            ? `/qualidade/inspecoes/${daInspecao.id}`
            : "/qualidade/nao-conformidades"
        }
        className="text-sm text-texto-2 hover:underline"
      >
        {daInspecao ? daInspecao.numero : "Não conformidades"}
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Abrir não conformidade</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Registre o que aconteceu, quem responde e até quando. A causa raiz e a
        ação corretiva entram depois, no tratamento.
      </p>
      <FormularioNovaNc
        hoje={hojeEmBrasilia()}
        inicial={daInspecao ? aPartirDaInspecao(daInspecao) : undefined}
      />
    </>
  );
}
