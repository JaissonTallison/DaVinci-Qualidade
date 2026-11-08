"use client";

import "./globals.css";
import { ErroInesperado } from "@/components/erros-do-sistema";
import { MolduraIndependente } from "@/components/pagina-de-erro";

/**
 * Falha no próprio layout raiz: o Next troca a página inteira por esta, então ela traz `html` e `body`.
 * Página independente, sem o menu, porque a casca do sistema pode ser o que quebrou (interface.md §7.3).
 */
export default function ErroGeral({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-full flex-col">
        <MolduraIndependente>
          <ErroInesperado digest={error.digest} tentarDeNovo={reset} />
        </MolduraIndependente>
      </body>
    </html>
  );
}
