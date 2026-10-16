"use client";

import {
  CLASSIFICACOES_ESPECIAIS,
  PRIORIDADES_DE_ACAO,
  STATUS_DA_ACAO_FMEA,
  prioridadeDeAcao,
  type Fmea,
} from "@davinci/types";
import { Campo } from "@/components/campo";
import {
  EditorDeLinhas,
  type ColunaDoEditor,
} from "@/components/editor-de-linhas";
import { Formulario } from "@/components/formulario-de-acao";
import { criarFmea, salvarFmea } from "@/lib/acoes-automotivo";
import { campo } from "@/lib/estilos";

const COR_AP = {
  H: "bg-nao-conforme/10 text-nao-conforme",
  M: "bg-atencao/15 text-texto",
  L: "text-texto-2",
};

export function MarcadorDeAp({ ap }: { ap: keyof typeof PRIORIDADES_DE_ACAO }) {
  return (
    <span
      className={`inline-flex rounded-xs px-1.5 text-sm font-semibold whitespace-nowrap ${COR_AP[ap]}`}
      title={`Prioridade de ação ${PRIORIDADES_DE_ACAO[ap].toLowerCase()}`}
    >
      {ap}
    </span>
  );
}

function Cabecalho({
  erros,
  v,
  f,
}: {
  erros: Record<string, string>;
  v: Record<string, string>;
  f?: Fmea;
}) {
  const valor = (k: "titulo" | "item" | "cliente" | "equipe" | "revisao") =>
    v[k] ?? f?.[k] ?? "";
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Campo
        id="titulo"
        rotulo="Título"
        erro={erros.titulo}
        className="lg:col-span-2"
      >
        <input
          id="titulo"
          name="titulo"
          defaultValue={valor("titulo")}
          maxLength={150}
          className={campo}
        />
      </Campo>
      <Campo id="item" rotulo="Peça ou processo" erro={erros.item}>
        <input
          id="item"
          name="item"
          defaultValue={valor("item")}
          maxLength={150}
          className={campo}
        />
      </Campo>
      <Campo id="cliente" rotulo="Cliente" erro={erros.cliente}>
        <input
          id="cliente"
          name="cliente"
          defaultValue={valor("cliente")}
          maxLength={150}
          className={campo}
        />
      </Campo>
      <Campo id="revisao" rotulo="Revisão" erro={erros.revisao}>
        <input
          id="revisao"
          name="revisao"
          defaultValue={valor("revisao")}
          maxLength={20}
          className={campo}
        />
      </Campo>
      <Campo
        id="equipe"
        rotulo="Equipe multidisciplinar"
        erro={erros.equipe}
        className="sm:col-span-2 lg:col-span-5"
      >
        <input
          id="equipe"
          name="equipe"
          defaultValue={valor("equipe")}
          maxLength={300}
          placeholder="Qualidade, Processo, Produção, Manutenção"
          className={campo}
        />
      </Campo>
    </div>
  );
}

export function NovoFmea() {
  return (
    <Formulario acao={criarFmea} versao="" rotuloDoBotao="Criar FMEA">
      {(erros, v) => <Cabecalho erros={erros} v={v} />}
    </Formulario>
  );
}

const COLUNAS: ColunaDoEditor[] = [
  { nome: "etapa", rotulo: "Etapa do processo", max: 150 },
  {
    nome: "funcao",
    rotulo: "Função / requisito",
    largura: "min-w-56",
    max: 300,
  },
  {
    nome: "modoDeFalha",
    rotulo: "Modo de falha",
    largura: "min-w-48",
    max: 300,
  },
  { nome: "efeito", rotulo: "Efeito", largura: "min-w-48", max: 300 },
  { nome: "severidade", rotulo: "S", tipo: "nota", largura: "min-w-16" },
  {
    nome: "classificacao",
    rotulo: "Classe",
    tipo: "opcoes",
    opcoes: { CC: "CC", SC: "SC" },
    largura: "min-w-20",
  },
  { nome: "causa", rotulo: "Causa", largura: "min-w-48", max: 300 },
  {
    nome: "prevencao",
    rotulo: "Controle de prevenção",
    largura: "min-w-48",
    max: 300,
  },
  { nome: "ocorrencia", rotulo: "O", tipo: "nota", largura: "min-w-16" },
  {
    nome: "deteccao",
    rotulo: "Controle de detecção",
    largura: "min-w-48",
    max: 300,
  },
  { nome: "notaDeteccao", rotulo: "D", tipo: "nota", largura: "min-w-16" },
  { nome: "acao", rotulo: "Ação recomendada", largura: "min-w-56", max: 500 },
  { nome: "responsavel", rotulo: "Responsável", max: 120 },
  { nome: "prazo", rotulo: "Prazo", tipo: "data", largura: "min-w-36" },
  {
    nome: "statusAcao",
    rotulo: "Status",
    tipo: "opcoes",
    opcoes: STATUS_DA_ACAO_FMEA,
    largura: "min-w-28",
  },
];

export function EditorDoFmea({ fmea: f }: { fmea: Fmea }) {
  const iniciais = f.linhas.map((l) => ({
    ...Object.fromEntries(
      Object.entries(l).map(([k, x]) => [k, x === null ? "" : String(x)]),
    ),
  }));
  return (
    <Formulario
      acao={salvarFmea.bind(null, f.id)}
      versao={f.versao}
      rotuloDoBotao="Salvar FMEA"
    >
      {(erros, v) => (
        <>
          <Cabecalho erros={erros} v={v} f={f} />
          <p className="text-sm text-texto-2">
            S, O e D de 1 a 10 (escalas AIAG-VDA). A Prioridade de Ação (AP) é
            calculada; AP alta exige ação, responsável e prazo.{" "}
            {Object.entries(CLASSIFICACOES_ESPECIAIS)
              .map(
                ([k, n]) => `${k}: ${n.replace(/ \(.*\)/, "").toLowerCase()}`,
              )
              .join(" · ")}
            .
          </p>
          <EditorDeLinhas
            colunas={COLUNAS}
            iniciais={iniciais}
            erros={erros}
            rotuloDaLinha="Linha"
            extra={{
              rotulo: "AP",
              render: (l) => {
                const s = Number(l.severidade),
                  o = Number(l.ocorrencia),
                  d = Number(l.notaDeteccao);
                return s && o && d ? (
                  <MarcadorDeAp ap={prioridadeDeAcao(s, o, d)} />
                ) : (
                  <span className="text-texto-3">—</span>
                );
              },
            }}
          />
        </>
      )}
    </Formulario>
  );
}
