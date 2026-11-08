import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { FormularioDaProgramacao } from "../formulario";

export const metadata: Metadata = { title: "Novo item da programação" };

export default async function NovoItemDaProgramacao({
  searchParams,
}: PageProps<"/auditorias/programacao/nova">) {
  const { ano } = (await searchParams) as { ano?: string };
  const anoInicial = Number(ano) || new Date().getFullYear();
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{
          href: "/auditorias/programacao",
          rotulo: "Programação de auditorias",
        }}
        titulo="Adicionar à programação"
        descricao="Planeje quando cada setor ou processo será auditado no ano e por qual norma."
      />
      <FormularioDaProgramacao ano={anoInicial} />
    </>
  );
}
