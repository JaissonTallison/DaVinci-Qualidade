import { Check } from "lucide-react";
import type { Reclamacao } from "@davinci/types";
import { formatarData } from "@/lib/datas";

const ORDEM = ["aberta", "analisada", "respondida", "encerrada"] as const;

/** Linha do tempo da reclamação: aberta → analisada → respondida → encerrada (ISO 10002). */
export function LinhaDoTempoDaReclamacao({ r }: { r: Reclamacao }) {
  const atual = ORDEM.indexOf(r.status as (typeof ORDEM)[number]);

  const passos: { titulo: string; detalhe?: string | null; alerta?: boolean }[] =
    [
      {
        titulo: "Aberta",
        detalhe: `Recebida em ${formatarData(r.recebidaEm)} · responder até ${formatarData(r.prazoResposta)}`,
        alerta: r.atrasada,
      },
      {
        titulo: "Analisada",
        detalhe:
          r.procedente === null
            ? "Avaliar se a reclamação procede"
            : `${r.procedente ? "Procedente" : "Improcedente"}${
                r.ncNumero ? ` · NC ${r.ncNumero}` : ""
              }`,
      },
      {
        titulo: "Respondida",
        detalhe: r.respondidaEm
          ? `Respondida em ${formatarData(r.respondidaEm)}`
          : "Comunicar a solução ao cliente",
      },
      {
        titulo: "Encerrada",
        detalhe:
          r.clienteSatisfeito === null
            ? "Confirmar a solução com o cliente"
            : r.clienteSatisfeito
              ? "Cliente satisfeito"
              : "Cliente não satisfeito",
      },
    ];

  return (
    <ol className="mt-4 flex flex-col">
      {passos.map((passo, i) => {
        const concluido = i < atual;
        const corrente = i === atual;
        const ultimo = i === passos.length - 1;
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
                    {alertaCorrente ? "resposta atrasada" : "etapa atual"}
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
    </ol>
  );
}
