import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  PERIGOS_GHS,
  UNIDADES_PRODUTO,
  type DadosDoUsuario,
  type ProdutoQuimico,
} from "@davinci/types";
import { Anexos } from "@/components/anexos";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { atualizarProduto } from "@/lib/acoes-ambiental";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { FormularioDeProduto } from "../formulario";
import { SituacaoDoProduto } from "./situacao";

export const metadata: Metadata = { title: "Produto químico" };
const AVISOS: Record<string, string> = {
  criado: "Produto cadastrado. Anexe a FDS abaixo.",
  salvo: "Alterações salvas.",
  inativado: "Produto inativado: sai do inventário e dos prazos.",
  reativado: "Produto reativado.",
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
};

export default async function DetalheDoProduto({
  params,
  searchParams,
}: PageProps<"/ambiental/produtos-quimicos/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<ProdutoQuimico>(`/produtos-quimicos/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const p = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const podeEditar = permissoes.includes("ambiental.editar");
  return (
    <article className="max-w-5xl">
      <Link
        href="/ambiental/produtos-quimicos"
        className="text-sm text-texto-2 hover:underline"
      >
        Produtos químicos
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4">
        <span className="text-texto-2">{p.fabricante}</span>
        {p.cas && (
          <span className="font-mono text-sm text-texto-2">CAS {p.cas}</span>
        )}
        {!p.ativo && <span className="text-texto-2">Inativo</span>}
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>{p.nome}</h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <Dado rotulo="Perigos" largo>
            {p.perigos.length
              ? p.perigos.map((x) => PERIGOS_GHS[x]).join(" · ")
              : "Nenhum pictograma na FDS"}
          </Dado>
          <Dado rotulo="Armazenamento">{p.local}</Dado>
          <Dado rotulo="Quantidade máxima">
            {p.quantidadeMaxima !== null
              ? `${p.quantidadeMaxima.toLocaleString("pt-BR")} ${UNIDADES_PRODUTO[p.unidade]}`
              : "Não informada"}
          </Dado>
          <Dado rotulo="FDS">
            <span className={p.fdsVencida ? "text-nao-conforme" : ""}>
              Revisão de {formatarData(p.fdsRevisao)} · conferir até{" "}
              {formatarData(p.proximaRevisaoFds)}
              {p.fdsVencida && " (vencida)"}
            </span>
          </Dado>
        </dl>
      </section>
      <Anexos
        registro="produto_quimico"
        registroId={p.id}
        voltar={`/ambiental/produtos-quimicos/${p.id}`}
        podeEditar={podeEditar}
      />
      {podeEditar && p.ativo && (
        <Recolhido titulo="Editar o produto (nova revisão da FDS, perigos, local)">
          <FormularioDeProduto
            acao={atualizarProduto.bind(null, p.id)}
            produto={p}
          />
        </Recolhido>
      )}
      {permissoes.includes("ambiental.excluir") && (
        <SituacaoDoProduto produto={p} />
      )}
    </article>
  );
}

function Dado({
  rotulo,
  children,
  largo = false,
}: {
  rotulo: string;
  children: ReactNode;
  largo?: boolean;
}) {
  return (
    <div className={largo ? "sm:col-span-3" : ""}>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd className="mt-0.5 text-base whitespace-pre-line">{children}</dd>
    </div>
  );
}
