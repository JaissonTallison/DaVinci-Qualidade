import { SITUACOES_VENCIMENTO, type SituacaoVencimento } from "@davinci/types";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";
import { Alerta } from "./alerta";
import { Selo } from "./selo";

export function situacaoDaValidade(validade: string): SituacaoVencimento {
  const faltam = Math.round(
    (Date.parse(`${validade}T00:00:00Z`) -
      Date.parse(`${hojeEmBrasilia()}T00:00:00Z`)) /
      86_400_000,
  );
  return faltam < 0 ? "vencido" : faltam <= 30 ? "vence_em_breve" : "em_dia";
}

/** Data da validade com a situação: vencido vira alerta; vencendo, selo de atenção ao lado da data. */
export function Validade({
  validade,
  situacao,
}: {
  validade: string;
  situacao?: SituacaoVencimento;
}) {
  const s = situacao ?? situacaoDaValidade(validade);
  if (s === "vencido") return <Alerta texto="Vencido" desde={validade} />;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-texto">
      {formatarData(validade)}
      {s !== "em_dia" && <Selo tom="atencao">{SITUACOES_VENCIMENTO[s]}</Selo>}
    </span>
  );
}
