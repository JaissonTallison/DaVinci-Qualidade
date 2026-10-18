import { Check, X } from "lucide-react";
import type { PlanoDeAcao } from "@davinci/types";
import { formatarData, formatarMomento } from "@/lib/datas";

const ORDEM = ["em_execucao", "aguardando_eficacia", "encerrado"] as const;

/**
 * Linha do tempo do plano: em execução → aguardando eficácia → encerrado (ou cancelado).
 * Número nas etapas, check nas concluídas, "etapa atual" destacada.
 */
export function LinhaDoTempoDoPlano({ p }: { p: PlanoDeAcao }) {
  const cancelado = p.status === "cancelado";
  const atual = cancelado
    ? ORDEM.indexOf("aguardando_eficacia")
    : ORDEM.indexOf(p.status as (typeof ORDEM)[number]);
  const feitas = p.tarefas.filter((t) => t.situacao === "concluida").length;
  const total = p.tarefas.filter((t) => t.situacao !== "cancelada").length;

  const passos: { titulo: string; detalhe?: string | null }[] = [
    {
      titulo: "Em execução",
      detalhe: `Criado em ${formatarData(p.criadoEm.slice(0, 10))} · ${feitas} de ${total} tarefas`,
    },
    {
      titulo: "Aguardando eficácia",
      detalhe: "Todas as tarefas concluídas",
    },
    {
      titulo: "Encerrado",
      detalhe: p.verificadoEm
        ? `${p.eficaz ? "Objetivo alcançado" : "Objetivo não alcançado"} · ${formatarMomento(p.verificadoEm)}`
        : "Após confirmar a eficácia",
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
          <div>
            <p className="text-base font-semibold text-nao-conforme">
              Cancelado
            </p>
            {p.canceladoEm && (
              <p className="text-sm text-texto-2">
                {formatarMomento(p.canceladoEm)}
              </p>
            )}
          </div>
        </li>
      )}
    </ol>
  );
}
