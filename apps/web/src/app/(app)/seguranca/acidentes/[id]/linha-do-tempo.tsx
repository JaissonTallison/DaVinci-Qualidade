import { Check, X } from "lucide-react";
import type { Acidente } from "@davinci/types";
import { formatarData } from "@/lib/datas";

const ORDEM = ["registrado", "em_investigacao", "concluido"] as const;

/** Linha do tempo do acidente: registrado → em investigação → concluído (ou cancelado). */
export function LinhaDoTempoDoAcidente({ a }: { a: Acidente }) {
  const cancelado = a.status === "cancelado";
  const atual = cancelado
    ? ORDEM.indexOf("em_investigacao")
    : ORDEM.indexOf(a.status as (typeof ORDEM)[number]);
  const itensInvestigacao =
    a.investigacao.testemunhas.length +
    a.investigacao.porques.length +
    a.investigacao.fatos.length;

  const passos: { titulo: string; detalhe?: string | null }[] = [
    {
      titulo: "Registrado",
      detalhe: `Ocorreu em ${formatarData(a.data)}${
        a.catNumero
          ? ` · CAT ${a.catNumero}${a.catData ? ` em ${formatarData(a.catData)}` : ""}`
          : ""
      }`,
    },
    {
      titulo: "Em investigação",
      detalhe:
        itensInvestigacao > 0
          ? `${itensInvestigacao} ${itensInvestigacao === 1 ? "item" : "itens"} na análise`
          : "Levantar testemunhos, fatos e causas",
    },
    {
      titulo: "Concluído",
      detalhe: "Investigação encerrada e medidas definidas",
    },
  ];

  return (
    <ol className="mt-4 flex flex-col">
      {passos.map((passo, i) => {
        const concluido = !cancelado && i < atual;
        const corrente = !cancelado && i === atual;
        const ultimo = i === passos.length - 1 && !cancelado;
        return (
          <li key={passo.titulo} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={`flex size-7 shrink-0 items-center justify-center rounded-sm text-sm font-semibold ${
                  concluido
                    ? "bg-conforme/12 text-conforme"
                    : corrente
                      ? "bg-acao text-primaria-texto"
                      : "border border-borda-forte text-texto-3"
                }`}
              >
                {concluido ? <Check size={15} strokeWidth={2.5} /> : i + 1}
              </span>
              {!ultimo && (
                <span
                  aria-hidden
                  className={`w-0.5 flex-1 ${concluido ? "bg-conforme/40" : "bg-borda"}`}
                />
              )}
            </div>
            <div className="pb-5">
              <p
                className={`text-base ${
                  corrente
                    ? "font-semibold text-texto"
                    : concluido
                      ? "text-texto"
                      : "text-texto-3"
                }`}
              >
                {passo.titulo}
                {corrente && (
                  <span className="ml-2 text-sm font-normal text-acao">
                    etapa atual
                  </span>
                )}
              </p>
              {passo.detalhe && (
                <p className="text-sm text-texto-2">{passo.detalhe}</p>
              )}
            </div>
          </li>
        );
      })}
      {cancelado && (
        <li className="flex gap-3">
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-nao-conforme/12 text-nao-conforme"
          >
            <X size={15} strokeWidth={2.5} />
          </span>
          <p className="text-base font-semibold text-nao-conforme">Cancelado</p>
        </li>
      )}
    </ol>
  );
}
