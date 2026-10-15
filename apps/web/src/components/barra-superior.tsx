import type { DadosDoUsuario } from "@davinci/types";
import { sair } from "@/lib/acoes-sessao";

/** Empresa e pessoa logadas, e o botão de sair. */
export function BarraSuperior({ eu }: { eu?: DadosDoUsuario }) {
  return (
    <header className="flex h-12 items-center justify-end gap-4 border-b border-borda bg-superficie px-6 print:hidden">
      {eu && (
        <>
          <span className="truncate text-sm text-texto-2">
            {eu.empresa.nome}
          </span>
          <span aria-hidden className="h-5 w-px bg-borda" />
          <span className="truncate text-sm font-semibold text-texto">
            {eu.usuario.nome}
          </span>
          <form action={sair}>
            <button
              type="submit"
              className="text-sm text-texto-2 underline-offset-2 hover:text-texto hover:underline"
            >
              Sair
            </button>
          </form>
        </>
      )}
    </header>
  );
}
