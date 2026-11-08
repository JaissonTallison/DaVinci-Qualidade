import { ErroNaoEncontrado } from "@/components/erros-do-sistema";
import { MolduraIndependente } from "@/components/pagina-de-erro";

/** Endereço que não existe em nenhuma rota: página independente, com a logo e sem o menu (interface.md §7.3). */
export default function NaoEncontrado() {
  return (
    <MolduraIndependente>
      <ErroNaoEncontrado />
    </MolduraIndependente>
  );
}
