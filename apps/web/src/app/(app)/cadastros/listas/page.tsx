import type { Metadata } from "next";
import {
  LISTAS_CADASTRO,
  type DadosDoUsuario,
  type ItemDeLista,
  type ListaCadastro,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi, type Resultado } from "@/lib/api";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import { FormularioDoItem, SituacaoDoItem } from "./acoes";

export const metadata: Metadata = { title: "Listas de cadastro" };

const AVISOS: Record<string, string> = {
  "processo-criado": "Processo cadastrado.",
  "processo-salvo": "Processo salvo.",
  "processo-inativado": "Processo inativado: sai da escolha nos registros.",
  "processo-ativado": "Processo reativado.",
  "causa_nc-criado": "Tipo de causa cadastrado.",
  "causa_nc-salvo": "Tipo de causa salvo.",
  "causa_nc-inativado": "Tipo de causa inativado: sai da escolha nos registros.",
  "causa_nc-ativado": "Tipo de causa reativado.",
};

const LISTAS = Object.keys(LISTAS_CADASTRO) as ListaCadastro[];

export default async function ListasDeCadastro({
  searchParams,
}: PageProps<"/cadastros/listas">) {
  const { aviso } = (await searchParams) as { aviso?: string };
  const [eu, ...dados] = await Promise.all([
    chamarApi<DadosDoUsuario>("/auth/eu"),
    ...LISTAS.map((l) =>
      chamarApi<ItemDeLista[]>(`/listas/${l}?situacao=todos`),
    ),
  ]);
  const podeEditar =
    eu.ok && eu.dados.permissoes.includes("funcionarios.editar");

  return (
    <>
      <h1 className={tituloDaPagina}>Listas de cadastro</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Listas que a empresa mantém e seleciona nos registros (em vez de
        digitar). Em uso, o item não se apaga: inative-o.
      </p>
      <Aviso avisos={AVISOS} chave={aviso} />
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        {LISTAS.map((lista, i) => (
          <Lista
            key={lista}
            lista={lista}
            itens={dados[i]!}
            podeEditar={podeEditar}
          />
        ))}
      </div>
    </>
  );
}

function Lista({
  lista,
  itens,
  podeEditar,
}: {
  lista: ListaCadastro;
  itens: Resultado<ItemDeLista[]>;
  podeEditar: boolean;
}) {
  return (
    <section className={painel}>
      <h2 className={`${tituloDaSecao} px-4 pt-4`}>
        {LISTAS_CADASTRO[lista].plural}
      </h2>
      {podeEditar && (
        <div className="border-b border-borda px-4 pt-3 pb-4">
          <FormularioDoItem lista={lista} />
        </div>
      )}
      {!itens.ok ? (
        <div className="p-4">
          <AvisoDeErro erro={itens.erro} />
        </div>
      ) : itens.dados.length === 0 ? (
        <p className="px-4 py-6 text-base text-texto-2">Nenhum item ainda.</p>
      ) : (
        <ul className="divide-y divide-borda">
          {itens.dados.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <p className={`text-base ${item.ativo ? "" : "text-texto-3"}`}>
                {item.nome}
                {!item.ativo && (
                  <span className="ml-2 text-sm text-texto-2">· Inativo</span>
                )}
              </p>
              {podeEditar && (
                <div className="flex items-start gap-3">
                  {item.ativo && (
                    <details className="relative">
                      <summary className="h-8 cursor-pointer list-none content-center text-sm text-texto-2 hover:text-texto hover:underline">
                        Renomear
                      </summary>
                      <div className="absolute right-0 z-10 mt-1 w-80 rounded-md border border-borda bg-superficie p-3 shadow-sm">
                        <FormularioDoItem lista={lista} item={item} />
                      </div>
                    </details>
                  )}
                  <SituacaoDoItem lista={lista} item={item} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
