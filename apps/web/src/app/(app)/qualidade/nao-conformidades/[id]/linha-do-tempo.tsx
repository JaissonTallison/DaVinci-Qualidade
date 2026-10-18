import { Check, X } from "lucide-react";
import type { NaoConformidade } from "@davinci/types";
import { formatarData, formatarMomento } from "@/lib/datas";

/** Etapas do ciclo da NC, na ordem. Cancelada interrompe o fluxo. */
const ORDEM = [
  "aberta",
  "em_tratamento",
  "em_verificacao",
  "encerrada",
] as const;

/**
 * Linha do tempo do ciclo da NC: aberta → tratamento → verificação → encerrada (ou cancelada).
 * Mostra de relance onde a NC está e as datas de cada marco.
 */
export function LinhaDoTempoNc({ nc }: { nc: NaoConformidade }) {
  const cancelada = nc.status === "cancelada";
  const atual = cancelada
    ? ORDEM.indexOf("em_verificacao") // onde parou antes de cancelar (aproximação)
    : ORDEM.indexOf(nc.status as (typeof ORDEM)[number]);

  const passos: { titulo: string; detalhe?: string | null }[] = [
    { titulo: "Aberta", detalhe: formatarData(nc.dataAbertura) },
    {
      titulo: "Em tratamento",
      detalhe: nc.causaRaiz
        ? `Causa raiz definida${nc.ciclos >= 2 ? ` · ${nc.ciclos}º ciclo` : ""}`
        : "Analisar a causa e a ação corretiva",
    },
    {
      titulo: "Em verificação",
      detalhe: nc.dataImplantacao
        ? `Ação implantada em ${formatarData(nc.dataImplantacao)}`
        : "Após implantar a ação corretiva",
    },
    {
      titulo: "Encerrada",
      detalhe: nc.verificadoEm
        ? `${nc.eficaz ? "Eficaz" : "Ineficaz"} · ${formatarMomento(nc.verificadoEm)}`
        : nc.encerradaEm
          ? formatarMomento(nc.encerradaEm)
          : "Depois da eficácia confirmada",
    },
  ];

  return (
    <ol className="mt-4 flex flex-col">
      {passos.map((p, i) => {
        const concluido = !cancelada && i < atual;
        const corrente = !cancelada && i === atual;
        const ultimo = i === passos.length - 1 && !cancelada;
        return (
          <li key={p.titulo} className="flex gap-3">
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
                {concluido ? (
                  <Check size={15} strokeWidth={2.5} />
                ) : (
                  i + 1
                )}
              </span>
              {!ultimo && (
                <span
                  aria-hidden
                  className={`w-0.5 flex-1 ${concluido ? "bg-conforme/40" : "bg-borda"}`}
                />
              )}
            </div>
            <div className={`pb-5 ${corrente ? "" : "opacity-95"}`}>
              <p
                className={`text-base ${
                  corrente
                    ? "font-semibold text-texto"
                    : concluido
                      ? "text-texto"
                      : "text-texto-3"
                }`}
              >
                {p.titulo}
                {corrente && (
                  <span className="ml-2 text-sm font-normal text-acao">
                    etapa atual
                  </span>
                )}
              </p>
              {p.detalhe && (
                <p className="text-sm text-texto-2">{p.detalhe}</p>
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
          <div>
            <p className="text-base font-semibold text-nao-conforme">
              Cancelada
            </p>
            {nc.canceladaEm && (
              <p className="text-sm text-texto-2">
                {formatarMomento(nc.canceladaEm)}
              </p>
            )}
          </div>
        </li>
      )}
    </ol>
  );
}
