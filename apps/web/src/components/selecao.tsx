import type { ComponentProps } from "react";

/**
 * `<select>` de formulário com Server Action. Depois da ação, o React 19 reseta o formulário, e um select só
 * pega o `defaultValue` na montagem: sem isto, ele voltava para "Escolha" a cada erro de validação.
 * A chave remonta o select quando o valor inicial muda (docs/01-engenharia/armadilhas.md).
 */
export function Selecao(props: ComponentProps<"select">) {
  return <select key={String(props.defaultValue ?? "")} {...props} />;
}
