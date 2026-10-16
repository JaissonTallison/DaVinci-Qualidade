import type { Metadata } from "next";
import type { DadosDoUsuario, Funcao, SetorDaEmpresa } from "@davinci/types";
import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi, type Resultado } from "@/lib/api";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import { FormularioDeEstrutura, SituacaoDaEstrutura } from "./acoes";

export const metadata: Metadata = { title: "Setores e funções" };

const AVISOS: Record<string, string> = {
  "setor-criado": "Setor cadastrado.",
  "setor-salvo": "Setor salvo.",
  "setor-inativado":
    "Setor inativado: ele sai da escolha no cadastro de funcionários.",
  "setor-ativado": "Setor reativado.",
  "funcao-criado": "Função cadastrada.",
  "funcao-salvo": "Função salva.",
  "funcao-inativado":
    "Função inativada: ela sai da escolha no cadastro de funcionários.",
  "funcao-ativado": "Função reativada.",
};

export default async function SetoresEFuncoes({
  searchParams,
}: PageProps<"/cadastros/setores-e-funcoes">) {
  const { aviso } = (await searchParams) as { aviso?: string };
  const [setores, funcoes, eu] = await Promise.all([
    chamarApi<SetorDaEmpresa[]>("/setores-da-empresa?situacao=todos"),
    chamarApi<Funcao[]>("/funcoes?situacao=todos"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar =
    eu.ok && eu.dados.permissoes.includes("funcionarios.editar");

  return (
    <>
      <h1 className={tituloDaPagina}>Setores e funções</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Todo funcionário tem um setor e uma função. Com funcionário ativo, o
        setor ou a função não se inativa: mude as pessoas antes.
      </p>
      <Aviso avisos={AVISOS} chave={aviso} />
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <Lista
          tipo="setor"
          titulo="Setores"
          lista={setores}
          podeEditar={podeEditar}
        />
        <Lista
          tipo="funcao"
          titulo="Funções"
          lista={funcoes}
          podeEditar={podeEditar}
        />
      </div>
    </>
  );
}

function Lista({
  tipo,
  titulo,
  lista,
  podeEditar,
}: {
  tipo: "setor" | "funcao";
  titulo: string;
  lista: Resultado<(SetorDaEmpresa | Funcao)[]>;
  podeEditar: boolean;
}) {
  return (
    <section className={painel}>
      <h2 className={`${tituloDaSecao} px-4 pt-4`}>{titulo}</h2>
      {podeEditar && (
        <div className="border-b border-borda px-4 pt-3 pb-4">
          <FormularioDeEstrutura tipo={tipo} />
        </div>
      )}
      {!lista.ok ? (
        <div className="p-4">
          <AvisoDeErro erro={lista.erro} />
        </div>
      ) : lista.dados.length === 0 ? (
        <p className="px-4 py-6 text-base text-texto-2">
          {tipo === "setor"
            ? "Nenhum setor cadastrado."
            : "Nenhuma função cadastrada."}
        </p>
      ) : (
        <ul className="divide-y divide-borda">
          {lista.dados.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
            >
              <div className={item.ativo ? "" : "text-texto-3"}>
                <p className="text-base">
                  {item.nome}
                  {"cbo" in item && item.cbo && (
                    <span className="ml-2 font-mono text-sm text-texto-2">
                      CBO {item.cbo.slice(0, 4)}-{item.cbo.slice(4)}
                    </span>
                  )}
                </p>
                <p className="text-sm text-texto-2">
                  {item.ativo ? "" : "Inativo · "}
                  {item.funcionariosAtivos}{" "}
                  {item.funcionariosAtivos === 1
                    ? "funcionário ativo"
                    : "funcionários ativos"}
                </p>
              </div>
              {tipo === "funcao" && item.ativo && (
                <Link
                  href={`/cadastros/setores-e-funcoes/${item.id}`}
                  className="h-8 content-center text-sm text-info hover:underline"
                >
                  Competências
                </Link>
              )}
              {podeEditar && (
                <div className="flex items-start gap-3">
                  {item.ativo && (
                    <details className="relative">
                      <summary className="h-8 cursor-pointer list-none content-center text-sm text-texto-2 hover:text-texto hover:underline">
                        Renomear
                      </summary>
                      <div className="absolute right-0 z-10 mt-1 w-80 rounded-md border border-borda bg-superficie p-3 shadow-sm">
                        <FormularioDeEstrutura tipo={tipo} item={item} />
                      </div>
                    </details>
                  )}
                  <SituacaoDaEstrutura tipo={tipo} item={item} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
