import type { Metadata } from "next";
import Link from "next/link";
import type { Pagina, ParceiroResumo } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { botaoLink, tituloDaPagina } from "@/lib/estilos";
import { FormularioDeOs } from "./formulario";

export const metadata: Metadata = { title: "Abrir ordem de serviço" };

export default async function NovaOs() {
  const clientes = await chamarApi<Pagina<ParceiroResumo>>(
    "/parceiros?papel=cliente&porPagina=100",
  );
  return (
    <>
      <Link
        href="/servicos/ordens"
        className="text-sm text-texto-2 hover:underline"
      >
        Ordens de serviço
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Abrir ordem de serviço</h1>
      {!clientes.ok ? (
        <div className="mt-6">
          <AvisoDeErro erro={clientes.erro} />
        </div>
      ) : clientes.dados.itens.length === 0 ? (
        <p className="mt-6 text-base text-texto-2">
          Nenhum cliente cadastrado.{" "}
          <Link
            href="/cadastros/clientes-e-fornecedores/novo"
            className={botaoLink}
          >
            Cadastre o cliente
          </Link>{" "}
          antes.
        </p>
      ) : (
        <FormularioDeOs clientes={clientes.dados.itens} />
      )}
    </>
  );
}
