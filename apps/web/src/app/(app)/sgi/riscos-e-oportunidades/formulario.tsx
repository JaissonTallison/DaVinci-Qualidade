"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { classeDoRo, TIPOS_RO, type RiscoOuOportunidade } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { ClasseDoRo } from "@/components/marcadores";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { salvarRo } from "@/lib/acoes-sgi";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
  painel,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

const ESCALA = {
  1: "1 · Muito baixa",
  2: "2 · Baixa",
  3: "3 · Média",
  4: "4 · Alta",
  5: "5 · Muito alta",
};

export function FormularioDeRo({
  ro,
  embutido = false,
}: {
  ro?: RiscoOuOportunidade;
  embutido?: boolean;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarRo.bind(null, ro?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> = estado.valores ?? {
    tipo: ro?.tipo ?? "",
    processo: ro?.processo ?? "",
    descricao: ro?.descricao ?? "",
    contexto: ro?.contexto ?? "",
    probabilidade: ro ? String(ro.probabilidade) : "",
    impacto: ro ? String(ro.impacto) : "",
    acao: ro?.acao ?? "",
    responsavel: ro?.responsavel ?? "",
    prazo: ro?.prazo ?? "",
  };
  const [p, setP] = useState(v.probabilidade ?? "");
  const [i, setI] = useState(v.impacto ?? "");
  const classe = p && i ? classeDoRo(Number(p), Number(i)) : null;
  return (
    <form
      action={acao}
      noValidate
      className={embutido ? "" : `${painel} mt-6 max-w-4xl`}
    >
      {ro && <input type="hidden" name="versao" value={ro.versao} />}
      <div className={`grid gap-5 sm:grid-cols-3 ${embutido ? "" : "p-5"}`}>
        {estado.erro && !estado.erro.detalhes?.length && (
          <div className="sm:col-span-3">
            <AvisoDeErro erro={estado.erro} />
          </div>
        )}
        <Campo id="tipo" rotulo="Tipo" erro={erros.tipo}>
          <Selecao
            id="tipo"
            name="tipo"
            defaultValue={v.tipo}
            className={campo}
            aria-invalid={Boolean(erros.tipo)}
          >
            <option value="">Escolha</option>
            {Object.entries(TIPOS_RO).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo
          id="processo"
          rotulo="Processo"
          erro={erros.processo}
          className="sm:col-span-2"
        >
          <input
            id="processo"
            name="processo"
            maxLength={120}
            defaultValue={v.processo}
            className={campo}
            aria-invalid={Boolean(erros.processo)}
          />
        </Campo>
        <Campo
          id="descricao"
          rotulo="Descrição"
          erro={erros.descricao}
          className="sm:col-span-3"
        >
          <input
            id="descricao"
            name="descricao"
            maxLength={500}
            defaultValue={v.descricao}
            className={campo}
            aria-invalid={Boolean(erros.descricao)}
          />
        </Campo>
        <Campo
          id="contexto"
          rotulo="Contexto ou causa (opcional)"
          erro={erros.contexto}
          className="sm:col-span-3"
        >
          <input
            id="contexto"
            name="contexto"
            maxLength={500}
            defaultValue={v.contexto}
            className={campo}
          />
        </Campo>
        <Campo
          id="probabilidade"
          rotulo="Probabilidade"
          erro={erros.probabilidade}
        >
          <Selecao
            id="probabilidade"
            name="probabilidade"
            defaultValue={v.probabilidade}
            onChange={(e) => setP(e.target.value)}
            className={campo}
            aria-invalid={Boolean(erros.probabilidade)}
          >
            <option value="">Escolha</option>
            {Object.entries(ESCALA).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo id="impacto" rotulo="Impacto" erro={erros.impacto}>
          <Selecao
            id="impacto"
            name="impacto"
            defaultValue={v.impacto}
            onChange={(e) => setI(e.target.value)}
            className={campo}
            aria-invalid={Boolean(erros.impacto)}
          >
            <option value="">Escolha</option>
            {Object.entries(ESCALA).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-texto-2">
            Classificação
          </span>
          <span className="flex h-9 items-center">
            {classe ? (
              <ClasseDoRo classe={classe} />
            ) : (
              <span className="text-texto-3">
                Escolha probabilidade e impacto
              </span>
            )}
          </span>
        </div>
        <Campo
          id="acao"
          rotulo={classe === "alta" ? "Ação" : "Ação (opcional)"}
          erro={erros.acao}
          className="sm:col-span-3"
        >
          <textarea
            id="acao"
            name="acao"
            rows={2}
            maxLength={1000}
            defaultValue={v.acao}
            className={areaDeTexto}
            aria-invalid={Boolean(erros.acao)}
          />
        </Campo>
        <Campo
          id="responsavel"
          rotulo="Responsável"
          erro={erros.responsavel}
          className="sm:col-span-2"
        >
          <input
            id="responsavel"
            name="responsavel"
            maxLength={120}
            defaultValue={v.responsavel}
            className={campo}
            aria-invalid={Boolean(erros.responsavel)}
          />
        </Campo>
        <Campo id="prazo" rotulo="Prazo" erro={erros.prazo}>
          <input
            id="prazo"
            name="prazo"
            type="date"
            defaultValue={v.prazo}
            className={campo}
            aria-invalid={Boolean(erros.prazo)}
          />
        </Campo>
      </div>
      <div
        className={`flex justify-end gap-3 ${embutido ? "mt-5" : "border-t border-borda px-5 py-3"}`}
      >
        {!embutido && (
          <Link href="/sgi/riscos-e-oportunidades" className={botaoSecundario}>
            <ArrowLeft aria-hidden size={16} strokeWidth={2} />
            Voltar
          </Link>
        )}
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : ro ? "Salvar" : "Registrar"}
        </button>
      </div>
    </form>
  );
}
