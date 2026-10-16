"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useActionState, useState } from "react";
import {
  NOTA_MATERIAL,
  nivelDeMaterialidade,
  NUMEROS_ODS,
  ODS,
  PILARES,
  type TemaEsg,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { IconeOds, Materialidade } from "@/components/marcadores-esg";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
  painel,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

const IMPACTOS = {
  1: "1 · Muito baixo",
  2: "2 · Baixo",
  3: "3 · Moderado",
  4: "4 · Alto",
  5: "5 · Muito alto",
};

/** Cadastro e edição do tema. A materialidade aparece enquanto a pessoa escolhe as notas. */
export function FormularioDeTema({
  acao,
  tema,
}: {
  acao: (e: EstadoDaAcao, f: FormData) => Promise<EstadoDaAcao>;
  tema?: TemaEsg;
}) {
  const [estado, enviar, salvando] = useActionState<EstadoDaAcao, FormData>(
    acao,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> = estado.valores ?? {
    nome: tema?.nome ?? "",
    pilar: tema?.pilar ?? "",
    descricao: tema?.descricao ?? "",
    ods: tema?.ods.join(",") ?? "",
    impacto: tema?.impacto ? String(tema.impacto) : "",
    relevancia: tema?.relevancia ? String(tema.relevancia) : "",
    responsavel: tema?.responsavel ?? "",
    meta: tema?.meta ?? "",
    prazoMeta: tema?.prazoMeta ?? "",
  };
  const marcados = new Set((v.ods ?? "").split(",").filter(Boolean));
  const [impacto, setImpacto] = useState(Number(v.impacto) || 0);
  const [relevancia, setRelevancia] = useState(Number(v.relevancia) || 0);
  const nota = impacto && relevancia ? impacto * relevancia : null;
  const material = nota !== null && nota >= NOTA_MATERIAL;
  const nota15 = (
    id: "impacto" | "relevancia",
    rotulo: string,
    ajuda: string,
    set: (n: number) => void,
  ) => (
    <Campo id={id} rotulo={rotulo} erro={erros[id]} ajuda={ajuda}>
      <Selecao
        id={id}
        name={id}
        defaultValue={v[id]}
        onChange={(e) => set(Number(e.target.value))}
        className={campo}
        aria-invalid={Boolean(erros[id])}
      >
        <option value="">Não avaliado</option>
        {Object.entries(IMPACTOS).map(([k, n]) => (
          <option key={k} value={k}>
            {n}
          </option>
        ))}
      </Selecao>
    </Campo>
  );
  return (
    <form action={enviar} noValidate className={tema ? "" : `${painel} mt-6`}>
      {tema && <input type="hidden" name="versao" value={tema.versao} />}
      <div className={`grid gap-5 sm:grid-cols-3 ${tema ? "" : "p-5"}`}>
        {estado.erro && !estado.erro.detalhes?.length && (
          <div className="sm:col-span-3">
            <AvisoDeErro erro={estado.erro} />
          </div>
        )}
        <Campo
          id="nome"
          rotulo="Tema"
          erro={erros.nome}
          className="sm:col-span-2"
        >
          <input
            id="nome"
            name="nome"
            maxLength={150}
            defaultValue={v.nome}
            className={campo}
            aria-invalid={Boolean(erros.nome)}
          />
        </Campo>
        <Campo id="pilar" rotulo="Pilar" erro={erros.pilar}>
          <Selecao
            id="pilar"
            name="pilar"
            defaultValue={v.pilar}
            className={campo}
            aria-invalid={Boolean(erros.pilar)}
          >
            <option value="">Escolha</option>
            {Object.entries(PILARES).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo
          id="descricao"
          rotulo="Descrição (opcional)"
          erro={erros.descricao}
          className="sm:col-span-3"
        >
          <textarea
            id="descricao"
            name="descricao"
            rows={2}
            maxLength={500}
            defaultValue={v.descricao}
            className={areaDeTexto}
          />
        </Campo>
        {nota15(
          "impacto",
          "Impacto",
          "Quanto a empresa afeta pessoas e ambiente neste tema.",
          setImpacto,
        )}
        {nota15(
          "relevancia",
          "Relevância",
          "Quanto o tema pesa no negócio e para as partes interessadas.",
          setRelevancia,
        )}
        <div
          className="flex items-end pb-2.5 text-sm text-texto-2"
          aria-live="polite"
        >
          {nota === null ? (
            "Avalie os dois para ver a materialidade."
          ) : (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              Materialidade:{" "}
              <Materialidade nivel={nivelDeMaterialidade(nota)} nota={nota} />
              {material && <span>· material, pede meta</span>}
            </span>
          )}
        </div>
        <Campo
          id="responsavel"
          rotulo={material ? "Responsável" : "Responsável (opcional)"}
          erro={erros.responsavel}
        >
          <input
            id="responsavel"
            name="responsavel"
            list="pessoas"
            maxLength={120}
            defaultValue={v.responsavel}
            className={campo}
            aria-invalid={Boolean(erros.responsavel)}
          />
        </Campo>
        <Campo
          id="meta"
          rotulo={material ? "Meta" : "Meta (opcional)"}
          erro={erros.meta}
          ajuda="O que, quanto e até quando. Ex.: reduzir 10% do consumo de energia por peça."
          className="sm:col-span-2"
        >
          <input
            id="meta"
            name="meta"
            maxLength={300}
            defaultValue={v.meta}
            className={campo}
            aria-invalid={Boolean(erros.meta)}
          />
        </Campo>
        <Campo
          id="prazoMeta"
          rotulo={material ? "Prazo da meta" : "Prazo da meta (opcional)"}
          erro={erros.prazoMeta}
        >
          <input
            id="prazoMeta"
            name="prazoMeta"
            type="date"
            defaultValue={v.prazoMeta}
            className={campo}
            aria-invalid={Boolean(erros.prazoMeta)}
          />
        </Campo>
        <fieldset className="sm:col-span-3">
          <legend className="text-sm font-semibold text-texto-2">
            ODS a que o tema contribui
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {NUMEROS_ODS.map((n) => (
              <label key={n} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="ods"
                  value={n}
                  defaultChecked={marcados.has(String(n))}
                  className="size-4 accent-primaria"
                />
                <IconeOds numero={n} />
                {ODS[n]}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div
        className={`flex gap-3 ${tema ? "mt-5" : "justify-end border-t border-borda px-5 py-3"}`}
      >
        {!tema && (
          <Link href="/esg/temas" className={botaoSecundario}>
            <ArrowLeft aria-hidden size={16} strokeWidth={2} />
            Voltar
          </Link>
        )}
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando
            ? "Salvando…"
            : tema
              ? "Salvar alterações"
              : "Cadastrar tema"}
        </button>
      </div>
    </form>
  );
}
