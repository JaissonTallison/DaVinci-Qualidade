import {
  SITUACOES_DO_REQUISITO,
  type SituacaoDoRequisito,
} from "@davinci/types";
import { Alerta } from "./alerta";

/** Matriz de competências: texto curto no lugar de ponto colorido. */
const CURTO: Record<SituacaoDoRequisito, string> = {
  em_dia: "Em dia",
  vence_em_breve: "Vence",
  vencido: "Vencido",
  ausente: "Falta",
};

/** Só texto. Vencido e "não tem" viram alerta, porque exigem ação (interface.md §8). */
export function SituacaoDoRequisitoMarcador({
  situacao,
  curto = false,
}: {
  situacao: SituacaoDoRequisito;
  /** Na matriz: só o ponto, com o texto para leitores de tela e no título. */
  curto?: boolean;
}) {
  const texto = SITUACOES_DO_REQUISITO[situacao];
  const alerta = situacao === "vencido" || situacao === "ausente";
  if (curto)
    return (
      <span
        title={texto}
        className={`text-xs whitespace-nowrap ${alerta ? "font-semibold text-nao-conforme" : situacao === "vence_em_breve" ? "text-atencao" : "text-texto-2"}`}
      >
        {CURTO[situacao]}
      </span>
    );
  if (alerta) return <Alerta texto={texto} />;
  return <span className="text-sm whitespace-nowrap text-texto">{texto}</span>;
}
