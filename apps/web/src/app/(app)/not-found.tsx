import { ErroNaoEncontrado } from "@/components/erros-do-sistema";

/** `notFound()` dentro do sistema: a tela de erro aparece com o menu e a barra superior (interface.md §7.3). */
export default function NaoEncontradoNoSistema() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <ErroNaoEncontrado />
    </div>
  );
}
