"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import type { FuncionarioResumo, Treinamento } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { registrarTurma } from "@/lib/acoes-exames-e-treinamentos";
import { hojeEmBrasilia } from "@/lib/datas";
import { botaoPrimario, botaoSecundario, campo, painel } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

export function FormularioDeTurma({
  treinamentos,
  funcionarios,
  marcados,
  voltar,
}: {
  treinamentos: Treinamento[];
  funcionarios: FuncionarioResumo[];
  marcados: string[];
  voltar: string;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    registrarTurma,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  const escolhidos = new Set(
    v.funcionarioIds !== undefined ? v.funcionarioIds.split(",") : marcados,
  );
  return (
    <form action={acao} noValidate className={`${painel} mt-6 max-w-4xl`}>
      <input type="hidden" name="voltar" value={voltar} />
      <div className="grid gap-5 p-5 sm:grid-cols-3">
        {estado.erro && !estado.erro.detalhes?.length && (
          <div className="sm:col-span-3">
            <AvisoDeErro erro={estado.erro} />
          </div>
        )}
        <Campo
          id="treinamentoId"
          rotulo="Treinamento"
          erro={erros.treinamentoId}
          className="sm:col-span-3"
        >
          <Selecao
            id="treinamentoId"
            name="treinamentoId"
            defaultValue={v.treinamentoId ?? ""}
            className={campo}
            aria-invalid={Boolean(erros.treinamentoId)}
          >
            <option value="">Escolha</option>
            {treinamentos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
                {t.norma ? ` (${t.norma})` : ""} · {t.cargaHoraria} h
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo id="data" rotulo="Data" erro={erros.data}>
          <input
            id="data"
            name="data"
            type="date"
            max={hojeEmBrasilia()}
            defaultValue={v.data ?? hojeEmBrasilia()}
            className={campo}
            aria-invalid={Boolean(erros.data)}
          />
        </Campo>
        <Campo
          id="instrutor"
          rotulo="Instrutor (opcional)"
          erro={erros.instrutor}
          className="sm:col-span-2"
        >
          <input
            id="instrutor"
            name="instrutor"
            maxLength={120}
            defaultValue={v.instrutor}
            className={campo}
          />
        </Campo>
        <fieldset className="sm:col-span-3">
          <legend className="text-sm font-semibold text-texto-2">
            Participantes
          </legend>
          {erros.funcionarioIds && (
            <p className="mt-1 text-sm text-nao-conforme">
              {erros.funcionarioIds}
            </p>
          )}
          <ul className="mt-2 grid max-h-96 gap-1.5 overflow-y-auto rounded-sm border border-borda p-3 sm:grid-cols-2">
            {funcionarios.map((f) => (
              <li key={f.id}>
                <label className="flex items-start gap-2 text-base">
                  <input
                    key={`${f.id}-${escolhidos.has(f.id)}`}
                    type="checkbox"
                    name="funcionarioIds"
                    value={f.id}
                    defaultChecked={escolhidos.has(f.id)}
                    className="mt-1"
                  />
                  <span>
                    {f.nome}
                    <span className="block text-xs text-texto-3">
                      {f.matricula} · {f.funcaoNome}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </div>
      <div className="flex justify-end gap-3 border-t border-borda px-5 py-3">
        <Link href={voltar} className={botaoSecundario}>
          <ArrowLeft aria-hidden size={16} strokeWidth={2} />
          Voltar
        </Link>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : "Registrar turma"}
        </button>
      </div>
    </form>
  );
}
