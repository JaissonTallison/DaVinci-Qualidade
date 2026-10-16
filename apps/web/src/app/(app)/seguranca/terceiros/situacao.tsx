import { SITUACOES_TERCEIRO, type SituacaoTerceiro } from "@davinci/types";
import { Alerta } from "@/components/alerta";

/** Pendência impede a entrada: fundo. */
export function SituacaoDoTerceiro({
  situacao,
}: {
  situacao: SituacaoTerceiro;
}) {
  const alerta = situacao === "pendente";
  if (alerta) return <Alerta texto={SITUACOES_TERCEIRO[situacao]} />;
  return (
    <span className="whitespace-nowrap text-texto">
      {SITUACOES_TERCEIRO[situacao]}
    </span>
  );
}
