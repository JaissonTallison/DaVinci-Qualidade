import type { Metadata } from "next";
import Link from "next/link";
import type {
  Contrato,
  Pagina,
  ParceiroResumo,
  ServicoDoCatalogo,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { botaoLink, tituloDaPagina } from "@/lib/estilos";
import { FormularioDeOs } from "./formulario";

export const metadata: Metadata = { title: "Abrir ordem de serviço" };

export default async function NovaOs() {
  const [clientes, contratos, catalogo] = await Promise.all([
    chamarApi<Pagina<ParceiroResumo>>("/parceiros?papel=cliente&porPagina=100"),
    chamarApi<Contrato[]>("/contratos"),
    chamarApi<ServicoDoCatalogo[]>("/catalogo-de-servicos"),
  ]);
  return (
    <>
      <Link
        href="/servicos/ordens"
        className="dv-voltar"
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
        <FormularioDeOs
          clientes={clientes.dados.itens}
          contratos={
            contratos.ok
              ? contratos.dados.filter(
                  (c) =>
                    c.situacao === "vigente" || c.situacao === "vence_em_breve",
                )
              : []
          }
          catalogo={catalogo.ok ? catalogo.dados.filter((c) => c.ativo) : []}
        />
      )}
    </>
  );
}
