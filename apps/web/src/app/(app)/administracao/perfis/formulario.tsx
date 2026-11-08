"use client";

import { useActionState } from "react";
import { GRUPOS_DE_PERMISSOES, PERMISSOES, type Perfil } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import type { EstadoDaAcao } from "@/lib/acao";
import { salvarPerfil } from "@/lib/acoes-administracao";
import { campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Botao } from "@/components/botao";

/** Nome, descrição e as permissões agrupadas por módulo. */
export function FormularioDePerfil({ perfil }: { perfil?: Perfil }) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarPerfil.bind(null, perfil?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores;
  const marcadas = new Set<string>(
    v ? (v.permissoes ?? "").split(",") : (perfil?.permissoes ?? []),
  );
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;
  return (
    <form action={acao} noValidate className="mt-6">
      {perfil && <input type="hidden" name="versao" value={perfil.versao} />}
      {erroGeral && (
        <div className="mb-5">
          <AvisoDeErro erro={erroGeral} />
        </div>
      )}
      <CadastroEmBlocos
        resumo={[{ rotulo: "Perfil", campo: "nome" }]}
        acoes={
          <>
            <Botao href="/administracao/perfis" tamanho="grande">
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
                : perfil
                  ? "Salvar perfil"
                  : "Criar perfil"}
            </Botao>
          </>
        }
      >
        <Bloco
          id="perfil"
          titulo="Perfil"
          descricao="Nome e para quem é o perfil."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo id="nome" rotulo="Nome do perfil" erro={erros.nome}>
              <input
                id="nome"
                required
                name="nome"
                maxLength={60}
                defaultValue={v?.nome ?? perfil?.nome}
                className={campo}
                aria-invalid={Boolean(erros.nome)}
              />
            </Campo>
            <Campo
              id="descricao"
              rotulo="Descrição (opcional)"
              erro={erros.descricao}
              className="sm:col-span-2"
            >
              <input
                id="descricao"
                name="descricao"
                maxLength={200}
                defaultValue={v?.descricao ?? perfil?.descricao ?? ""}
                className={campo}
              />
            </Campo>
          </div>
        </Bloco>
        <Bloco
          id="permissoes"
          titulo="Permissões"
          descricao="O que quem tem este perfil pode ver e fazer. Marque ao menos uma."
        >
          <fieldset>
            <legend className="sr-only">Permissões</legend>
            {erros.permissoes && (
              <p className="mb-3 text-sm text-nao-conforme">
                {erros.permissoes}
              </p>
            )}
            <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
              {GRUPOS_DE_PERMISSOES.map((g) => (
                <div key={g.titulo}>
                  <p className="text-base font-semibold text-texto">
                    {g.titulo}
                  </p>
                  <ul className="mt-1.5 flex flex-col gap-1.5">
                    {g.permissoes.map((p) => (
                      <li key={p}>
                        <label className="flex items-start gap-2 text-base text-texto">
                          <input
                            key={`${p}-${marcadas.has(p)}`}
                            type="checkbox"
                            name="permissoes"
                            required
                            value={p}
                            defaultChecked={marcadas.has(p)}
                            className="mt-1"
                          />
                          {PERMISSOES[p]}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </fieldset>
        </Bloco>
      </CadastroEmBlocos>
    </form>
  );
}
