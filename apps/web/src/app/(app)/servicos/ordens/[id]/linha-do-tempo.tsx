import { Check, X } from "lucide-react";
import type { OrdemDeServico } from "@davinci/types";
import { formatarData, formatarMomento } from "@/lib/datas";

const ORDEM = ["aberta", "em_execucao", "concluida"] as const;

/** Linha do tempo da OS: aberta → em execução → concluída (ou cancelada). */
export function LinhaDoTempoDaOs({ o }: { o: OrdemDeServico }) {
  const cancelada = o.status === "cancelada";
  const atual = cancelada
    ? ORDEM.indexOf("em_execucao")
    : ORDEM.indexOf(o.status as (typeof ORDEM)[number]);
  const atrasada = o.atrasada && !cancelada && o.status !== "concluida";

  const passos: { titulo: string; detalhe?: string | null; alerta?: boolean }[] =
    [
      {
        titulo: "Aberta",
        detalhe: `Prazo ${formatarData(o.prazo)}`,
        alerta: atrasada,
      },
      {
        titulo: "Em execução",
        detalhe: o.iniciadaEm
          ? formatarMomento(o.iniciadaEm)
          : "Iniciar o atendimento",
      },
      {
        titulo: "Concluída",
        detalhe: o.concluidaEm
          ? `${formatarMomento(o.concluidaEm)}${
              o.noPrazo === null ? "" : o.noPrazo ? " · no prazo" : " · fora do prazo"
            }`
          : "Registrar o relatório e o aceite",
      },
    ];

  return (
    <ol className="mt-4 flex flex-col">
      {passos.map((passo, i) => {
        const concluido = !cancelada && i < atual;
        const corrente = !cancelada && i === atual;
        const ultimo = i === passos.length - 1 && !cancelada;
        const alertaCorrente = corrente && passo.alerta;
        return (
          <li key={passo.titulo} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={`flex size-7 shrink-0 items-center justify-center rounded-sm text-sm font-semibold ${
                  concluido
                    ? "bg-conforme/12 text-conforme"
                    : corrente
                      ? alertaCorrente
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
                    className={`ml-2 text-sm font-normal ${alertaCorrente ? "text-nao-conforme" : "text-acao"}`}
                  >
                    {alertaCorrente ? "atrasada" : "etapa atual"}
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
