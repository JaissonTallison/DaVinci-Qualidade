import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import {
  TIPOS_INSPECAO,
  type DadosDoUsuario,
  type ModeloDeInspecao,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import {
  aba as estiloDaAba,
  botaoPrimario,
  painel,
  tituloDaPagina,
  trilho,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Modelos de inspeção" };

const AVISOS: Record<string, string> = {
  criado: "Modelo criado. Ele já aparece na escolha ao criar uma inspeção.",
  salvo:
    "Modelo salvo. As inspeções já feitas continuam com os itens de antes.",
  inativado: "Modelo inativado: não aparece mais na escolha.",
  reativado: "Modelo reativado.",
};

export default async function ListaDeModelos({
  searchParams,
}: PageProps<"/qualidade/modelos-de-inspecao">) {
  const { situacao, aviso } = (await searchParams) as {
    situacao?: string;
    aviso?: string;
  };
  const verInativos = situacao === "inativos";
  const [lista, eu] = await Promise.all([
    chamarApi<ModeloDeInspecao[]>(
      `/modelos-de-inspecao?situacao=${verInativos ? "inativos" : "ativos"}`,
    ),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("qualidade.editar");

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Modelos de inspeção</h1>
          <p className="mt-1 max-w-2xl text-base text-texto-2">
            Listas de itens que se repetem. Ao criar a inspeção, os itens são
            copiados: mudar o modelo depois não altera inspeções já feitas.
          </p>
        </div>
        {podeEditar && (
          <Link
            href="/qualidade/modelos-de-inspecao/novo"
            className={botaoPrimario}
          >
            <IconeDaTela href={"/qualidade/modelos-de-inspecao/novo"} />
            Criar modelo
          </Link>
        )}
      </header>
      {aviso && AVISOS[aviso] && (
        <p
          role="status"
          className="mt-4 rounded-sm border border-borda bg-superficie px-4 py-2.5 text-base text-texto"
        >
          {AVISOS[aviso]}
        </p>
      )}

      <nav aria-label="Situação" className={`mt-6 ${trilho}`}>
        <Link
          href="/qualidade/modelos-de-inspecao"
          aria-current={!verInativos ? "page" : undefined}
          className={estiloDaAba(!verInativos)}
        >
          Ativos
        </Link>
        <Link
          href="/qualidade/modelos-de-inspecao?situacao=inativos"
          aria-current={verInativos ? "page" : undefined}
          className={estiloDaAba(verInativos)}
        >
          Inativos
        </Link>
      </nav>

      <section className={`${painel} mt-3`}>
        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : lista.dados.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            {verInativos
              ? "Nenhum modelo inativo."
              : "Nenhum modelo ainda. Crie um para cada lista que se repete, como o recebimento de um material."}
          </p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-superficie-2 text-sm text-texto-2">
              <tr>
                <th className="px-4 py-2 font-semibold">Nome</th>
                <th className="px-4 py-2 font-semibold">Tipo</th>
                <th className="px-4 py-2 font-semibold">Itens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {lista.dados.map((m) => (
                <tr key={m.id} className="">
                  <td className="px-4 py-2">
                    <Link
                      href={`/qualidade/modelos-de-inspecao/${m.id}`}
                      className="font-semibold text-info hover:underline"
                    >
                      {m.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-texto-2">
                    {TIPOS_INSPECAO[m.tipo]}
                  </td>
                  <td className="px-4 py-2 text-texto-2">{m.itens.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
