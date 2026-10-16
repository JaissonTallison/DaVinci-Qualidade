import {
  SITUACOES_DO_REQUISITO,
  type SituacaoDoRequisito,
} from "@davinci/types";

const COR: Record<SituacaoDoRequisito, string> = {
  em_dia: "bg-conforme",
  vence_em_breve: "bg-atencao",
  vencido: "bg-nao-conforme",
  ausente: "bg-nao-conforme",
};

/** Ponto + texto. Vencido e "não tem" ganham fundo, porque exigem ação (interface.md §8). */
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
      <span title={texto} className="inline-flex items-center justify-center">
        <span
          aria-hidden
          className={`size-2.5 rounded-full ${COR[situacao]} ${situacao === "ausente" ? "ring-2 ring-nao-conforme/30" : ""}`}
        />
        <span className="sr-only">{texto}</span>
      </span>
    );
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm whitespace-nowrap ${alerta ? "rounded-xs bg-nao-conforme/10 px-1.5 text-nao-conforme" : "text-texto"}`}
    >
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-full ${COR[situacao]}`}
      />
      {texto}
    </span>
  );
}
