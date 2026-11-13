"use client";

import Link from "next/link";
import { useState } from "react";
import {
  TIPOS_VINCULO,
  type TipoVinculo,
  type VinculoDoProcesso,
} from "@davinci/types";
import { Botao } from "@/components/botao";
import {
  adicionarVinculoProcesso,
  buscarRegistrosParaVinculo,
  removerVinculoProcesso,
} from "@/lib/acoes-processos";
import { campo } from "@/lib/estilos";

const ROTA: Record<TipoVinculo, (id: string) => string> = {
  nao_conformidade: (id) => `/qualidade/nao-conformidades/${id}`,
  plano_de_acao: (id) => `/qualidade/planos-de-acao/${id}`,
  inspecao: (id) => `/qualidade/inspecoes/${id}`,
  documento: (id) => `/sgi/documentos/${id}`,
  risco: (id) => `/sgi/riscos/${id}`,
};

export function VinculosDoProcesso({
  processoId,
  vinculos,
  podeEditar,
}: {
  processoId: string;
  vinculos: VinculoDoProcesso[];
  podeEditar: boolean;
}) {
  const [tipo, setTipo] = useState<TipoVinculo>("nao_conformidade");
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<
    { id: string; rotulo: string }[]
  >([]);
  const [buscando, setBuscando] = useState(false);
  const [buscou, setBuscou] = useState(false);

  async function buscar() {
    setBuscando(true);
    setBuscou(true);
    const r = await buscarRegistrosParaVinculo(tipo, termo);
    setResultados(r);
    setBuscando(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {vinculos.length === 0 ? (
        <p className="text-sm text-texto-2">
          Nenhum registro ligado a este processo.
        </p>
      ) : (
        <ul className="divide-y divide-borda">
          {vinculos.map((v) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2"
            >
              <span className="text-xs font-semibold tracking-[0.03em] text-texto-2 uppercase">
                {TIPOS_VINCULO[v.tipo]}
              </span>
              <Link
                href={ROTA[v.tipo](v.registroId)}
                className="min-w-0 flex-1 text-sm text-info hover:underline"
              >
                {v.rotulo}
              </Link>
              {podeEditar && (
                <form action={removerVinculoProcesso}>
                  <input type="hidden" name="processoId" value={processoId} />
                  <input type="hidden" name="vinculoId" value={v.id} />
                  <button
                    type="submit"
                    className="text-sm text-texto-2 hover:text-nao-conforme"
                  >
                    Remover
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {podeEditar && (
        <div className="rounded-md border border-borda bg-afundado p-3">
          <p className="mb-2 text-sm font-medium text-texto">
            Ligar um registro
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-texto-2">Tipo</span>
              <select
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value as TipoVinculo);
                  setResultados([]);
                  setBuscou(false);
                }}
                className={campo}
              >
                {Object.entries(TIPOS_VINCULO).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-xs text-texto-2">Buscar</span>
              <input
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    buscar();
                  }
                }}
                placeholder="código ou texto"
                className={campo}
              />
            </label>
            <Botao
              type="button"
              onClick={buscar}
              carregando={buscando}
              textoCarregando="Buscando…"
            >
              Buscar
            </Botao>
          </div>

          {buscou && !buscando && resultados.length === 0 && (
            <p className="mt-2 text-sm text-texto-2">
              Nenhum registro encontrado.
            </p>
          )}
          {resultados.length > 0 && (
            <ul className="mt-2 divide-y divide-borda rounded-md border border-borda bg-superficie">
              {resultados.map((r) => (
                <li key={r.id}>
                  <form action={adicionarVinculoProcesso}>
                    <input
                      type="hidden"
                      name="processoId"
                      value={processoId}
                    />
                    <input type="hidden" name="tipo" value={tipo} />
                    <input type="hidden" name="registroId" value={r.id} />
                    <input type="hidden" name="rotulo" value={r.rotulo} />
                    <button
                      type="submit"
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-texto hover:bg-afundado"
                    >
                      <span className="min-w-0 flex-1">{r.rotulo}</span>
                      <span className="shrink-0 text-info">Ligar</span>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
