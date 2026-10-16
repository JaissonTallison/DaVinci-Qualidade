"use client";

import { useState, type ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { botaoLink, campoCompacto, erroDoCampo } from "@/lib/estilos";

export interface ColunaDoEditor {
  nome: string;
  rotulo: string;
  tipo?: "texto" | "nota" | "data" | "opcoes";
  opcoes?: Record<string, string>;
  /** Classe de largura mínima da coluna. */
  largura?: string;
  max?: number;
}

type Linha = { chave: number; valores: Record<string, string> };

/**
 * Tabela de linhas editáveis (FMEA, plano de controle, execução da OS). Os campos vão como `<prefixo>.<i>.<campo>`
 * e o total em `<prefixo>-total`; linha toda em branco é descartada na ação. `extra` mostra uma coluna calculada.
 */
export function EditorDeLinhas({
  colunas,
  iniciais,
  erros,
  extra,
  rotuloDaLinha = "Linha",
  prefixo = "linhas",
  comLinhaVazia = true,
}: {
  colunas: ColunaDoEditor[];
  iniciais: Record<string, string>[];
  erros: Record<string, string>;
  extra?: {
    rotulo: string;
    render: (valores: Record<string, string>) => ReactNode;
  };
  rotuloDaLinha?: string;
  /** Nome dos campos (`<prefixo>.<i>.<campo>`): mais de um editor no mesmo formulário. */
  prefixo?: string;
  /** Sem linhas iniciais, começa com uma em branco. */
  comLinhaVazia?: boolean;
}) {
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    (iniciais.length || !comLinhaVazia ? iniciais : [{}]).map(
      (valores, chave) => ({
        chave,
        valores,
      }),
    ),
  );
  const [proxima, setProxima] = useState(linhas.length);
  const mudar = (chave: number, campo: string, valor: string) =>
    setLinhas((ls) =>
      ls.map((l) =>
        l.chave === chave
          ? { ...l, valores: { ...l.valores, [campo]: valor } }
          : l,
      ),
    );
  return (
    <div>
      <input type="hidden" name={`${prefixo}-total`} value={linhas.length} />
      <div className="relative overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-texto-2">
              <th className="px-1 pb-1 font-semibold">#</th>
              {colunas.map((c) => (
                <th
                  key={c.nome}
                  className={`px-1 pb-1 font-semibold ${c.largura ?? "min-w-40"}`}
                >
                  {c.rotulo}
                </th>
              ))}
              {extra && (
                <th className="px-1 pb-1 font-semibold">{extra.rotulo}</th>
              )}
              <th className="px-1 pb-1">
                <span className="sr-only">Retirar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={l.chave} className="align-top">
                <td className="px-1 py-1 pt-2.5 text-texto-3 tabular-nums">
                  {i + 1}
                </td>
                {colunas.map((c) => {
                  const nome = `${prefixo}.${i}.${c.nome}`;
                  const erro = erros[nome];
                  const comum = {
                    name: nome,
                    value: l.valores[c.nome] ?? "",
                    "aria-label": `${c.rotulo}, ${rotuloDaLinha.toLowerCase()} ${i + 1}`,
                    "aria-invalid": Boolean(erro),
                    title: erro,
                    className: `${campoCompacto} w-full ${erro ? "border-nao-conforme" : ""}`,
                  };
                  return (
                    <td key={c.nome} className="px-1 py-1">
                      {c.tipo === "opcoes" ? (
                        <select
                          {...comum}
                          onChange={(e) =>
                            mudar(l.chave, c.nome, e.target.value)
                          }
                        >
                          <option value="">—</option>
                          {Object.entries(c.opcoes ?? {}).map(([k, n]) => (
                            <option key={k} value={k}>
                              {n}
                            </option>
                          ))}
                        </select>
                      ) : c.tipo === "nota" ? (
                        <select
                          {...comum}
                          onChange={(e) =>
                            mudar(l.chave, c.nome, e.target.value)
                          }
                        >
                          <option value="">—</option>
                          {Array.from({ length: 10 }, (_, n) => (
                            <option key={n + 1} value={n + 1}>
                              {n + 1}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          {...comum}
                          type={c.tipo === "data" ? "date" : "text"}
                          maxLength={c.max}
                          list={
                            c.nome === "responsavel" ? "pessoas" : undefined
                          }
                          onChange={(e) =>
                            mudar(l.chave, c.nome, e.target.value)
                          }
                        />
                      )}
                      {erro && (
                        <span className={`${erroDoCampo} block text-xs`}>
                          {erro}
                        </span>
                      )}
                    </td>
                  );
                })}
                {extra && (
                  <td className="px-1 py-1 pt-2">{extra.render(l.valores)}</td>
                )}
                <td className="px-1 py-1 pt-2">
                  <button
                    type="button"
                    aria-label={`Retirar ${rotuloDaLinha.toLowerCase()} ${i + 1}`}
                    onClick={() =>
                      setLinhas((ls) => ls.filter((x) => x.chave !== l.chave))
                    }
                    className="text-texto-3 hover:text-nao-conforme"
                  >
                    <X aria-hidden size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className={`${botaoLink} mt-2 inline-flex items-center gap-1 text-sm`}
        onClick={() => {
          setLinhas((ls) => [...ls, { chave: proxima, valores: {} }]);
          setProxima((n) => n + 1);
        }}
      >
        <Plus aria-hidden size={14} />
        Incluir {rotuloDaLinha.toLowerCase()}
      </button>
    </div>
  );
}
