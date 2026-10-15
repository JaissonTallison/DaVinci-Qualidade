import { CircleAlert } from "lucide-react";
import {
  ATENDIMENTOS,
  SIGNIFICANCIAS,
  SITUACOES_LICENCA,
  type Atendimento,
  type Significancia,
  type SituacaoLicenca,
} from "@davinci/types";

const COR_DA_SIGNIFICANCIA: Record<Significancia, string> = {
  baixa: "bg-nivel-baixo",
  media: "bg-nivel-medio",
  alta: "bg-nivel-alto",
};

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
      <span
        aria-hidden
        className={`size-2.5 shrink-0 rounded-xs ${COR_DA_SIGNIFICANCIA[significancia]}`}
      />
      {SIGNIFICANCIAS[significancia]}
      {significativo && <span className="font-semibold"> · significativo</span>}
    </span>
  );
}

const COR_DO_ATENDIMENTO: Record<Atendimento, string> = {
  atende: "bg-conforme",
  parcial: "bg-atencao",
  nao_atende: "bg-nao-conforme",
  nao_avaliado: "bg-neutro",
};

export function AtendimentoDoRequisito({
  atendimento,
}: {
  atendimento: Atendimento;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-full ${COR_DO_ATENDIMENTO[atendimento]}`}
      />
      {ATENDIMENTOS[atendimento]}
    </span>
  );
}

const COR_DA_LICENCA: Record<SituacaoLicenca, string> = {
  vigente: "bg-conforme",
  renovar: "bg-atencao",
  em_renovacao: "bg-info",
  vencida: "bg-nao-conforme",
};

/** Vencida pede ação: fundo e ícone (interface.md §8). */
export function SituacaoDaLicenca({ situacao }: { situacao: SituacaoLicenca }) {
  if (situacao === "vencida")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xs bg-nao-conforme/10 px-1.5 whitespace-nowrap text-nao-conforme">
        <CircleAlert
          aria-hidden
          size={14}
          strokeWidth={2}
          className="shrink-0"
        />
        {SITUACOES_LICENCA[situacao]}
      </span>
    );
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${situacao === "renovar" ? "text-atencao" : "text-texto"}`}
    >
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-full ${COR_DA_LICENCA[situacao]}`}
      />
      {SITUACOES_LICENCA[situacao]}
    </span>
  );
}
