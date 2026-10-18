import { Check, X } from "lucide-react";
import type { Mudanca } from "@davinci/types";
import { formatarData } from "@/lib/datas";

const ORDEM = ["proposta", "aprovada", "implementada"] as const;

/** Linha do tempo da mudança: proposta → aprovada → implementada (ou rejeitada). ISO 9001 6.3. */
export function LinhaDoTempoDaMudanca({ m }: { m: Mudanca }) {
  const rejeitada = m.status === "rejeitada";
  const atual = rejeitada
    ? ORDEM.indexOf("aprovada")
    : ORDEM.indexOf(m.status as (typeof ORDEM)[number]);

  const passos: { titulo: string; detalhe?: string | null }[] = [
    {
      titulo: "Proposta",
      detalhe: `Prevista para ${formatarData(m.dataPrevista)}`,
    },
    {
      titulo: "Aprovada",
      detalhe: m.decididaEm
        ? `Decidida em ${formatarData(m.decididaEm)}`
        : "Aguardando decisão de um gestor",
    },
    {
      titulo: "Implementada",
      detalhe: m.implementadaEm
        ? `Implementada em ${formatarData(m.implementadaEm)}`
        : "Implementar e verificar o resultado",
    },
  ];

  return (
    <ol className="mt-4 flex flex-col">
      {passos.map((passo, i) => {
        const concluido = !rejeitada && i < atual;
        const corrente = !rejeitada && i === atual;
        const ultimo = i === passos.length - 1 && !rejeitada;
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
      {rejeitada && (
        <li className="flex gap-3">
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-nao-conforme/12 text-nao-conforme"
          >
            <X size={15} strokeWidth={2.5} />
          </span>
          <p className="text-base font-semibold text-nao-conforme">Rejeitada</p>
        </li>
      )}
    </ol>
  );
}
