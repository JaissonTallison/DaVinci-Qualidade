"use client";

import {
  FASES_DO_PLANO_DE_CONTROLE,
  TIPOS_DE_CARACTERISTICA,
  type FmeaResumo,
  type PlanoDeControle,
} from "@davinci/types";
import { Campo } from "@/components/campo";
import {
  EditorDeLinhas,
  type ColunaDoEditor,
} from "@/components/editor-de-linhas";
import { Formulario } from "@/components/formulario-de-acao";
import { Selecao } from "@/components/selecao";
import {
  criarPlanoDeControle,
  salvarPlanoDeControle,
} from "@/lib/acoes-automotivo";
import { campo } from "@/lib/estilos";

function Cabecalho({
  erros,
  v,
  p,
  fmeas,
  fmeaInicial,
}: {
  erros: Record<string, string>;
  v: Record<string, string>;
  p?: PlanoDeControle;
  fmeas: FmeaResumo[];
  fmeaInicial?: string;
}) {
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
          defaultValue={v.titulo ?? p?.titulo}
          maxLength={150}
          className={campo}
        />
      </Campo>
      <Campo id="item" rotulo="Peça ou família" erro={erros.item}>
        <input
          id="item"
          name="item"
          defaultValue={v.item ?? p?.item}
          maxLength={150}
          className={campo}
        />
      </Campo>
      <Campo id="fase" rotulo="Fase" erro={erros.fase}>
        <Selecao
          id="fase"
          name="fase"
          defaultValue={v.fase ?? p?.fase ?? "producao"}
          className={campo}
        >
          {Object.entries(FASES_DO_PLANO_DE_CONTROLE).map(([k, n]) => (
            <option key={k} value={k}>
              {n}
            </option>
          ))}
        </Selecao>
      </Campo>
      <Campo id="revisao" rotulo="Revisão" erro={erros.revisao}>
        <input
          id="revisao"
          name="revisao"
          defaultValue={v.revisao ?? p?.revisao ?? ""}
          maxLength={20}
          className={campo}
        />
      </Campo>
      <Campo
        id="fmeaId"
        rotulo="FMEA de origem"
        erro={erros.fmeaId}
        ajuda={p ? undefined : "Com FMEA, as linhas são geradas a partir dele."}
        className="sm:col-span-2"
      >
        <Selecao
          id="fmeaId"
          name="fmeaId"
          defaultValue={v.fmeaId ?? p?.fmeaId ?? fmeaInicial ?? ""}
          className={campo}
        >
          <option value="">Sem FMEA</option>
          {fmeas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.numero} · {f.titulo}
            </option>
          ))}
        </Selecao>
      </Campo>
    </div>
  );
}

export function NovoPlanoDeControle({
  fmeas,
  fmeaInicial,
}: {
  fmeas: FmeaResumo[];
  fmeaInicial?: string;
}) {
  return (
    <Formulario
      acao={criarPlanoDeControle}
      versao=""
      rotuloDoBotao="Criar plano de controle"
    >
      {(erros, v) => (
        <Cabecalho
          erros={erros}
          v={v}
          fmeas={fmeas}
          fmeaInicial={fmeaInicial}
        />
      )}
    </Formulario>
  );
}

const COLUNAS: ColunaDoEditor[] = [
  { nome: "etapa", rotulo: "Etapa / operação", max: 150 },
  { nome: "maquina", rotulo: "Máquina / dispositivo", max: 150 },
  {
    nome: "caracteristica",
    rotulo: "Característica",
    largura: "min-w-56",
    max: 200,
  },
  {
    nome: "tipo",
    rotulo: "Tipo",
    tipo: "opcoes",
    opcoes: TIPOS_DE_CARACTERISTICA,
    largura: "min-w-28",
  },
  {
    nome: "classificacao",
    rotulo: "Classe",
    tipo: "opcoes",
    opcoes: { CC: "CC", SC: "SC" },
    largura: "min-w-20",
  },
  { nome: "especificacao", rotulo: "Especificação / tolerância", max: 200 },
  {
    nome: "metodo",
    rotulo: "Método de avaliação",
    largura: "min-w-48",
    max: 200,
  },
  { nome: "amostra", rotulo: "Amostra", largura: "min-w-24", max: 60 },
  { nome: "frequencia", rotulo: "Frequência", largura: "min-w-28", max: 60 },
  {
    nome: "controle",
    rotulo: "Método de controle",
    largura: "min-w-48",
    max: 200,
  },
  { nome: "reacao", rotulo: "Plano de reação", largura: "min-w-56", max: 300 },
];

export function EditorDoPlanoDeControle({
  plano: p,
  fmeas,
}: {
  plano: PlanoDeControle;
  fmeas: FmeaResumo[];
}) {
  const iniciais = p.linhas.map((l) =>
    Object.fromEntries(
      Object.entries(l).map(([k, x]) => [k, x === null ? "" : String(x)]),
    ),
  );
  return (
    <Formulario
      acao={salvarPlanoDeControle.bind(null, p.id)}
      versao={p.versao}
      rotuloDoBotao="Salvar plano de controle"
    >
      {(erros, v) => (
        <>
          <Cabecalho erros={erros} v={v} p={p} fmeas={fmeas} />
          <EditorDeLinhas
            colunas={COLUNAS}
            iniciais={iniciais}
            erros={erros}
            rotuloDaLinha="Característica"
          />
        </>
      )}
    </Formulario>
  );
}
