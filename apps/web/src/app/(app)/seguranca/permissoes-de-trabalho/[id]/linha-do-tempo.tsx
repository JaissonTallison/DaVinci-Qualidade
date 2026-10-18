import { Check, X } from "lucide-react";
import type { PermissaoDeTrabalho } from "@davinci/types";
import { formatarMomento } from "@/lib/datas";
import { periodoDaPt } from "../periodo";

const ORDEM = ["solicitada", "liberada", "encerrada"] as const;

/** Linha do tempo da PT: solicitada → liberada → encerrada (ou cancelada). */
export function LinhaDoTempoDaPt({ pt }: { pt: PermissaoDeTrabalho }) {
  const cancelada = pt.status === "cancelada";
  const atual = cancelada
    ? ORDEM.indexOf("liberada")
    : ORDEM.indexOf(pt.status as (typeof ORDEM)[number]);

  const passos: { titulo: string; detalhe?: string | null; alerta?: boolean }[] =
    [
      {
        titulo: "Solicitada",
        detalhe: periodoDaPt(pt.inicio, pt.fim),
      },
      {
        titulo: "Liberada",
        detalhe: pt.liberadaEm
          ? formatarMomento(pt.liberadaEm)
          : "Outra pessoa autorizada precisa liberar",
      },
      {
        titulo: "Encerrada",
        detalhe: pt.encerradaEm
          ? formatarMomento(pt.encerradaEm)
          : pt.vencida
            ? "Prazo vencido: encerre a PT"
            : "Encerrar ao fim do serviço",
        alerta: pt.vencida && !pt.encerradaEm,
      },
    ];

  return (
    <ol className="mt-4 flex flex-col">
      {passos.map((passo, i) => {
        const concluido = !cancelada && i < atual;
        const corrente = !cancelada && i === atual;
        const ultimo = i === passos.length - 1 && !cancelada;
        return (
          <li key={passo.titulo} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={`flex size-7 shrink-0 items-center justify-center rounded-sm text-sm font-semibold ${
                  concluido
                    ? "bg-conforme/12 text-conforme"
                    : corrente
                      ? passo.alerta
                        ? "bg-nao-conforme text-primaria-texto"
                        : "bg-acao text-primaria-texto"
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
                  <span
                    className={`ml-2 text-sm font-normal ${passo.alerta ? "text-nao-conforme" : "text-acao"}`}
                  >
                    {passo.alerta ? "vencida" : "etapa atual"}
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
      {cancelada && (
        <li className="flex gap-3">
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-nao-conforme/12 text-nao-conforme"
          >
            <X size={15} strokeWidth={2.5} />
          </span>
          <p className="text-base font-semibold text-nao-conforme">Cancelada</p>
        </li>
      )}
    </ol>
  );
}
