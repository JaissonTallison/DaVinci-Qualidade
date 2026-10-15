import Link from "next/link";

export interface Indicador {
  rotulo: string;
  valor: number;
  /** Número que pede atenção: único lugar onde a faixa ganha cor. */
  alerta?: boolean;
  href?: string;
}

/** Indicadores numa faixa única, separados por divisória. Sem ícone, sem card colorido (interface.md §8). */
export function FaixaDeIndicadores({ itens }: { itens: Indicador[] }) {
  return (
    <dl className="grid grid-cols-1 divide-y divide-borda sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {itens.map((i) => {
        const numero = (
          <span
            className={`text-xl font-semibold ${i.alerta ? "text-nao-conforme" : "text-texto"}`}
          >
            {i.valor.toLocaleString("pt-BR")}
          </span>
        );
        return (
          <div key={i.rotulo} className="flex flex-col gap-0.5 px-5 py-4">
            <dt className="text-xs text-texto-2">{i.rotulo}</dt>
            <dd>
              {i.href ? (
                <Link href={i.href} className="hover:underline">
                  {numero}
                </Link>
              ) : (
                numero
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
