"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { NORMAS, TIPOS_AUDITORIA, type Auditoria } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import { salvarAuditoria, type EstadoDaAcao } from "@/lib/acoes-auditorias";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
  painel,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

/** Planejar (sem `auditoria`) ou alterar o planejamento. */
export function FormularioDeAuditoria({
  auditoria,
  hoje,
  embutido = false,
}: {
  auditoria?: Auditoria;
  hoje: string;
  embutido?: boolean;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarAuditoria.bind(null, auditoria?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> =
    estado.valores ??
    (auditoria
      ? Object.fromEntries(
          Object.entries(auditoria).map(([k, x]) => [
            k,
            typeof x === "string" ? x : "",
          ]),
        )
      : {});
  const normas = estado.normas ?? auditoria?.normas ?? [];
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;
  return (
    <form
      action={acao}
      noValidate
      className={embutido ? "" : `${painel} mt-6`}
    >
      {auditoria && (
        <input type="hidden" name="versao" value={auditoria.versao} />
      )}
      <div className={`flex flex-col gap-5 ${embutido ? "" : "p-5"}`}>
        {erroGeral && <AvisoDeErro erro={erroGeral} />}
        <div className="grid gap-5 sm:grid-cols-3">
          <Campo id="tipo" rotulo="Tipo" erro={erros.tipo}>
            <Selecao
              id="tipo"
              name="tipo"
              defaultValue={v.tipo ?? ""}
              className={campo}
              aria-invalid={Boolean(erros.tipo)}
            >
              <option value="" disabled>
                Escolha
              </option>
              {Object.entries(TIPOS_AUDITORIA).map(([chave, nome]) => (
                <option key={chave} value={chave}>
                  {nome}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo id="dataInicio" rotulo="Início" erro={erros.dataInicio}>
            <input
              id="dataInicio"
              name="dataInicio"
              type="date"
              defaultValue={v.dataInicio ?? hoje}
              className={campo}
              aria-invalid={Boolean(erros.dataInicio)}
            />
          </Campo>
          <Campo id="dataFim" rotulo="Fim" erro={erros.dataFim}>
            <input
              id="dataFim"
              name="dataFim"
              type="date"
              defaultValue={v.dataFim ?? hoje}
              className={campo}
              aria-invalid={Boolean(erros.dataFim)}
            />
          </Campo>
        </div>
        <Campo
          id="escopo"
          rotulo="Escopo"
          erro={erros.escopo}
          ajuda="O que será auditado: processos, unidade, turnos. Ex.: produção e expedição da unidade Sorocaba."
        >
          <textarea
            id="escopo"
            name="escopo"
            rows={2}
            defaultValue={v.escopo}
            className={areaDeTexto}
            aria-invalid={Boolean(erros.escopo)}
          />
        </Campo>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-semibold text-texto-2">
            Normas auditadas
          </legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-base">
            {Object.entries(NORMAS).map(([chave, nome]) => (
              <label key={chave} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="normas"
                  value={chave}
                  defaultChecked={normas.includes(chave as never)}
                  className="size-4 rounded-xs"
                />{" "}
                {nome}
              </label>
            ))}
          </div>
          {erros.normas ? (
            <p className="text-sm text-nao-conforme">{erros.normas}</p>
          ) : (
            <p className="text-sm text-texto-3">
              Uma edição por norma. As de 2026 são as vigentes; a ISO 9001:2015
              e a ISO 14001:2015 ficam em transição até 2029.
            </p>
          )}
        </fieldset>
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo
            id="auditorLider"
            rotulo="Auditor líder"
            erro={erros.auditorLider}
          >
            <input
              id="auditorLider"
              name="auditorLider"
              list="pessoas"
              defaultValue={v.auditorLider}
              maxLength={120}
              className={campo}
              aria-invalid={Boolean(erros.auditorLider)}
            />
          </Campo>
          <Campo id="equipe" rotulo="Equipe auditora" erro={erros.equipe}>
            <input
              id="equipe"
              name="equipe"
              defaultValue={v.equipe}
              maxLength={300}
              className={campo}
            />
          </Campo>
          <Campo id="areas" rotulo="Áreas ou processos" erro={erros.areas}>
            <input
              id="areas"
              name="areas"
              defaultValue={v.areas}
              maxLength={300}
              className={campo}
            />
          </Campo>
          <Campo
            id="representante"
            rotulo="Representante da área auditada"
            erro={erros.representante}
            ajuda="Sugerido como responsável das NCs formalizadas."
          >
            <input
              id="representante"
              name="representante"
              list="pessoas"
              defaultValue={v.representante}
              maxLength={120}
              className={campo}
            />
          </Campo>
        </div>
      </div>
      <div
        className={`flex justify-end gap-3 ${embutido ? "mt-5" : "border-t border-borda px-5 py-3"}`}
      >
        {!embutido && (
          <Link href="/auditorias" className={botaoSecundario}>
            <ArrowLeft aria-hidden size={16} strokeWidth={2} />
            Voltar
          </Link>
        )}
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando
            ? "Salvando…"
            : auditoria
              ? "Salvar planejamento"
              : "Planejar auditoria"}
        </button>
      </div>
    </form>
  );
}
