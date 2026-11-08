"use client";

import { ErroInesperado } from "@/components/erros-do-sistema";

/** Falha ao montar uma tela do sistema: mantém menu e barra superior e oferece tentar de novo (interface.md §7.3). */
export default function ErroNoSistema({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErroInesperado digest={error.digest} tentarDeNovo={reset} />;
}
