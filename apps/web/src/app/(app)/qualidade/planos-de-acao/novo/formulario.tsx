"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import {
  MAXIMO_DE_TAREFAS,
  ORIGENS_PLANO,
  TIPOS_PLANO,
  type OrigemPlano,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import { LinhasDeTarefa } from "@/components/linhas-de-tarefa";
import { Selecao } from "@/components/selecao";
import { criarPlano, type EstadoDaAcao } from "@/lib/acoes-planos";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
  painel,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { ORIGEM_PLANO_VINCULAVEL } from "@/lib/origem-plano";

export interface Inicial {
  valores: Record<string, string>;
  tarefas?: Record<string, string>[];
}

/** Um bloco do cadastro (interface.md §7.2): os campos empilhados dentro do painel da seção. */
function Secao({
  id,
  titulo,
  descricao,
  children,
}: {
  id: string;
  titulo: string;
  descricao?: string;
  children: ReactNode;
}) {
  return (
    <Bloco id={id} titulo={titulo} descricao={descricao}>
      <div className="flex flex-col gap-5">{children}</div>
    </Bloco>
  );
}

export function FormularioNovoPlano({
  hoje,
  inicial,
  registrosPorOrigem,
}: {
  hoje: string;
  inicial?: Inicial;
  /** Registros de cada origem vinculável, para o autocomplete do "Registro de origem". */
  registrosPorOrigem: Partial<
    Record<OrigemPlano, { numero: string; desc: string }[]>
  >;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    criarPlano,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? inicial?.valores ?? {};
  const [origem, setOrigem] = useState(v.origem ?? "");
  const semOrigem = !origem;
  const vinc = ORIGEM_PLANO_VINCULAVEL[origem as OrigemPlano];
  const registros = registrosPorOrigem[origem as OrigemPlano] ?? [];
  const [linhas, setLinhas] = useState(
    Math.max(estado.tarefas?.length ?? 0, inicial?.tarefas?.length ?? 0, 2),
  );
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;
  const invalido = (nome: string) => ({ "aria-invalid": Boolean(erros[nome]) });

  return (
    <form action={acao} noValidate className="mt-6">
      {v.ncId && <input type="hidden" name="ncId" value={v.ncId} />}
      {erroGeral && (
        <div className="mb-5">
          <AvisoDeErro erro={erroGeral} />
        </div>
      )}
      <CadastroEmBlocos
        resumo={[
          { rotulo: "Tipo", campo: "tipo" },
          { rotulo: "Origem", campo: "origem" },
          { rotulo: "Responsável", campo: "responsavel" },
        ]}
        acoes={
          <>
            <Link href="/qualidade/planos-de-acao" className={botaoSecundario}>
              Cancelar
            </Link>
            <button type="submit" className={botaoPrimario} disabled={salvando}>
              {salvando ? "Criando…" : "Criar plano"}
            </button>
          </>
        }
      >
        <Secao
          id="plano"
          titulo="O plano"
          descricao="O que o plano resolve e qual resultado se espera."
        >
          <Campo
            id="titulo"
            rotulo="Título *"
            erro={erros.titulo}
            ajuda="Uma frase que identifique o plano na lista."
          >
            <input
              id="titulo"
              required
              name="titulo"
              defaultValue={v.titulo}
              maxLength={150}
              className={campo}
              {...invalido("titulo")}
            />
          </Campo>
          <Campo
            id="objetivo"
            rotulo="Objetivo *"
            erro={erros.objetivo}
            ajuda="O resultado que mostra que o plano funcionou. Ex.: nenhuma etiqueta ilegível por 60 dias."
          >
            <textarea
              id="objetivo"
              required
              name="objetivo"
              rows={2}
              defaultValue={v.objetivo}
              className={areaDeTexto}
              {...invalido("objetivo")}
            />
          </Campo>
        </Secao>

        <Secao
          id="classificacao"
          titulo="Classificação e vínculo"
          descricao="Tipo de ação, de onde vem, quem responde e o custo previsto."
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Campo id="tipo" rotulo="Tipo *" erro={erros.tipo}>
              <Opcoes id="tipo" opcoes={TIPOS_PLANO} valor={v.tipo} />
            </Campo>
            <Campo id="origem" rotulo="Origem *" erro={erros.origem}>
              <Opcoes
                id="origem"
                opcoes={ORIGENS_PLANO}
                valor={v.origem}
                onChange={(e) => setOrigem(e.target.value)}
              />
            </Campo>
            <Campo
              id="origemRef"
              rotulo={`${vinc ? vinc.rotuloCampo : "Registro de origem"} (opcional)`}
              erro={erros.origemRef}
              ajuda={
                semOrigem
                  ? "Escolha a origem primeiro."
                  : vinc
                    ? registros.length > 0
                      ? "Selecione ou digite o número."
                      : "Digite o número do registro."
                    : "Número ou código do registro."
              }
            >
              <input
                id="origemRef"
                name="origemRef"
                defaultValue={v.origemRef}
                maxLength={60}
                disabled={semOrigem}
                placeholder={
                  semOrigem ? "Escolha a origem primeiro" : undefined
                }
                className={`${campo} font-mono disabled:cursor-not-allowed disabled:opacity-60`}
                list={
                  vinc && registros.length > 0 ? "registros-origem" : undefined
                }
                autoComplete="off"
              />
              {vinc && registros.length > 0 && (
                <datalist id="registros-origem">
                  {registros.map((rg) => (
                    <option key={rg.numero} value={rg.numero} label={rg.desc} />
                  ))}
                </datalist>
              )}
            </Campo>
            <Campo
              id="responsavel"
              rotulo="Responsável pelo plano *"
              erro={erros.responsavel}
            >
              <input
                id="responsavel"
                required
                name="responsavel"
                list="pessoas"
                defaultValue={v.responsavel}
                maxLength={120}
                className={campo}
                {...invalido("responsavel")}
              />
            </Campo>
          </div>
          <Campo
            id="custoPrevisto"
            rotulo="Custo previsto (R$) (opcional)"
            erro={erros.custoPrevisto}
            className="sm:w-1/3"
          >
            <input
              id="custoPrevisto"
              name="custoPrevisto"
              inputMode="decimal"
              placeholder="0,00"
              defaultValue={v.custoPrevisto}
              className={campo}
              {...invalido("custoPrevisto")}
            />
          </Campo>
        </Secao>

        <Secao
          id="tarefas"
          titulo="Tarefas"
          descricao="“O que fazer”, “Quem” e “Até quando” são obrigatórios em cada tarefa; “Onde” e “Como” (5W2H) são opcionais. Inclua ao menos uma tarefa."
        >
          <div>
            {erros.tarefas && (
              <p className="mb-3 text-sm text-nao-conforme">{erros.tarefas}</p>
            )}
            <LinhasDeTarefa
              quantidade={linhas}
              hoje={hoje}
              valores={estado.tarefas ?? inicial?.tarefas}
              erros={erros}
            />
            {linhas < MAXIMO_DE_TAREFAS && (
              <button
                type="button"
                onClick={() => setLinhas((n) => n + 1)}
                className={`${botaoSecundario} mt-3`}
              >
                Incluir tarefa
              </button>
            )}
          </div>
          <p className="text-sm text-texto-2">
            Ao criar, o plano entra em execução e o acompanhamento das tarefas
            começa.
          </p>
        </Secao>
      </CadastroEmBlocos>
    </form>
  );
}

/** Lista de escolha obrigatória (tipo e origem do plano). */
function Opcoes({
  id,
  opcoes,
  valor,
  onChange,
}: {
  id: string;
  opcoes: Record<string, string>;
  valor?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
}) {
  return (
    <Selecao
      id={id}
      name={id}
      required
      defaultValue={valor ?? ""}
      className={campo}
      onChange={onChange}
    >
      <option value="" disabled>
        Escolha
      </option>
      {Object.entries(opcoes).map(([chave, nome]) => (
        <option key={chave} value={chave}>
          {nome}
        </option>
      ))}
    </Selecao>
  );
}
