import {
  ATENDIMENTOS,
  SIGNIFICANCIAS,
  SITUACOES_LICENCA,
  type Atendimento,
  type Significancia,
  type SituacaoLicenca,
} from "@davinci/types";
import { Alerta } from "./alerta";

/** Nota de significância (severidade × frequência); "significativo" quando alta ou ligado a requisito legal. */
export function SignificanciaDoAspecto({
  significancia,
  significativo,
}: {
  significancia: Significancia;
  significativo: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      {SIGNIFICANCIAS[significancia]}
      {significativo && <span className="font-semibold"> · significativo</span>}
    </span>
  );
}

export function AtendimentoDoRequisito({
  atendimento,
}: {
  atendimento: Atendimento;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      {ATENDIMENTOS[atendimento]}
    </span>
  );
}

/** Vencida pede ação: fundo e ícone (interface.md §8). */
export function SituacaoDaLicenca({ situacao }: { situacao: SituacaoLicenca }) {
  if (situacao === "vencida")
    return <Alerta texto={SITUACOES_LICENCA[situacao]} />;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${situacao === "renovar" ? "text-atencao" : "text-texto"}`}
    >
      {SITUACOES_LICENCA[situacao]}
    </span>
  );
}
