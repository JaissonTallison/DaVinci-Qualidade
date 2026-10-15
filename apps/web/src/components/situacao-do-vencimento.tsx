import { CircleAlert } from "lucide-react";
import { SITUACOES_VENCIMENTO, type SituacaoVencimento } from "@davinci/types";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";

export function situacaoDaValidade(validade: string): SituacaoVencimento {
  const faltam = Math.round(
    (Date.parse(`${validade}T00:00:00Z`) -
      Date.parse(`${hojeEmBrasilia()}T00:00:00Z`)) /
      86_400_000,
  );
  return faltam < 0 ? "vencido" : faltam <= 30 ? "vence_em_breve" : "em_dia";
}

/** Data da validade com a situação: vencido pede ação (fundo); vencendo, texto em atenção. */
export function Validade({
  validade,
  situacao,
}: {
  validade: string;
  situacao?: SituacaoVencimento;
}) {
  const s = situacao ?? situacaoDaValidade(validade);
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap ${s === "vencido" ? "rounded-xs bg-nao-conforme/10 px-1.5 text-nao-conforme" : s === "vence_em_breve" ? "text-atencao" : "text-texto"}`}
    >
      {s === "vencido" && (
        <CircleAlert
          aria-hidden
          size={14}
          strokeWidth={2}
          className="shrink-0"
        />
      )}
      {formatarData(validade)}
      {s !== "em_dia" && ` · ${SITUACOES_VENCIMENTO[s].toLowerCase()}`}
    </span>
  );
}
