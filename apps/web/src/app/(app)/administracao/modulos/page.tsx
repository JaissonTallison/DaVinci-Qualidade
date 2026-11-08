import type { Metadata } from "next";
import type { RecursosDaEmpresa } from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { FormularioDeModulos } from "./formulario";
import { CabecalhoDaPagina } from "@/components/cabecalho-da-pagina";

export const metadata: Metadata = { title: "Módulos contratados" };

export default async function Modulos({
  searchParams,
}: PageProps<"/administracao/modulos">) {
  const { aviso } = (await searchParams) as { aviso?: string };
  const r = await chamarApi<RecursosDaEmpresa>("/empresa/recursos");
  return (
    <div className="w-full">
      <CabecalhoDaPagina
        titulo="Módulos contratados"
        descricao="Módulo desligado some do menu e das permissões. Os dados ficam guardados e voltam ao religar."
      />
      <Aviso
        avisos={{
          salvo:
            "Módulos salvos. O menu muda no próximo carregamento da página.",
        }}
        chave={aviso}
      />
      {r.ok ? (
        <FormularioDeModulos ligados={r.dados.ligados} />
      ) : (
        <div className="mt-6">
          <AvisoDeErro erro={r.erro} />
        </div>
      )}
    </div>
  );
}
