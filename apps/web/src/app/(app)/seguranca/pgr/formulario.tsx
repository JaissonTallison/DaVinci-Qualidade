"use client";

import { useActionState, useState } from "react";
import {
  GRUPOS_DE_RISCO,
  HIERARQUIAS_DE_CONTROLE,
  nivelDoRisco,
  PROBABILIDADES,
  SEVERIDADES,
  type Risco,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import { NivelDoRisco } from "@/components/marcadores";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { salvarRisco } from "@/lib/acoes-pgr-pt";
import { areaDeTexto, campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Botao } from "@/components/botao";

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
    hierarquiaControle: risco?.hierarquiaControle ?? "",
    responsavel: risco?.responsavel ?? "",
    prazo: risco?.prazo ?? "",
  };
  const [sev, setSev] = useState(v.severidade ?? "");
  const [prob, setProb] = useState(v.probabilidade ?? "");
  const nivel = sev && prob ? nivelDoRisco(Number(sev), Number(prob)) : null;
  return (
    <form action={acao} noValidate className={embutido ? "" : "mt-6"}>
      {risco && <input type="hidden" name="versao" value={risco.versao} />}
      <CadastroEmBlocos
        embutido={embutido}
        acoesEmbutido={
          <>
            <Botao type="submit" disabled={salvando} variante="primario">
              {salvando
                ? "Salvando…"
                : risco
                  ? "Salvar avaliação"
                  : "Cadastrar risco"}
            </Botao>
          </>
        }
        resumo={[
          { rotulo: "Grupo", campo: "grupo" },
          { rotulo: "Setor ou atividade", campo: "local" },
          { rotulo: "Responsável", campo: "responsavel" },
          { rotulo: "Prazo", campo: "prazo" },
        ]}
        acoes={
          <>
            <Botao href="/seguranca/pgr" tamanho="grande">
              Cancelar
            </Botao>
            <Botao
              type="submit"
              disabled={salvando}
              variante="primario"
              tamanho="grande"
            >
              {salvando
                ? "Salvando…"
                : risco
                  ? "Salvar avaliação"
                  : "Cadastrar risco"}
            </Botao>
          </>
        }
      >
        <Bloco
          id="perigo"
          titulo="Perigo"
          descricao="Grupo, onde ocorre, o perigo e os danos possíveis."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            {estado.erro && !estado.erro.detalhes?.length && (
              <div className="sm:col-span-3">
                <AvisoDeErro erro={estado.erro} />
              </div>
            )}
            <Campo id="grupo" rotulo="Grupo" erro={erros.grupo}>
              <Selecao
                id="grupo"
                required
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
                required
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
                required
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
                required
                name="danos"
                maxLength={300}
                defaultValue={v.danos}
                className={campo}
                aria-invalid={Boolean(erros.danos)}
              />
            </Campo>
          </div>
        </Bloco>
        <Bloco
          id="avaliacao"
          titulo="Avaliação"
          descricao="Severidade e probabilidade definem o nível do risco."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo id="severidade" rotulo="Severidade" erro={erros.severidade}>
              <Selecao
                id="severidade"
                required
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
                required
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
          </div>
        </Bloco>
        <Bloco
          id="controle"
          titulo="Controle"
          descricao="Medidas existentes, ações, hierarquia de controle, responsável e prazo."
        >
          <div className="grid gap-5 sm:grid-cols-3">
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
                required={nivel === "alto" || nivel === "critico"}
                name="acoes"
                rows={2}
                maxLength={1000}
                defaultValue={v.acoes}
                className={areaDeTexto}
                aria-invalid={Boolean(erros.acoes)}
              />
            </Campo>
            <Campo
              id="hierarquiaControle"
              rotulo="Hierarquia de controle"
              erro={erros.hierarquiaControle}
              ajuda="Priorize do topo para a base: eliminação antes de EPI (NR-1)."
              className="sm:col-span-3"
            >
              <Selecao
                id="hierarquiaControle"
                name="hierarquiaControle"
                defaultValue={v.hierarquiaControle}
                className={campo}
              >
                <option value="">Não definida</option>
                {Object.entries(HIERARQUIAS_DE_CONTROLE).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo
              id="responsavel"
              rotulo="Responsável"
              erro={erros.responsavel}
              className="sm:col-span-2"
            >
              <input
                id="responsavel"
                required={nivel === "alto" || nivel === "critico"}
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
                required={nivel === "alto" || nivel === "critico"}
                name="prazo"
                type="date"
                defaultValue={v.prazo}
                className={campo}
                aria-invalid={Boolean(erros.prazo)}
              />
            </Campo>
          </div>
        </Bloco>
      </CadastroEmBlocos>
    </form>
  );
}
