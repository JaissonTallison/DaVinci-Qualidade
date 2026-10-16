"use client";

import { useActionState } from "react";
import type {
  Epi,
  OrdemDeServicoSst,
  Risco,
  Treinamento,
} from "@davinci/types";
import { Campo } from "@/components/campo";
import { Formulario } from "@/components/formulario-de-acao";
import { definirRiscosDaFuncao, salvarOrdemSst } from "@/lib/acoes-sst";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import {
  definirEpisDaFuncao,
  definirTreinamentosDaFuncao,
} from "@/lib/acoes-competencias";
import type { EstadoDaAcao } from "@/lib/acao";
import { areaDeTexto, botaoPrimario, campoCompacto } from "@/lib/estilos";

export function TreinamentosDaFuncao({
  funcaoId,
  catalogo,
  marcados,
}: {
  funcaoId: string;
  catalogo: Treinamento[];
  marcados: string[];
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    definirTreinamentosDaFuncao.bind(null, funcaoId),
    {},
  );
  if (catalogo.length === 0)
    return (
      <p className="mt-3 text-base text-texto-2">
        Nenhum treinamento no catálogo. Cadastre em Cadastros › Treinamentos.
      </p>
    );
  return (
    <form action={enviar} className="mt-3 flex flex-col gap-4">
      {estado.erro && <AvisoDeErro erro={estado.erro} />}
      <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {catalogo.map((t) => (
          <label
            key={t.id}
            className="inline-flex items-center gap-2 text-base"
          >
            <input
              type="checkbox"
              name="treinamentoIds"
              value={t.id}
              defaultChecked={marcados.includes(t.id)}
              className="size-4 accent-primaria"
            />
            {t.nome}
            {t.norma && <span className="text-sm text-texto-2">{t.norma}</span>}
          </label>
        ))}
      </div>
      <div>
        <button type="submit" className={botaoPrimario} disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar treinamentos exigidos"}
        </button>
      </div>
    </form>
  );
}

export function EpisDaFuncao({
  funcaoId,
  catalogo,
  riscos,
  marcados,
}: {
  funcaoId: string;
  catalogo: Epi[];
  riscos: Risco[];
  /** epiId → riscoId (ou "" sem risco). */
  marcados: Record<string, string>;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    definirEpisDaFuncao.bind(null, funcaoId),
    {},
  );
  if (catalogo.length === 0)
    return (
      <p className="mt-3 text-base text-texto-2">
        Nenhum EPI no catálogo. Cadastre em Segurança do Trabalho › Catálogo de
        EPIs.
      </p>
    );
  return (
    <form action={enviar} className="mt-3 flex flex-col gap-4">
      {estado.erro && <AvisoDeErro erro={estado.erro} />}
      <ul className="flex flex-col gap-2">
        {catalogo.map((e) => (
          <li
            key={e.id}
            className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center"
          >
            <label className="inline-flex items-center gap-2 text-base">
              <input
                type="checkbox"
                name="epiIds"
                value={e.id}
                defaultChecked={e.id in marcados}
                className="size-4 accent-primaria"
              />
              {e.nome}
              <span className="font-mono text-sm text-texto-2">CA {e.ca}</span>
            </label>
            <select
              name={`risco-${e.id}`}
              defaultValue={marcados[e.id] ?? ""}
              aria-label={`Risco do PGR que exige ${e.nome}`}
              className={`${campoCompacto} w-full`}
            >
              <option value="">Sem risco do PGR ligado</option>
              {riscos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.local}: {r.perigo}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
      <div>
        <button type="submit" className={botaoPrimario} disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar EPIs exigidos"}
        </button>
      </div>
    </form>
  );
}

type RiscoResumo = { id: string; perigo: string; local: string; nivel: string };

/** Riscos do PGR a que a função se expõe: base do S-2240 e da ordem de serviço. */
export function RiscosDaFuncao({
  funcaoId,
  riscos,
  marcados,
}: {
  funcaoId: string;
  riscos: RiscoResumo[];
  marcados: string[];
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    definirRiscosDaFuncao.bind(null, funcaoId),
    {},
  );
  if (riscos.length === 0)
    return (
      <p className="mt-3 text-base text-texto-2">Nenhum risco ativo no PGR.</p>
    );
  return (
    <form action={enviar} className="mt-3 flex flex-col gap-4">
      {estado.erro && <AvisoDeErro erro={estado.erro} />}
      <div className="flex flex-col gap-1.5">
        {riscos.map((r) => (
          <label
            key={r.id}
            className="inline-flex items-center gap-2 text-base"
          >
            <input
              type="checkbox"
              name="riscoIds"
              value={r.id}
              defaultChecked={marcados.includes(r.id)}
              className="size-4 accent-primaria"
            />
            {r.perigo}
            <span className="text-sm text-texto-2">· {r.local}</span>
          </label>
        ))}
      </div>
      <div>
        <button type="submit" className={botaoPrimario} disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar riscos da função"}
        </button>
      </div>
    </form>
  );
}

/** Ordem de serviço de segurança (NR-1, 1.4.1 c): o que a função faz, como fazer com segurança e o que é proibido. */
export function OrdemDeServicoDaFuncao({
  funcaoId,
  ordem,
}: {
  funcaoId: string;
  ordem: OrdemDeServicoSst | null;
}) {
  return (
    <Formulario
      acao={salvarOrdemSst.bind(null, funcaoId)}
      versao={ordem?.versao ?? ""}
      rotuloDoBotao="Salvar ordem de serviço"
    >
      {(erros, v) => (
        <>
          <Campo
            id="atividades"
            rotulo="Atividades da função"
            erro={erros.atividades}
            ajuda="Vai também para o S-2240 (descrição das atividades)."
          >
            <textarea
              id="atividades"
              name="atividades"
              rows={3}
              defaultValue={v.atividades ?? ordem?.atividades ?? ""}
              className={areaDeTexto}
            />
          </Campo>
          <Campo
            id="procedimentos"
            rotulo="Procedimentos seguros"
            erro={erros.procedimentos}
          >
            <textarea
              id="procedimentos"
              name="procedimentos"
              rows={4}
              defaultValue={v.procedimentos ?? ordem?.procedimentos ?? ""}
              className={areaDeTexto}
            />
          </Campo>
          <Campo id="proibicoes" rotulo="Proibições" erro={erros.proibicoes}>
            <textarea
              id="proibicoes"
              name="proibicoes"
              rows={3}
              defaultValue={v.proibicoes ?? ordem?.proibicoes ?? ""}
              className={areaDeTexto}
            />
          </Campo>
          <Campo
            id="emergencia"
            rotulo="Em caso de emergência"
            erro={erros.emergencia}
          >
            <textarea
              id="emergencia"
              name="emergencia"
              rows={2}
              defaultValue={v.emergencia ?? ordem?.emergencia ?? ""}
              className={areaDeTexto}
            />
          </Campo>
        </>
      )}
    </Formulario>
  );
}
