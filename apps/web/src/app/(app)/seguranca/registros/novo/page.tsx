import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { TIPOS_REGISTRO_SST, type TipoRegistroSst } from "@davinci/types";
import { FormularioDeRegistro } from "./formulario";

export const metadata: Metadata = { title: "Novo registro de segurança" };

export default async function NovoRegistro({
  searchParams,
}: PageProps<"/seguranca/registros/novo">) {
  const { tipo } = (await searchParams) as { tipo?: string };
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{
          href: "/seguranca/registros",
          rotulo: "Registros de segurança",
        }}
        titulo="Novo registro"
      />
      <FormularioDeRegistro
        tipoInicial={
          tipo && tipo in TIPOS_REGISTRO_SST
            ? (tipo as TipoRegistroSst)
            : undefined
        }
      />
    </>
  );
}
