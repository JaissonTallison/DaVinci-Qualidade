import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import type {
  DadosDoUsuario,
  ModeloDeInspecao,
  Pagina,
  ParceiroResumo,
} from "@davinci/types";
import { chamarApi } from "@/lib/api";
import { hojeEmBrasilia } from "@/lib/datas";
import { FormularioNovaInspecao } from "./formulario";

export const metadata: Metadata = { title: "Nova inspeção" };

export default async function NovaInspecao() {
  const [modelos, eu] = await Promise.all([
    chamarApi<ModeloDeInspecao[]>("/modelos-de-inspecao"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const fornecedores =
    eu.ok && eu.dados.permissoes.includes("parceiros.ver")
      ? await chamarApi<Pagina<ParceiroResumo>>(
          "/parceiros?papel=fornecedor&porPagina=100",
        )
      : null;
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{ href: "/qualidade/inspecoes", rotulo: "Inspeções" }}
        titulo="Nova inspeção"
        descricao="Identifique o que está sendo inspecionado. Os itens vêm do modelo escolhido; em seguida, responda cada um como OK, NOK ou N/A."
      />
      <FormularioNovaInspecao
        modelos={modelos.ok ? modelos.dados : []}
        hoje={hojeEmBrasilia()}
        inspetor={eu.ok ? eu.dados.usuario.nome : ""}
        fornecedores={fornecedores?.ok ? fornecedores.dados.itens : []}
      />
    </>
  );
}
