import { ListFilter } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import type {
  DadosDoUsuario,
  FuncionarioResumo,
  Pagina,
  SetorDaEmpresa,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  campoCompacto,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Funcionários" };

const FILTROS = ["busca", "setorId", "situacao", "pagina"] as const;
const SITUACOES = {
  ativos: "Ativos",
  desligados: "Desligados",
  todos: "Todos",
};

export default async function ListaDeFuncionarios({
  searchParams,
}: PageProps<"/cadastros/funcionarios">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number], string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const [lista, setores, eu] = await Promise.all([
    chamarApi<Pagina<FuncionarioResumo>>(`/funcionarios?${consulta}`),
    chamarApi<SetorDaEmpresa[]>("/setores-da-empresa?situacao=todos"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar =
    eu.ok && eu.dados.permissoes.includes("funcionarios.editar");
  const filtrando = Boolean(
    params.busca ||
    params.setorId ||
    (params.situacao && params.situacao !== "ativos"),
  );

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Funcionários</h1>
          <p className="mt-1 max-w-2xl text-base text-texto-2">
            O cadastro que a segurança do trabalho usa: entregas de EPI,
            treinamentos e exames saem daqui.
          </p>
        </div>
        {podeCriar && (
          <Link href="/cadastros/funcionarios/novo" className={botaoPrimario}>
            <IconeDaTela href={"/cadastros/funcionarios/novo"} />
            Cadastrar funcionário
          </Link>
        )}
      </header>

      <section className={`${painel} mt-6`}>
        <form
          className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3"
          role="search"
        >
          <input
            name="busca"
            defaultValue={params.busca}
            placeholder="Nome, matrícula ou CPF"
            aria-label="Buscar por nome, matrícula ou CPF"
            className={`${campoCompacto} w-64`}
          />
          <select
            name="setorId"
            defaultValue={params.setorId ?? ""}
            aria-label="Setor"
            className={campoCompacto}
          >
            <option value="">Setor: todos</option>
            {setores.ok &&
              setores.dados.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                  {s.ativo ? "" : " (inativo)"}
                </option>
              ))}
          </select>
          <select
            name="situacao"
            defaultValue={params.situacao ?? "ativos"}
            aria-label="Situação"
            className={campoCompacto}
          >
            {Object.entries(SITUACOES).map(([chave, nome]) => (
              <option key={chave} value={chave}>
                {nome}
              </option>
            ))}
          </select>
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          {filtrando && (
            <Link
              href="/cadastros/funcionarios"
              className="h-9 content-center text-sm text-texto-2 hover:underline"
            >
              Limpar filtros
            </Link>
          )}
        </form>
        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : lista.dados.itens.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            {filtrando
              ? "Nenhum funcionário com esses filtros."
              : "Nenhum funcionário cadastrado. Cadastre primeiro os setores e as funções da empresa."}
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-sm text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Matrícula</th>
                  <th className="px-4 py-2 font-semibold">Nome</th>
                  <th className="px-4 py-2 font-semibold">Setor</th>
                  <th className="px-4 py-2 font-semibold">Função</th>
                  <th className="px-4 py-2 font-semibold">Admissão</th>
                  <th className="px-4 py-2 font-semibold">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.itens.map((f) => (
                  <tr key={f.id} className="">
                    <td className="px-4 py-2 font-mono text-sm whitespace-nowrap">
                      {f.matricula}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/cadastros/funcionarios/${f.id}`}
                        className="font-medium text-info hover:underline"
                      >
                        {f.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-texto-2">{f.setorNome}</td>
                    <td className="px-4 py-2 text-texto-2">{f.funcaoNome}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatarData(f.admissao)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {f.ativo ? (
                        "Ativo"
                      ) : (
                        <span className="text-texto-2">
                          Desligado
                          {f.desligamento &&
                            ` em ${formatarData(f.desligamento)}`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-borda px-4 py-2.5 text-sm text-texto-2">
              {lista.dados.total.toLocaleString("pt-BR")}{" "}
              {lista.dados.total === 1 ? "funcionário" : "funcionários"}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
