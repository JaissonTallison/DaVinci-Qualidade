import {
  RESPOSTAS_DA_PERGUNTA,
  RISCOS_DA_EVIDENCIA,
  TIPOS_DE_EVIDENCIA,
  type RespostaDaPergunta,
  type RiscoDaEvidencia,
  type TipoDeEvidencia,
} from "@davinci/types";
import { Selo } from "./selo";

/** Risco se a evidência não existir, no tom do nível. */
export function RiscoDaEvidenciaMarcador({
  risco,
}: {
  risco: RiscoDaEvidencia;
}) {
  const tom = { alto: "perigo", medio: "atencao", baixo: "sucesso" } as const;
  return <Selo tom={tom[risco]}>{RISCOS_DA_EVIDENCIA[risco]}</Selo>;
}

export function TipoDaEvidencia({ tipo }: { tipo: TipoDeEvidencia }) {
  return <Selo>{TIPOS_DE_EVIDENCIA[tipo]}</Selo>;
}

export function RespostaMarcador({
  resposta,
}: {
  resposta: RespostaDaPergunta;
}) {
  const tom = {
    pendente: "neutro",
    conforme: "sucesso",
    parcial: "atencao",
    nao_conforme: "perigo",
  } as const;
  return <Selo tom={tom[resposta]}>{RESPOSTAS_DA_PERGUNTA[resposta]}</Selo>;
}
