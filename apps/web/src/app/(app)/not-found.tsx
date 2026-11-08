import { ErroNaoEncontrado } from "@/components/erros-do-sistema";

/** `notFound()` dentro do sistema: a tela de erro aparece com o menu e a barra superior (interface.md §7.3). */
export default function NaoEncontradoNoSistema() {
  return <ErroNaoEncontrado />;
}
