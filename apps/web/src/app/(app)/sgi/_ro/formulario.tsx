"use client";

import { useActionState, useState } from "react";
import { classeDoRo, type RiscoOuOportunidade } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { ClasseDoRo } from "@/components/marcadores";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { salvarRo } from "@/lib/acoes-sgi";
import {
  areaDeTexto,
  botaoPrimario,
  campo,
  painel,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import type { ConfigRo } from "./config";

export function FormularioDeRo({
  cfg,
  ro,
  embutido = false,
}: {
  cfg: ConfigRo;
  ro?: RiscoOuOportunidade;
  embutido?: boolean;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarRo.bind(null, cfg.base, ro?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> = estado.valores ?? {
    processo: ro?.processo ?? "",
    descricao: ro?.descricao ?? "",
    contexto: ro?.contexto ?? "",
    controlesExistentes: ro?.controlesExistentes ?? "",
    probabilidade: ro ? String(ro.probabilidade) : "",
    impacto: ro ? String(ro.impacto) : "",
    acao: ro?.acao ?? "",
    responsavel: ro?.responsavel ?? "",
    prazo: ro?.prazo ?? "",
  };
  const [a, setA] = useState(v.probabilidade ?? "");
  const [b, setB] = useState(v.impacto ?? "");
  const classe = a && b ? classeDoRo(Number(a), Number(b)) : null;
  const acaoObrigatoria = classe === "alta";
  return (
    <form action={acao} noValidate className={embutido ? "" : `${painel} mt-6`}>
      <input type="hidden" name="tipo" value={cfg.tipo} />
      {ro && <input type="hidden" name="versao" value={ro.versao} />}
      <div className={`grid gap-5 sm:grid-cols-3 ${embutido ? "" : "p-5"}`}>
        {estado.erro && !estado.erro.detalhes?.length && (
          <div className="sm:col-span-3">
            <AvisoDeErro erro={estado.erro} />
          </div>
        )}
        <Campo
          id="processo"
          rotulo="Processo"
          erro={erros.processo}
          className="sm:col-span-3"
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
          rotulo={`${cfg.contexto} (opcional)`}
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
        <Campo id="eixoA" rotulo={cfg.eixoA.rotulo} erro={erros.probabilidade}>
          <Selecao
            id="eixoA"
            name="probabilidade"
            defaultValue={v.probabilidade}
            onChange={(e) => setA(e.target.value)}
            className={campo}
            aria-invalid={Boolean(erros.probabilidade)}
          >
            <option value="">Escolha</option>
            {Object.entries(cfg.eixoA.escala).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo id="eixoB" rotulo={cfg.eixoB.rotulo} erro={erros.impacto}>
          <Selecao
            id="eixoB"
            name="impacto"
            defaultValue={v.impacto}
            onChange={(e) => setB(e.target.value)}
            className={campo}
            aria-invalid={Boolean(erros.impacto)}
          >
            <option value="">Escolha</option>
            {Object.entries(cfg.eixoB.escala).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-texto-2">
            {cfg.classe}
          </span>
          <span className="flex h-9 items-center">
            {classe ? (
              <ClasseDoRo classe={classe} />
            ) : (
              <span className="text-texto-3">{cfg.classeAjuda}</span>
            )}
          </span>
        </div>
        {cfg.controles && (
          <Campo
            id="controlesExistentes"
            rotulo={`${cfg.controles} (opcional)`}
            erro={erros.controlesExistentes}
            className="sm:col-span-3"
          >
            <textarea
              id="controlesExistentes"
              name="controlesExistentes"
              rows={2}
              maxLength={1000}
              defaultValue={v.controlesExistentes}
              className={areaDeTexto}
            />
          </Campo>
        )}
        <Campo
          id="acao"
          rotulo={acaoObrigatoria ? cfg.acao : `${cfg.acao} (opcional)`}
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
          rotulo={acaoObrigatoria ? "Responsável" : "Responsável (opcional)"}
          erro={erros.responsavel}
          className="sm:col-span-2"
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
          id="prazo"
          rotulo={acaoObrigatoria ? "Prazo" : "Prazo (opcional)"}
          erro={erros.prazo}
        >
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
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : ro ? "Salvar" : cfg.registrar}
        </button>
      </div>
    </form>
  );
}
