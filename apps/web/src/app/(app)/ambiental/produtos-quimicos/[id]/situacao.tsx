"use client";

import type { ProdutoQuimico } from "@davinci/types";
import { Formulario, Recolhido } from "@/components/formulario-de-acao";
import { situacaoDoProduto } from "@/lib/acoes-ambiental";

/** Inativar tira o produto do inventário sem apagar o histórico. Gestor (ambiental.excluir). */
export function SituacaoDoProduto({ produto }: { produto: ProdutoQuimico }) {
  return (
    <Recolhido
      titulo={produto.ativo ? "Inativar o produto" : "Reativar o produto"}
    >
      <p className="text-base text-texto-2">
        {produto.ativo
          ? "Use quando a empresa deixou de usar o produto. O registro e a FDS ficam guardados."
          : "Volta para o inventário e para os prazos de revisão da FDS."}
      </p>
      <Formulario
        acao={situacaoDoProduto.bind(null, produto.id, !produto.ativo)}
        versao={produto.versao}
        rotuloDoBotao={produto.ativo ? "Inativar" : "Reativar"}
        perigo={produto.ativo}
      >
        {() => null}
      </Formulario>
    </Recolhido>
  );
}
