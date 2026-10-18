import type { Metadata } from "next";
import Link from "next/link";
import {
  RESPOSTAS_ITEM,
  type Acidente,
  type AcidenteResumo,
  type AuditoriaResumo,
  type Inspecao,
  type InspecaoResumo,
  type Instrumento,
  type ItemDeLista,
  type OrigemNc,
  type Pagina,
  type Reclamacao,
  type SetorDaEmpresa,
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

/** Vindo de um acidente: o tratamento (ação corretiva e eficácia) segue no ciclo da NC. */
function aPartirDoAcidente(a: Acidente): Record<string, string> {
  const gravidade = {
    com_afastamento: "alta",
    sem_afastamento: "media",
    incidente: "media",
    quase_acidente: "baixa",
  }[a.tipo];
  return {
    titulo: `${a.numero}: ${a.descricao}`.slice(0, 150),
    descricao: [
      `${a.numero} de ${a.data.split("-").reverse().join("/")} em ${a.local}${a.acidentado ? `, com ${a.acidentado}` : ""}.`,
      a.descricao,
      a.causas ? `Causas apontadas na investigação: ${a.causas}` : "",
      a.medidas ? `Medidas definidas: ${a.medidas}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    origem: "acidente",
    origemRef: a.numero,
    tipo: "processo",
    gravidade,
    setor: a.setor ?? "",
  };
}

export default async function NovaNc({
  searchParams,
}: PageProps<"/qualidade/nao-conformidades/nova">) {
  const q = (await searchParams) as {
    inspecao?: string;
    instrumento?: string;
    acidente?: string;
  };
  // A NC pode vir de uma inspeção reprovada, de um instrumento reprovado ou de um acidente, já preenchida.
  // Também busca os registros das origens para selecionar o "Registro de origem" em vez de digitar.
  const [
    inspecao,
    instrumento,
    acidente,
    setores,
    auditorias,
    inspecoes,
    acidentes,
    reclamacoes,
    processos,
  ] = await Promise.all([
    q.inspecao ? chamarApi<Inspecao>(`/inspecoes/${q.inspecao}`) : null,
    q.instrumento
      ? chamarApi<Instrumento>(`/instrumentos/${q.instrumento}`)
      : null,
    q.acidente ? chamarApi<Acidente>(`/acidentes/${q.acidente}`) : null,
    chamarApi<SetorDaEmpresa[]>("/setores-da-empresa"),
    chamarApi<Pagina<AuditoriaResumo>>("/auditorias?porPagina=50"),
    chamarApi<Pagina<InspecaoResumo>>("/inspecoes?porPagina=50"),
    chamarApi<Pagina<AcidenteResumo>>("/acidentes?porPagina=50"),
    chamarApi<Reclamacao[]>("/reclamacoes"),
    chamarApi<ItemDeLista[]>("/listas/processo"),
  ]);
  const setoresAtivos = setores.ok ? setores.dados.map((s) => s.nome) : [];
  const processosAtivos = processos.ok ? processos.dados.map((p) => p.nome) : [];
  // Número → descrição curta, por origem, para o autocomplete do campo "Registro de origem"
  const opcao = (numero: string, desc: string) => ({ numero, desc });
  const registrosPorOrigem: Partial<
    Record<OrigemNc, { numero: string; desc: string }[]>
  > = {
    auditoria: auditorias.ok
      ? auditorias.dados.itens.map((a) => opcao(a.numero, a.escopo))
      : [],
    inspecao: inspecoes.ok
      ? inspecoes.dados.itens.map((i) => opcao(i.numero, i.objeto))
      : [],
    acidente: acidentes.ok
      ? acidentes.dados.itens.map((a) => opcao(a.numero, a.local))
      : [],
    reclamacao_cliente: reclamacoes.ok
      ? reclamacoes.dados.map((r) => opcao(r.numero, r.descricao))
      : [],
  };
  const origem =
    inspecao?.ok && inspecao.dados.status === "reprovada"
      ? {
          href: `/qualidade/inspecoes/${inspecao.dados.id}`,
          rotulo: inspecao.dados.numero,
          inicial: aPartirDaInspecao(inspecao.dados),
        }
      : instrumento?.ok && instrumento.dados.situacao === "reprovado"
        ? {
            href: `/qualidade/calibracao/${instrumento.dados.id}`,
            rotulo: instrumento.dados.tag,
            inicial: aPartirDoInstrumento(instrumento.dados),
          }
        : acidente?.ok && acidente.dados.status !== "cancelado"
          ? {
              href: `/seguranca/acidentes/${acidente.dados.id}`,
              rotulo: acidente.dados.numero,
              inicial: aPartirDoAcidente(acidente.dados),
            }
          : null;
  return (
    <>
      <Link
        href={origem?.href ?? "/qualidade/nao-conformidades"}
        className="dv-voltar"
      >
        {origem?.rotulo ?? "Não conformidades"}
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Abrir não conformidade</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Registre o que aconteceu, quem responde e até quando. A causa raiz e a
        ação corretiva entram depois, no tratamento.
      </p>
      <FormularioNovaNc
        hoje={hojeEmBrasilia()}
        inicial={origem?.inicial}
        setores={setoresAtivos}
        processos={processosAtivos}
        registrosPorOrigem={registrosPorOrigem}
      />
    </>
  );
}
