"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  GRUPOS_DE_RISCO,
  nivelDoRisco,
  PROBABILIDADES,
  SEVERIDADES,
  type Risco,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { NivelDoRisco } from "@/components/marcadores";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { salvarRisco } from "@/lib/acoes-pgr-pt";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
  painel,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

/** Identificar e avaliar o risco. O nível aparece enquanto se escolhe severidade e probabilidade. */
export function FormularioDeRisco({
  risco,
  embutido = false,
}: {
  risco?: Risco;
  embutido?: boolean;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarRisco.bind(null, risco?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> = estado.valores ?? {
    grupo: risco?.grupo ?? "",
    local: risco?.local ?? "",
    perigo: risco?.perigo ?? "",
    danos: risco?.danos ?? "",
    severidade: risco ? String(risco.severidade) : "",
    probabilidade: risco ? String(risco.probabilidade) : "",
    controles: risco?.controles ?? "",
    acoes: risco?.acoes ?? "",
    responsavel: risco?.responsavel ?? "",
    prazo: risco?.prazo ?? "",
  };
  const [sev, setSev] = useState(v.severidade ?? "");
  const [prob, setProb] = useState(v.probabilidade ?? "");
  const nivel = sev && prob ? nivelDoRisco(Number(sev), Number(prob)) : null;
  return (
    <form action={acao} noValidate className={embutido ? "" : `${painel} mt-6`}>
      {risco && <input type="hidden" name="versao" value={risco.versao} />}
      <div className={`grid gap-5 sm:grid-cols-3 ${embutido ? "" : "p-5"}`}>
        {estado.erro && !estado.erro.detalhes?.length && (
          <div className="sm:col-span-3">
            <AvisoDeErro erro={estado.erro} />
          </div>
        )}
        <Campo id="grupo" rotulo="Grupo" erro={erros.grupo}>
          <Selecao
            id="grupo"
            name="grupo"
            defaultValue={v.grupo}
            className={campo}
            aria-invalid={Boolean(erros.grupo)}
          >
            <option value="">Escolha</option>
            {Object.entries(GRUPOS_DE_RISCO).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo
          id="local"
          rotulo="Setor ou atividade"
          erro={erros.local}
          className="sm:col-span-2"
        >
          <input
            id="local"
            name="local"
            list="setores"
            maxLength={120}
            defaultValue={v.local}
            className={campo}
            aria-invalid={Boolean(erros.local)}
          />
        </Campo>
        <Campo
          id="perigo"
          rotulo="Perigo (fonte ou situação)"
          erro={erros.perigo}
          ajuda="Ex.: ruído das prensas, prensa sem proteção"
          className="sm:col-span-3"
        >
          <input
            id="perigo"
            name="perigo"
            maxLength={200}
            defaultValue={v.perigo}
            className={campo}
            aria-invalid={Boolean(erros.perigo)}
          />
        </Campo>
        <Campo
          id="danos"
          rotulo="Possíveis danos à saúde"
          erro={erros.danos}
          className="sm:col-span-3"
        >
          <input
            id="danos"
            name="danos"
            maxLength={300}
            defaultValue={v.danos}
            className={campo}
            aria-invalid={Boolean(erros.danos)}
          />
        </Campo>
        <Campo id="severidade" rotulo="Severidade" erro={erros.severidade}>
          <Selecao
            id="severidade"
            name="severidade"
            defaultValue={v.severidade}
            onChange={(e) => setSev(e.target.value)}
            className={campo}
            aria-invalid={Boolean(erros.severidade)}
          >
            <option value="">Escolha</option>
            {Object.entries(SEVERIDADES).map(([k, n]) => (
              <option key={k} value={k}>
                {k} · {n}
              </option>
            ))}
          </Selecao>
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
            onChange={(e) => setProb(e.target.value)}
            className={campo}
            aria-invalid={Boolean(erros.probabilidade)}
          >
            <option value="">Escolha</option>
            {Object.entries(PROBABILIDADES).map(([k, n]) => (
              <option key={k} value={k}>
                {k} · {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-texto-2">
            Nível do risco
          </span>
          <span className="flex h-9 items-center text-base">
            {nivel ? (
              <NivelDoRisco nivel={nivel} />
            ) : (
              <span className="text-texto-3">
                Escolha severidade e probabilidade
              </span>
            )}
          </span>
        </div>
        <Campo
          id="controles"
          rotulo="Medidas de controle existentes"
          erro={erros.controles}
          className="sm:col-span-3"
        >
          <textarea
            id="controles"
            name="controles"
            rows={2}
            maxLength={1000}
            defaultValue={v.controles}
            className={areaDeTexto}
          />
        </Campo>
        <Campo
          id="acoes"
          rotulo={
            nivel === "alto" || nivel === "critico"
              ? "Medidas a implementar"
              : "Medidas a implementar (opcional)"
          }
          erro={erros.acoes}
          className="sm:col-span-3"
        >
          <textarea
            id="acoes"
            name="acoes"
            rows={2}
            maxLength={1000}
            defaultValue={v.acoes}
            className={areaDeTexto}
            aria-invalid={Boolean(erros.acoes)}
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
            list="pessoas"
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
          <Link href="/seguranca/pgr" className={botaoSecundario}>
            <ArrowLeft aria-hidden size={16} strokeWidth={2} />
            Voltar
          </Link>
        )}
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando
            ? "Salvando…"
            : risco
              ? "Salvar avaliação"
              : "Cadastrar risco"}
        </button>
      </div>
    </form>
  );
}
