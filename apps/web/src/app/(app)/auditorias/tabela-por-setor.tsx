"use client";

import { Plus, Trash2 } from "@/components/icones";
import { useState } from "react";
import { areaDeTexto, campo, erroDoCampo } from "@/lib/estilos";
import { Botao, BotaoIcone } from "@/components/botao";

const COLUNAS = [
  { nome: "setor", rotulo: "Setor", max: 150 },
  {
    nome: "comentarios",
    rotulo: "Comentários",
    max: 2000,
  },
  {
    nome: "pontosPositivos",
    rotulo: "Pontos positivos",
    max: 2000,
  },
  {
    nome: "observacoes",
    rotulo: "Observações",
    max: 2000,
  },
  {
    nome: "naoConformidade",
    rotulo: "Não conformidade",
    max: 2000,
  },
] as const;

/** Máximo de 50 setores (igual ao schema). */
const MAXIMO = 50;

/**
 * Registro rápido por setor: anotações (texto livre) por setor auditado. Cada setor é um quadro com o nome
 * em cima e as quatro anotações em grade 2 × 2, sem estourar a largura do card. As linhas vão como
 * `linha_<campo>` repetidos, na ordem dos quadros; linha toda vazia é ignorada. Erros chegam como
 * `registroPorSetor.<i>.<campo>`.
 */
export function TabelaPorSetor({
  valores,
  erros,
}: {
  valores?: Record<string, string | null | undefined>[];
  erros: Record<string, string>;
}) {
  // Cada quadro tem uma chave própria: remover o do meio tira aquele, não o último.
  const [quadros, setQuadros] = useState(() =>
    Array.from({ length: Math.max(valores?.length ?? 0, 1) }, (_, i) => ({
      chave: i,
      iniciais: valores?.[i] ?? {},
    })),
  );
  const [proxima, setProxima] = useState(quadros.length);
  const [setor, ...anotacoes] = COLUNAS;
  return (
    <div className="flex flex-col gap-3">
      {quadros.map((q, i) => {
        const controle = (c: (typeof COLUNAS)[number], area: boolean) => {
          const erro = erros[`registroPorSetor.${i}.${c.nome}`];
          const id = `setor-${q.chave}-${c.nome}`;
          return (
            <div key={c.nome} className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor={id} className="text-sm font-medium text-texto">
                {c.rotulo}
              </label>
              {area ? (
                <textarea
                  id={id}
                  name={`linha_${c.nome}`}
                  rows={2}
                  defaultValue={q.iniciais[c.nome] ?? ""}
                  maxLength={c.max}
                  className={`${areaDeTexto} min-h-16`}
                  aria-invalid={Boolean(erro)}
                />
              ) : (
                <input
                  id={id}
                  name={`linha_${c.nome}`}
                  defaultValue={q.iniciais[c.nome] ?? ""}
                  maxLength={c.max}
                  list="setores"
                  className={campo}
                  aria-invalid={Boolean(erro)}
                />
              )}
              {erro && <span className={erroDoCampo}>{erro}</span>}
            </div>
          );
        };
        return (
          <fieldset
            key={q.chave}
            className="rounded-md border border-borda bg-superficie-2 p-4"
          >
            <legend className="sr-only">Setor {i + 1}</legend>
            <div className="flex items-end gap-3">
              <span className="mb-2.5 grid size-6 shrink-0 place-items-center rounded-xs bg-superficie text-xs font-semibold text-texto-2 tabular-nums ring-1 ring-borda">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">{controle(setor, false)}</div>
              {quadros.length > 1 && (
                <BotaoIcone
                  rotulo={`Remover o setor ${i + 1}`}
                  icone={Trash2}
                  className="mb-0.5"
                  onClick={() =>
                    setQuadros((qs) => qs.filter((x) => x.chave !== q.chave))
                  }
                />
              )}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {anotacoes.map((c) => controle(c, true))}
            </div>
          </fieldset>
        );
      })}
      {quadros.length < MAXIMO && (
        <div>
          <Botao
            onClick={() => {
              setQuadros((qs) => [...qs, { chave: proxima, iniciais: {} }]);
              setProxima((n) => n + 1);
            }}
            icone={Plus}
          >
            Incluir setor
          </Botao>
        </div>
      )}
    </div>
  );
}
