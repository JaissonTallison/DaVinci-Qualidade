/**
 * Linha abaixo do título da página com o que pede ação agora ("1 vencido · 2 reprovados"), em vermelho.
 * Só aparece quando há pendência: com tudo em dia, o cabeçalho fica só com o título.
 */
export function Pendencias({
  itens,
}: {
  itens: {
    valor: number | string;
    rotulo: string;
    /** Rótulo quando o valor é 1 ("1 vencido"). */
    singular?: string;
    alerta?: boolean;
  }[];
}) {
  const pendentes = itens.filter(
    (i) => i.alerta && typeof i.valor === "number" && i.valor > 0,
  );
  if (pendentes.length === 0) return null;
  return (
    <p className="mt-1 text-sm font-semibold text-nao-conforme">
      {pendentes
        .map(
          (i) =>
            `${i.valor} ${i.valor === 1 && i.singular ? i.singular : i.rotulo}`,
        )
        .join(" · ")}
    </p>
  );
}
