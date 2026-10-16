import { diasEntre, formatarData, hojeEmBrasilia } from "@/lib/datas";

/**
 * Situação que exige ação (vencido, atrasado, reprovado): texto em vermelho com há quanto tempo e, embaixo,
 * o detalhe e a data em tom discreto. Sem caixa, sem ícone, sem ponto (interface.md §8).
 */
export function Alerta({
  texto,
  desde,
  detalhe,
}: {
  texto: string;
  /** Data em que venceu (AAAA-MM-DD ou ISO): vira "há N dias" e "desde DD/MM/AAAA". */
  desde?: string | null;
  /** Ex.: o status do registro ("Aberta"). */
  detalhe?: string;
}) {
  const dia = desde?.slice(0, 10);
  const dias = dia ? diasEntre(dia, hojeEmBrasilia()) : 0;
  const segunda = [detalhe, dia ? `desde ${formatarData(dia)}` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <span className="inline-flex flex-col leading-tight whitespace-nowrap">
      <span className="font-semibold text-nao-conforme">
        {texto}
        {dias > 0 && ` há ${dias === 1 ? "1 dia" : `${dias} dias`}`}
      </span>
      {segunda && <span className="text-xs text-texto-3">{segunda}</span>}
    </span>
  );
}
