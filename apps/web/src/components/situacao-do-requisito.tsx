import {
  SITUACOES_DO_REQUISITO,
  type SituacaoDoRequisito,
} from "@davinci/types";
import { Alerta } from "./alerta";
import { Selo } from "./selo";

/** Matriz de competências: selo com texto curto no lugar de ponto colorido. */
const CURTO: Record<SituacaoDoRequisito, string> = {
  em_dia: "Em dia",
  vence_em_breve: "Vence",
  vencido: "Vencido",
  ausente: "Falta",
};

/** Selo. Vencido e "não tem" viram alerta, porque exigem ação (interface.md §8). */
export function SituacaoDoRequisitoMarcador({
  situacao,
  curto = false,
}: {
  situacao: SituacaoDoRequisito;
  /** Na matriz: selo com o texto curto; o texto completo fica no título. */
  curto?: boolean;
}) {
  const texto = SITUACOES_DO_REQUISITO[situacao];
  const alerta = situacao === "vencido" || situacao === "ausente";
  const tom = alerta
    ? "perigo"
    : situacao === "vence_em_breve"
      ? "atencao"
      : "sucesso";
  if (curto)
    return (
      <Selo tom={tom} title={texto}>
        {CURTO[situacao]}
      </Selo>
    );
  if (alerta) return <Alerta texto={texto} />;
  return <Selo tom={tom}>{texto}</Selo>;
}
