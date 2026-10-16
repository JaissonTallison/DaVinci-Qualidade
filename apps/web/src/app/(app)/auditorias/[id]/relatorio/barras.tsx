import type { RespostaDaPergunta } from "@davinci/types";

export type LinhaDeBarras = {
  rotulo: string;
  contagem: Record<RespostaDaPergunta, number>;
};

const PARTES = [
  ["conforme", "Conforme", "bg-conforme"],
  ["parcial", "Parcial", "bg-atencao"],
  ["nao_conforme", "Não conforme", "bg-nao-conforme"],
] as const;

/** Barras horizontais empilhadas (conforme, parcial, não conforme) por norma ou processo. Saem na impressão. */
export function BarrasDeConformidade({
  titulo,
  linhas,
}: {
  titulo: string;
  linhas: LinhaDeBarras[];
}) {
  const maior = Math.max(
    1,
    ...linhas.map(
      (l) => l.contagem.conforme + l.contagem.parcial + l.contagem.nao_conforme,
    ),
  );
  return (
    <figure className="break-inside-avoid [print-color-adjust:exact]">
      <figcaption className="text-sm font-semibold">{titulo}</figcaption>
      <ul className="mt-2 flex flex-col gap-1.5">
        {linhas.map((l) => {
          const total =
            l.contagem.conforme + l.contagem.parcial + l.contagem.nao_conforme;
          return (
            <li
              key={l.rotulo}
              className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)_3rem] items-center gap-2 text-sm"
            >
              <span className="truncate">{l.rotulo}</span>
              <span
                className="flex h-3.5 gap-px"
                style={{ width: `${(total / maior) * 100}%` }}
                role="img"
                aria-label={PARTES.map(
                  ([k, n]) => `${n}: ${l.contagem[k]}`,
                ).join(", ")}
              >
                {PARTES.map(([k, , cor]) =>
                  l.contagem[k] ? (
                    <span
                      key={k}
                      className={`${cor} h-full rounded-xs`}
                      style={{ flexGrow: l.contagem[k] }}
                    />
                  ) : null,
                )}
              </span>
              <span className="text-right text-texto-2 tabular-nums">
                {total}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 flex flex-wrap gap-4 text-xs text-texto-2">
        {PARTES.map(([k, n, cor]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={`size-2.5 rounded-xs ${cor}`} />
            {n}
          </span>
        ))}
      </p>
    </figure>
  );
}

/** Agrupa as respostas avaliadas por uma chave (norma, processo). */
export function agrupar<T extends { resposta: RespostaDaPergunta }>(
  itens: T[],
  chave: (i: T) => string,
  nome: (k: string) => string,
): LinhaDeBarras[] {
  const mapa = new Map<string, Record<RespostaDaPergunta, number>>();
  for (const i of itens) {
    if (i.resposta === "pendente") continue;
    const k = chave(i);
    const c = mapa.get(k) ?? {
      conforme: 0,
      parcial: 0,
      nao_conforme: 0,
      pendente: 0,
    };
    c[i.resposta]++;
    mapa.set(k, c);
  }
  return [...mapa.entries()].map(([k, contagem]) => ({
    rotulo: nome(k),
    contagem,
  }));
}
