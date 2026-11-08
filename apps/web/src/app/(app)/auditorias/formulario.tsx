"use client";

import { useActionState, type ReactNode } from "react";
import {
  NORMAS,
  NORMAS_EM_TRANSICAO,
  NORMAS_VIGENTES,
  TIPOS_AUDITORIA,
  type Auditoria,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import { Selecao } from "@/components/selecao";
import { salvarAuditoria, type EstadoDaAcao } from "@/lib/acoes-auditorias";
import { areaDeTexto, campo, painel } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { TabelaPorSetor } from "./tabela-por-setor";
import { Botao } from "@/components/botao";

/** Agrupa campos relacionados sob um subtítulo sóbrio, para o planejamento ler como etapas. */
/** id do bloco a partir do título, para o atalho da coluna de resumo. */
const idDoBloco = (titulo: string) =>
  titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Um bloco do cadastro (interface.md §7.2): os campos empilhados dentro do painel da seção. */
function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Bloco id={idDoBloco(titulo)} titulo={titulo}>
      <div className="flex flex-col gap-5">{children}</div>
    </Bloco>
  );
}

/** Planejar (sem `auditoria`) ou alterar o planejamento. */
export function FormularioDeAuditoria({
  auditoria,
  hoje,
  embutido = false,
  programacao,
}: {
  auditoria?: Auditoria;
  hoje: string;
  embutido?: boolean;
  /** Itens da programação do ano, para vincular a auditoria (opcional). */
  programacao?: { id: string; setor: string }[];
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
  const linhasPorSetor = estado.linhas ?? auditoria?.registroPorSetor ?? [];
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;
  return (
    <form action={acao} noValidate className={embutido ? "" : "mt-6"}>
      {auditoria && (
        <input type="hidden" name="versao" value={auditoria.versao} />
      )}
      <CadastroEmBlocos
        embutido={embutido}
        acoesEmbutido={
          <Botao type="submit" disabled={salvando} variante="primario">
            {salvando
              ? "Salvando…"
              : auditoria
                ? "Salvar planejamento"
                : "Planejar auditoria"}
          </Botao>
        }
        resumo={[
          { rotulo: "Tipo", campo: "tipo" },
          { rotulo: "Início", campo: "dataInicio" },
          { rotulo: "Fim", campo: "dataFim" },
          { rotulo: "Auditor líder", campo: "auditorLider" },
        ]}
        acoes={
          <>
            <Botao href="/auditorias" tamanho="grande">
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
                : auditoria
                  ? "Salvar planejamento"
                  : "Planejar auditoria"}
            </Botao>
          </>
        }
      >
        {erroGeral && <AvisoDeErro erro={erroGeral} />}

        <Secao titulo="A auditoria">
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo id="tipo" rotulo="Tipo *" erro={erros.tipo}>
              <Selecao
                id="tipo"
                required
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
            <Campo id="dataInicio" rotulo="Início *" erro={erros.dataInicio}>
              <input
                id="dataInicio"
                required
                name="dataInicio"
                type="date"
                defaultValue={v.dataInicio ?? hoje}
                className={campo}
                aria-invalid={Boolean(erros.dataInicio)}
              />
            </Campo>
            <Campo id="dataFim" rotulo="Fim *" erro={erros.dataFim}>
              <input
                id="dataFim"
                required
                name="dataFim"
                type="date"
                defaultValue={v.dataFim ?? hoje}
                className={campo}
                aria-invalid={Boolean(erros.dataFim)}
              />
            </Campo>
          </div>
        </Secao>

        <Secao titulo="Escopo e normas">
          <Campo
            id="escopo"
            rotulo="Escopo *"
            erro={erros.escopo}
            ajuda="O que será auditado: processos, unidade, turnos. Ex.: produção e expedição da unidade Sorocaba."
          >
            <textarea
              id="escopo"
              required
              name="escopo"
              rows={2}
              defaultValue={v.escopo}
              className={areaDeTexto}
              aria-invalid={Boolean(erros.escopo)}
            />
          </Campo>
          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-base font-medium text-texto">
              Normas auditadas *
            </legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-base">
              {[
                ...NORMAS_VIGENTES,
                ...NORMAS_EM_TRANSICAO.filter((n) =>
                  normas.includes(n as never),
                ),
              ].map((chave) => (
                <label key={chave} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="normas"
                    value={chave}
                    defaultChecked={normas.includes(chave as never)}
                    className="size-4 rounded-xs"
                  />{" "}
                  {NORMAS[chave]}
                </label>
              ))}
            </div>
            {erros.normas ? (
              <p className="text-sm text-nao-conforme">{erros.normas}</p>
            ) : (
              <p className="text-sm text-texto-3">
                Uma edição por norma, sempre a mais recente.
              </p>
            )}
          </fieldset>
        </Secao>

        <Secao titulo="Equipe e áreas">
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo
              id="auditorLider"
              rotulo="Auditor líder *"
              erro={erros.auditorLider}
            >
              <input
                id="auditorLider"
                required
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
        </Secao>

        {programacao && programacao.length > 0 ? (
          <Secao titulo="Vínculo com a programação">
            <Campo
              id="programacaoId"
              rotulo="Item da programação (opcional)"
              erro={erros.programacaoId}
              ajuda="Vincule esta auditoria a um item do plano anual."
              className="sm:w-1/2"
            >
              <Selecao
                id="programacaoId"
                name="programacaoId"
                defaultValue={v.programacaoId ?? ""}
                className={campo}
              >
                <option value="">— Sem vínculo —</option>
                {programacao.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.setor}
                  </option>
                ))}
              </Selecao>
            </Campo>
          </Secao>
        ) : (
          v.programacaoId && (
            <input type="hidden" name="programacaoId" value={v.programacaoId} />
          )
        )}

        <Secao titulo="Registro por setor (opcional)">
          <p className="-mt-1 text-sm text-texto-3">
            Anotações rápidas por setor auditado: comentários, pontos positivos,
            observações e eventuais não conformidades (texto livre). Não
            substitui as constatações formais registradas na execução.
          </p>
          <TabelaPorSetor valores={linhasPorSetor} erros={erros} />
        </Secao>
      </CadastroEmBlocos>
    </form>
  );
}
