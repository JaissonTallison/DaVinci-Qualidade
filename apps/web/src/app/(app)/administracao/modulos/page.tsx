import type { Metadata } from "next";
import type { RecursosDaEmpresa } from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeModulos } from "./formulario";

export const metadata: Metadata = { title: "Módulos contratados" };

export default async function Modulos({
  searchParams,
}: PageProps<"/administracao/modulos">) {
  const { aviso } = (await searchParams) as { aviso?: string };
  const r = await chamarApi<RecursosDaEmpresa>("/empresa/recursos");
  return (
    <div className="max-w-4xl">
      <h1 className={tituloDaPagina}>Módulos contratados</h1>
      <p className="mt-1 text-base text-texto-2">
        Módulo desligado some do menu e das permissões. Os dados ficam guardados
        e voltam ao religar.
      </p>
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
