import {
  ATENDIMENTOS,
  SIGNIFICANCIAS,
  SITUACOES_LICENCA,
  type Atendimento,
  type Significancia,
  type SituacaoLicenca,
} from "@davinci/types";
import { Alerta } from "./alerta";
import { Selo, tomDoNivel } from "./selo";

/** Nota de significância (severidade × frequência); "significativo" quando alta ou ligado a requisito legal. */
export function SignificanciaDoAspecto({
  significancia,
  significativo,
}: {
  significancia: Significancia;
  significativo: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <Selo tom={tomDoNivel(significancia)}>
        {SIGNIFICANCIAS[significancia]}
      </Selo>
      {significativo && <Selo tom="perigo">Significativo</Selo>}
    </span>
  );
}

export function AtendimentoDoRequisito({
  atendimento,
}: {
  atendimento: Atendimento;
}) {
  const tom = {
    atende: "sucesso",
    parcial: "atencao",
    nao_atende: "perigo",
    nao_avaliado: "neutro",
  } as const;
  return <Selo tom={tom[atendimento]}>{ATENDIMENTOS[atendimento]}</Selo>;
}

/** Vencida pede ação; pedir renovação em atenção; vigente em sucesso. */
export function SituacaoDaLicenca({ situacao }: { situacao: SituacaoLicenca }) {
  if (situacao === "vencida")
    return <Alerta texto={SITUACOES_LICENCA[situacao]} />;
  const tom = {
    vigente: "sucesso",
    renovar: "atencao",
    em_renovacao: "info",
    vencida: "perigo",
  } as const;
  return <Selo tom={tom[situacao]}>{SITUACOES_LICENCA[situacao]}</Selo>;
}
