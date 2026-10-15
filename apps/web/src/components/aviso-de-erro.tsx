import type { ErroPadrao } from "@davinci/types";

/** Erro geral de uma ação (o de campo fica embaixo do campo). Mostra o código de rastreio para o suporte. */
export function AvisoDeErro({ erro }: { erro: ErroPadrao }) {
  return (
    <div
      role="alert"
      className="rounded-sm border border-nao-conforme bg-nao-conforme/10 px-4 py-2.5 text-base text-texto"
    >
      <p>{erro.mensagem}</p>
      {erro.rastreioId && (
        <p className="mt-1 text-xs text-texto-3">
          Código para o suporte:{" "}
          <span className="font-mono">{erro.rastreioId}</span>
        </p>
      )}
    </div>
  );
}
