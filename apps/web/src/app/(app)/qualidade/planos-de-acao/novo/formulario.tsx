"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { MAXIMO_DE_TAREFAS, ORIGENS_PLANO, TIPOS_PLANO } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { LinhasDeTarefa } from "@/components/linhas-de-tarefa";
import { Selecao } from "@/components/selecao";
import { criarPlano, type EstadoDaAcao } from "@/lib/acoes-planos";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
  painel,
  tituloDaSecao,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

export interface Inicial {
  valores: Record<string, string>;
  tarefas?: Record<string, string>[];
}

export function FormularioNovoPlano({
  hoje,
  inicial,
}: {
  hoje: string;
  inicial?: Inicial;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    criarPlano,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? inicial?.valores ?? {};
  const [linhas, setLinhas] = useState(
    Math.max(estado.tarefas?.length ?? 0, inicial?.tarefas?.length ?? 0, 2),
  );
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;
  const invalido = (nome: string) => ({ "aria-invalid": Boolean(erros[nome]) });

  return (
    <form action={acao} noValidate className={`${painel} mt-6 max-w-5xl`}>
      <div className="flex flex-col gap-5 p-5">
        {erroGeral && <AvisoDeErro erro={erroGeral} />}
        {v.ncId && <input type="hidden" name="ncId" value={v.ncId} />}
        <Campo id="titulo" rotulo="Título" erro={erros.titulo}>
          <input
            id="titulo"
            name="titulo"
            defaultValue={v.titulo}
            maxLength={150}
            className={campo}
            {...invalido("titulo")}
          />
        </Campo>
        <Campo
          id="objetivo"
          rotulo="Objetivo"
          erro={erros.objetivo}
          ajuda="O resultado que mostra que o plano funcionou. Ex.: nenhuma etiqueta ilegível por 60 dias."
        >
          <textarea
            id="objetivo"
            name="objetivo"
            rows={2}
            defaultValue={v.objetivo}
            className={areaDeTexto}
            {...invalido("objetivo")}
          />
        </Campo>
        <div className="grid gap-5 sm:grid-cols-4">
          <Campo id="tipo" rotulo="Tipo" erro={erros.tipo}>
            <Opcoes id="tipo" opcoes={TIPOS_PLANO} valor={v.tipo} />
          </Campo>
          <Campo id="origem" rotulo="Origem" erro={erros.origem}>
            <Opcoes id="origem" opcoes={ORIGENS_PLANO} valor={v.origem} />
          </Campo>
          <Campo
            id="origemRef"
            rotulo="Registro de origem"
            erro={erros.origemRef}
          >
            <input
              id="origemRef"
              name="origemRef"
              defaultValue={v.origemRef}
              maxLength={60}
              className={`${campo} font-mono`}
            />
          </Campo>
          <Campo
            id="responsavel"
            rotulo="Responsável pelo plano"
            erro={erros.responsavel}
          >
            <input
              id="responsavel"
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
          rotulo="Custo previsto (R$)"
          erro={erros.custoPrevisto}
          className="sm:w-1/4"
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
      </div>

      <div className="border-t border-borda p-5">
        <h2 className={tituloDaSecao}>Tarefas</h2>
        {erros.tarefas && (
          <p className="mt-1 text-sm text-nao-conforme">{erros.tarefas}</p>
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

      <div className="flex justify-end gap-3 border-t border-borda px-5 py-3">
        <Link href="/qualidade/planos-de-acao" className={botaoSecundario}>
          <ArrowLeft aria-hidden size={16} strokeWidth={2} />
          Voltar
        </Link>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Criando…" : "Criar plano"}
        </button>
      </div>
    </form>
  );
}

function Opcoes({
  id,
  opcoes,
  valor,
}: {
  id: string;
  opcoes: Record<string, string>;
  valor?: string;
}) {
  return (
    <Selecao id={id} name={id} defaultValue={valor ?? ""} className={campo}>
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
