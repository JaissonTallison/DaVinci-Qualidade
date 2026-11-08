"use client";

import { useActionState } from "react";
import type { FuncionarioResumo, Treinamento } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { registrarTurma } from "@/lib/acoes-exames-e-treinamentos";
import { hojeEmBrasilia } from "@/lib/datas";
import { campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Botao } from "@/components/botao";

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
    <form action={acao} noValidate className="mt-6">
      <input type="hidden" name="voltar" value={voltar} />
      <CadastroEmBlocos
        resumo={[
          { rotulo: "Treinamento", campo: "treinamentoId" },
          { rotulo: "Data", campo: "data" },
          { rotulo: "Instrutor", campo: "instrutor" },
        ]}
        acoes={
          <>
            <Botao href="/cadastros/treinamentos" tamanho="grande">
              Cancelar
            </Botao>
            <Botao
              type="submit"
              carregando={salvando}
              textoCarregando="Salvando…"
              variante="primario"
              tamanho="grande"
            >
              Registrar turma
            </Botao>
          </>
        }
      >
        <Bloco
          id="turma"
          titulo="Turma"
          descricao="Treinamento, data e instrutor."
        >
          <div className="grid gap-5 sm:grid-cols-3">
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
                required
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
                required
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
          </div>
        </Bloco>
        <Bloco
          id="participantes"
          titulo="Participantes"
          descricao="Quem participou da turma."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <fieldset className="sm:col-span-3">
              <legend className="sr-only">Participantes</legend>
              {erros.funcionarioIds && (
                <p className="mt-1 text-sm text-nao-conforme">
                  {erros.funcionarioIds}
                </p>
              )}
              <ul className="grid max-h-96 gap-1.5 overflow-y-auto rounded-sm border border-borda p-3 sm:grid-cols-2">
                {funcionarios.map((f) => (
                  <li key={f.id}>
                    <label className="flex items-start gap-2 text-base">
                      <input
                        key={`${f.id}-${escolhidos.has(f.id)}`}
                        type="checkbox"
                        name="funcionarioIds"
                        required
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
        </Bloco>
      </CadastroEmBlocos>
    </form>
  );
}
