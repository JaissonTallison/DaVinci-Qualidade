import type { Metadata } from "next";
import Link from "next/link";
import { ListFilter, Plus } from "@/components/icones";
import {
  formatarDocumento,
  type DadosDoUsuario,
  type Pagina,
  type ParceiroResumo,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { chamarApi } from "@/lib/api";
import { campoCompacto, painel } from "@/lib/estilos";
import { Botao } from "@/components/botao";
import { CabecalhoDaPagina } from "@/components/cabecalho-da-pagina";

export const metadata: Metadata = { title: "Clientes e fornecedores" };

const PAPEL: Record<string, string> = {
  cliente: "Cliente",
  fornecedor: "Fornecedor",
};

export default async function Parceiros({
  searchParams,
}: PageProps<"/cadastros/clientes-e-fornecedores">) {
  const params = (await searchParams) as {
    busca?: string;
    papel?: string;
    situacao?: string;
  };
  const consulta = new URLSearchParams({ porPagina: "100" });
  if (params.busca) consulta.set("busca", params.busca);
  if (params.papel) consulta.set("papel", params.papel);
  if (params.situacao) consulta.set("situacao", params.situacao);
  const [lista, eu] = await Promise.all([
    chamarApi<Pagina<ParceiroResumo>>(`/parceiros?${consulta}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("parceiros.editar");
  return (
    <>
      <CabecalhoDaPagina
        titulo="Clientes e fornecedores"
        descricao="Um cadastro só para o sistema todo: ordens de serviço, pesquisas de satisfação e avaliação de fornecedores usam esta lista."
        acoes={
          podeCriar && (
            <Botao
              href="/cadastros/clientes-e-fornecedores/novo"
              variante="primario"
              tamanho="grande"
              icone={Plus}
            >
              Cadastrar cliente ou fornecedor
            </Botao>
          )
        }
      />
      <section className={`${painel} mt-6`}>
        <form
          className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3"
          role="search"
        >
          <input
            name="busca"
            defaultValue={params.busca}
            placeholder="Nome, CNPJ ou CPF"
            aria-label="Buscar"
            className={`${campoCompacto} w-64`}
          />
          <SelecaoDeFiltro
            nome="papel"
            rotulo="Papel"
            opcoes={PAPEL}
            valor={params.papel}
          />
          <SelecaoDeFiltro
            nome="situacao"
            rotulo="Situação"
            opcoes={{ inativos: "Inativos", todos: "Todos" }}
            valor={params.situacao}
          />
          <Botao type="submit" icone={ListFilter}>
            Filtrar
          </Botao>
        </form>
        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : lista.dados.itens.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            Nenhum cadastro{consulta.size > 1 ? " com esses filtros" : ""}.
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-xs uppercase tracking-[0.04em] text-texto-2">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Nome</th>
                  <th className="px-4 py-2.5 font-semibold">CNPJ ou CPF</th>
                  <th className="px-4 py-2.5 font-semibold">Papel</th>
                  <th className="px-4 py-2.5 font-semibold">Cidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.itens.map((p) => (
                  <tr key={p.id} className="">
                    <td className="px-4 py-3">
                      <Link
                        href={`/cadastros/clientes-e-fornecedores/${p.id}`}
                        className="font-medium text-info hover:underline"
                      >
                        {p.nomeFantasia ?? p.nome}
                      </Link>
                      {p.nomeFantasia && (
                        <span className="block text-xs text-texto-3">
                          {p.nome}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm whitespace-nowrap">
                      {formatarDocumento(p.documento)}
                    </td>
                    <td className="px-4 py-3 text-texto-2">
                      {p.papeis
                        .filter((x) => PAPEL[x])
                        .map((x) => PAPEL[x])
                        .join(" e ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-texto-2">
                      {p.cidade ? `${p.cidade}/${p.uf}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-borda px-4 py-2.5 text-sm text-texto-2">
              {lista.dados.total}{" "}
              {lista.dados.total === 1 ? "cadastro" : "cadastros"}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
