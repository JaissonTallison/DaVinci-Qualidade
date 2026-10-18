import { Check, X } from "lucide-react";
import { STATUS_DO_PPAP, type Ppap } from "@davinci/types";
import { formatarData } from "@/lib/datas";

/** Linha do tempo do PPAP: em preparação → submetido → decisão do cliente (aprovado, provisório ou rejeitado). */
export function LinhaDoTempoDoPpap({ p }: { p: Ppap }) {
  const decidido =
    p.status === "aprovado" ||
    p.status === "aprovacao_provisoria" ||
    p.status === "rejeitado";
  const rejeitado = p.status === "rejeitado";
  // 0 em preparação · 1 submetido · 2 decisão
  const atual = decidido ? 2 : p.status === "submetido" ? 1 : 0;

  const passos: { titulo: string; detalhe?: string | null }[] = [
    {
      titulo: "Em preparação",
      detalhe:
        p.pendentesParaSubmeter > 0
          ? `${p.pendentesParaSubmeter} elemento(s) a concluir`
          : "Elementos prontos para submeter",
    },
    {
      titulo: "Submetido",
      detalhe: p.submetidoEm
        ? `Submetido em ${formatarData(p.submetidoEm)}`
        : "Submeter o pacote ao cliente",
    },
    {
      titulo: "Decisão do cliente",
      detalhe: decidido
        ? `${STATUS_DO_PPAP[p.status]}${
            p.decididoEm ? ` em ${formatarData(p.decididoEm)}` : ""
          }`
        : "Aguardando decisão do cliente",
    },
  ];

  return (
    <ol className="mt-4 flex flex-col">
      {passos.map((passo, i) => {
        const decisao = i === 2;
        // A decisão concluída: verde quando aprovado/provisório, vermelha quando rejeitado.
        const concluido = decisao
          ? decidido && !rejeitado
          : i < atual;
        const vermelho = decisao && rejeitado;
        const corrente = !vermelho && !concluido && i === atual;
        const ultimo = i === passos.length - 1;
        return (
          <li key={passo.titulo} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={`flex size-7 shrink-0 items-center justify-center rounded-sm text-sm font-semibold ${
                  vermelho
                    ? "bg-nao-conforme text-primaria-texto"
                    : concluido
                      ? "bg-conforme/12 text-conforme"
                      : corrente
                        ? "bg-acao text-primaria-texto"
                        : "border border-borda-forte text-texto-3"
                }`}
              >
                {vermelho ? (
                  <X size={15} strokeWidth={2.5} />
                ) : concluido ? (
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
            <div className="pb-5">
              <p
                className={`text-base ${
                  vermelho
                    ? "font-semibold text-nao-conforme"
                    : corrente
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
    </ol>
  );
}
