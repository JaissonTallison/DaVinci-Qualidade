import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatarDocumento,
  type DadosDoUsuario,
  type Parceiro,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { FormularioDeParceiro } from "../formulario";
import { SituacaoDoParceiro } from "./situacao";

export const metadata: Metadata = { title: "Cliente ou fornecedor" };
const AVISOS: Record<string, string> = {
  criado: "Cadastro criado.",
  salvo: "Cadastro salvo.",
  inativado: "Cadastro inativado.",
  reativado: "Cadastro reativado.",
};
const PAPEL: Record<string, string> = {
  cliente: "Cliente",
  fornecedor: "Fornecedor",
  transportadora: "Transportadora",
  representante: "Representante",
  colaborador: "Colaborador",
};

export default async function DetalheDoParceiro({
  params,
  searchParams,
}: PageProps<"/cadastros/clientes-e-fornecedores/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Parceiro>(`/parceiros/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const p = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  return (
    <article>
      <Link
        href="/cadastros/clientes-e-fornecedores"
        className="text-sm text-texto-2 hover:underline"
      >
        Clientes e fornecedores
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4">
        <span className="font-mono text-lg text-texto-2">
          {formatarDocumento(p.documento)}
        </span>
        <span className="text-texto-2">
          {p.papeis.map((x) => PAPEL[x] ?? x).join(" e ")}
          {p.ativo ? "" : " · Inativo"}
        </span>
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>{p.nomeFantasia ?? p.nome}</h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <dt className="text-xs text-texto-2">Razão social ou nome</dt>
            <dd className="mt-0.5">{p.nome}</dd>
          </div>
          {p.email && (
            <div>
              <dt className="text-xs text-texto-2">E-mail</dt>
              <dd className="mt-0.5">{p.email}</dd>
            </div>
          )}
          {p.telefone && (
            <div>
              <dt className="text-xs text-texto-2">Telefone</dt>
              <dd className="mt-0.5">{p.telefone}</dd>
            </div>
          )}
          {p.observacoes && (
            <div className="sm:col-span-3">
              <dt className="text-xs text-texto-2">Observações</dt>
              <dd className="mt-0.5 whitespace-pre-line">{p.observacoes}</dd>
            </div>
          )}
        </dl>
      </section>
      {p.ativo && permissoes.includes("parceiros.editar") && (
        <Recolhido titulo="Editar cadastro">
          <FormularioDeParceiro parceiro={p} embutido />
        </Recolhido>
      )}
      {permissoes.includes("parceiros.inativar") && (
        <SituacaoDoParceiro parceiro={p} />
      )}
    </article>
  );
}
