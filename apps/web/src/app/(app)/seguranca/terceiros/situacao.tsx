import { CircleAlert } from "lucide-react";
import { SITUACOES_TERCEIRO, type SituacaoTerceiro } from "@davinci/types";

const COR: Record<SituacaoTerceiro, string> = {
  liberada: "bg-conforme",
  pendente: "bg-nao-conforme",
  contrato_encerrado: "bg-neutro",
};

/** Pendência impede a entrada: fundo. */
export function SituacaoDoTerceiro({
  situacao,
}: {
  situacao: SituacaoTerceiro;
}) {
  const alerta = situacao === "pendente";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${alerta ? "rounded-xs bg-nao-conforme/10 px-1.5 text-nao-conforme" : "text-texto"}`}
    >
      {alerta ? (
        <CircleAlert
          aria-hidden
          size={14}
          strokeWidth={2}
          className="shrink-0"
        />
      ) : (
        <span
          aria-hidden
          className={`size-2 shrink-0 rounded-full ${COR[situacao]}`}
        />
      )}
      {SITUACOES_TERCEIRO[situacao]}
    </span>
  );
}
