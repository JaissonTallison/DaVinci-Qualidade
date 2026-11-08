"use client";

import { useActionState } from "react";
import {
  FREQUENCIAS_DE_AUDITORIA,
  MESES_ABREVIADOS,
  NORMAS,
  NORMAS_VIGENTES,
  type ItemDaProgramacao,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import { Selecao } from "@/components/selecao";
import {
  salvarItemProgramacao,
  type EstadoDaAcao,
} from "@/lib/acoes-programacao";
import { areaDeTexto, campo, erroDoCampo, rotulo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Botao } from "@/components/botao";

/** Criar (sem `item`) ou editar um item da programação anual de auditorias. */
export function FormularioDaProgramacao({
  item,
  ano,
}: {
  item?: ItemDaProgramacao;
  /** Ano padrão ao criar. */
  ano: number;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarItemProgramacao.bind(null, item?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  const normasMarcadas = estado.normas ?? item?.normas ?? ([] as string[]);
  const mesesMarcados =
    estado.meses ?? item?.meses.map(String) ?? ([] as string[]);
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;
  const invalido = (nome: string) => ({ "aria-invalid": Boolean(erros[nome]) });

  return (
    <form action={acao} noValidate className="mt-6">
      {item && <input type="hidden" name="versao" value={item.versao} />}
      {erroGeral && (
        <div className="mb-5">
          <AvisoDeErro erro={erroGeral} />
        </div>
      )}
      <CadastroEmBlocos
        resumo={[
          { rotulo: "Ano", campo: "ano" },
          { rotulo: "Setor ou processo", campo: "setor" },
          { rotulo: "Frequência", campo: "frequencia" },
          { rotulo: "Responsável", campo: "responsavel" },
        ]}
        acoes={
          <>
            <Botao href="/auditorias/programacao" tamanho="grande">
              Cancelar
            </Botao>
            <Botao
              type="submit"
              disabled={salvando}
              variante="primario"
              tamanho="grande"
            >
              {salvando ? "Salvando…" : item ? "Salvar item" : "Adicionar item"}
            </Botao>
          </>
        }
      >
        <Bloco
          id="escopo"
          titulo="Escopo"
          descricao="Ano, o setor ou processo auditado e as normas."
        >
          <div className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-4">
              <Campo id="ano" rotulo="Ano *" erro={erros.ano}>
                <input
                  id="ano"
                  required
                  name="ano"
                  inputMode="numeric"
                  defaultValue={v.ano ?? String(item?.ano ?? ano)}
                  className={campo}
                  {...invalido("ano")}
                />
              </Campo>
              <Campo
                id="setor"
                rotulo="Setor ou processo *"
                erro={erros.setor}
                className="sm:col-span-3"
              >
                <input
                  id="setor"
                  required
                  name="setor"
                  defaultValue={v.setor ?? item?.setor}
                  maxLength={150}
                  className={campo}
                  {...invalido("setor")}
                />
              </Campo>
            </div>
            <fieldset className="flex flex-col gap-1.5">
              <legend className={rotulo}>Normas *</legend>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {NORMAS_VIGENTES.map((chave) => (
                  <label
                    key={chave}
                    className="flex items-center gap-2 text-base"
                  >
                    <input
                      type="checkbox"
                      name="normas"
                      required
                      value={chave}
                      defaultChecked={normasMarcadas.includes(chave)}
                      className="size-4 rounded-xs"
                    />
                    {NORMAS[chave]}
                  </label>
                ))}
              </div>
              {erros.normas && <p className={erroDoCampo}>{erros.normas}</p>}
            </fieldset>
          </div>
        </Bloco>
        <Bloco
          id="planejamento"
          titulo="Planejamento"
          descricao="Com que frequência, quem conduz e em quais meses."
        >
          <div className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Campo
                id="frequencia"
                rotulo="Frequência *"
                erro={erros.frequencia}
              >
                <Selecao
                  id="frequencia"
                  required
                  name="frequencia"
                  defaultValue={v.frequencia ?? item?.frequencia ?? ""}
                  className={campo}
                  {...invalido("frequencia")}
                >
                  <option value="" disabled>
                    Escolha
                  </option>
                  {Object.entries(FREQUENCIAS_DE_AUDITORIA).map(
                    ([chave, nome]) => (
                      <option key={chave} value={chave}>
                        {nome}
                      </option>
                    ),
                  )}
                </Selecao>
              </Campo>
              <Campo
                id="responsavel"
                rotulo="Responsável *"
                erro={erros.responsavel}
              >
                <input
                  id="responsavel"
                  required
                  name="responsavel"
                  list="pessoas"
                  defaultValue={v.responsavel ?? item?.responsavel}
                  maxLength={120}
                  className={campo}
                  {...invalido("responsavel")}
                />
              </Campo>
            </div>
            <fieldset className="flex flex-col gap-1.5">
              <legend className={rotulo}>Meses planejados *</legend>
              <div className="flex flex-wrap gap-2">
                {MESES_ABREVIADOS.map((nome, idx) => {
                  const mes = String(idx + 1);
                  return (
                    <label
                      key={mes}
                      className="flex cursor-pointer items-center gap-1.5 rounded-sm border border-borda-campo px-2.5 py-1.5 text-sm select-none has-[:checked]:border-acao has-[:checked]:bg-info-suave"
                    >
                      <input
                        type="checkbox"
                        name="meses"
                        required
                        value={mes}
                        defaultChecked={mesesMarcados.includes(mes)}
                        className="size-4 rounded-xs"
                      />
                      {nome}
                    </label>
                  );
                })}
              </div>
              {erros.meses && <p className={erroDoCampo}>{erros.meses}</p>}
            </fieldset>
            <Campo
              id="observacoes"
              rotulo="Observações"
              erro={erros.observacoes}
              ajuda="Opcional. Ex.: auditoria combinada com a de fornecedor."
            >
              <textarea
                id="observacoes"
                name="observacoes"
                rows={2}
                defaultValue={v.observacoes ?? item?.observacoes ?? ""}
                className={areaDeTexto}
              />
            </Campo>
          </div>
        </Bloco>
      </CadastroEmBlocos>
    </form>
  );
}
