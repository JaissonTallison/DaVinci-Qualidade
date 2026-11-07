"use client";

import { X } from "@/components/icones";
import { useState } from "react";
import { botaoSecundario, campoCompacto, erroDoCampo } from "@/lib/estilos";

const COLUNAS = [
  { nome: "setor", rotulo: "Setor", classe: "min-w-36 flex-[2]", max: 150 },
  {
    nome: "comentarios",
    rotulo: "Comentários",
    classe: "min-w-40 flex-[3]",
    max: 2000,
  },
  {
    nome: "pontosPositivos",
    rotulo: "Pontos positivos",
    classe: "min-w-40 flex-[3]",
    max: 2000,
  },
  {
    nome: "observacoes",
    rotulo: "Observações",
    classe: "min-w-40 flex-[3]",
    max: 2000,
  },
  {
    nome: "naoConformidade",
    rotulo: "Não conformidade",
    classe: "min-w-40 flex-[3]",
    max: 2000,
  },
] as const;

/** Máximo de 50 setores (igual ao schema). */
const MAXIMO = 50;

/**
 * Registro rápido por setor: anotações (texto livre) por setor auditado. As linhas vão como
 * `linha_<campo>` repetidos; linha toda vazia é ignorada. Erros chegam como `registroPorSetor.<i>.<campo>`.
 */
export function TabelaPorSetor({
  valores,
  erros,
}: {
  valores?: Record<string, string | null | undefined>[];
  erros: Record<string, string>;
}) {
  const [linhas, setLinhas] = useState(Math.max(valores?.length ?? 0, 1));
  return (
    <div className="flex flex-col gap-3">
      <div className="hidden gap-2 text-xs text-texto-2 lg:flex">
        <span className="w-6" />
        {COLUNAS.map((c) => (
          <span key={c.nome} className={c.classe}>
            {c.rotulo}
          </span>
        ))}
        <span className="w-8" />
      </div>
      {Array.from({ length: linhas }, (_, i) => (
        <fieldset
          key={i}
          className="flex flex-wrap items-start gap-2 lg:flex-nowrap"
        >
          <legend className="sr-only">Setor {i + 1}</legend>
          <span className="w-6 pt-2 text-right text-sm text-texto-3 max-lg:hidden">
            {i + 1}.
          </span>
          {COLUNAS.map((c) => {
            const erro = erros[`registroPorSetor.${i}.${c.nome}`];
            return (
              <div key={c.nome} className={`flex flex-col gap-1 ${c.classe}`}>
                <label
                  className="text-xs text-texto-2 lg:hidden"
                  htmlFor={`setor-${i}-${c.nome}`}
                >
                  {c.rotulo}
                </label>
                <input
                  id={`setor-${i}-${c.nome}`}
                  name={`linha_${c.nome}`}
                  defaultValue={valores?.[i]?.[c.nome] ?? ""}
                  maxLength={c.max}
                  className={`${campoCompacto} w-full`}
                  aria-invalid={Boolean(erro)}
                />
                {erro && <span className={erroDoCampo}>{erro}</span>}
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setLinhas((n) => Math.max(n - 1, 1))}
            aria-label={`Remover o setor ${i + 1}`}
            className="pt-1.5 text-texto-3 hover:text-nao-conforme"
          >
            <X aria-hidden size={18} strokeWidth={2} />
          </button>
        </fieldset>
      ))}
      {linhas < MAXIMO && (
        <div>
          <button
            type="button"
            onClick={() => setLinhas((n) => n + 1)}
            className={botaoSecundario}
          >
            Incluir setor
          </button>
        </div>
      )}
    </div>
  );
}
