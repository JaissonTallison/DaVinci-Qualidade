import {
  RESPOSTAS_DA_PERGUNTA,
  RISCOS_DA_EVIDENCIA,
  TIPOS_DE_EVIDENCIA,
  type RespostaDaPergunta,
  type RiscoDaEvidencia,
  type TipoDeEvidencia,
} from "@davinci/types";

/** Risco se a evidência não existir: a cor no marcador, o texto em tinta normal (interface.md §5.4). */
export function RiscoDaEvidenciaMarcador({
  risco,
}: {
  risco: RiscoDaEvidencia;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-texto">
      {RISCOS_DA_EVIDENCIA[risco]}
    </span>
  );
}

export function TipoDaEvidencia({ tipo }: { tipo: TipoDeEvidencia }) {
  return (
    <span className="rounded-xs bg-superficie-2 px-1.5 py-0.5 text-xs text-texto-2">
      {TIPOS_DE_EVIDENCIA[tipo]}
    </span>
  );
}

export function RespostaMarcador({
  resposta,
}: {
  resposta: RespostaDaPergunta;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-texto">
      {RESPOSTAS_DA_PERGUNTA[resposta]}
    </span>
  );
}
