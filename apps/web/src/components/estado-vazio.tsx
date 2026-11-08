import type { ReactNode } from "react";

/**
 * Estado vazio de uma lista: um ícone discreto, a explicação e, quando cabe, um botão para criar o primeiro
 * registro. Dá um destino para a tela em vez de deixar só uma frase solta.
 */
export function EstadoVazio({
  icone,
  titulo,
  descricao,
  acao,
}: {
  icone?: ReactNode;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
      {icone && <div className="mb-2 text-texto-3">{icone}</div>}
      <p className="text-base font-semibold text-texto">{titulo}</p>
      {descricao && (
        <p className="max-w-sm text-sm text-texto-2">{descricao}</p>
      )}
      {acao && <div className="mt-3">{acao}</div>}
    </div>
  );
}
