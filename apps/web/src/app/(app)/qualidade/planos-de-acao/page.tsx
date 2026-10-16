import { ListFilter } from "lucide-react";
import { Pendencias } from "@/components/pendencias";
import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import {
  ORIGENS_PLANO,
  STATUS_PLANO,
  TIPOS_PLANO,
  type DadosDoUsuario,
  type Pagina,
  type PlanoResumo,
  type ResumoPlanos,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { Progresso, StatusDoPlano } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, prazoRelativo } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  campoCompacto,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Planos de ação" };

const FILTROS = ["busca", "status", "origem", "atrasados", "pagina"] as const;

export default async function ListaDePlanos({
  searchParams,
}: PageProps<"/qualidade/planos-de-acao">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number], string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const [lista, resumo, eu] = await Promise.all([
    chamarApi<Pagina<PlanoResumo>>(`/planos-de-acao?${consulta}`),
    chamarApi<ResumoPlanos>("/planos-de-acao/resumo"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("qualidade.editar");
  const filtrando = FILTROS.some((f) => f !== "pagina" && params[f]);

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Planos de ação</h1>
          {resumo.ok && (
            <Pendencias
              itens={[
                { valor: resumo.dados.emExecucao, rotulo: "em execução" },
                {
                  valor: resumo.dados.atrasados,
                  rotulo: "atrasados",
                  singular: "atrasado",
                  alerta: true,
                },
                {
                  valor: resumo.dados.aguardandoEficacia,
                  rotulo: "aguardando eficácia",
                },
              ]}
            />
          )}
        </div>
        {podeCriar && (
          <Link href="/qualidade/planos-de-acao/novo" className={botaoPrimario}>
            <IconeDaTela href={"/qualidade/planos-de-acao/novo"} />
            Criar plano
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
            placeholder="Número ou título"
            aria-label="Buscar por número ou título"
            className={`${campoCompacto} w-56`}
          />
          <SelecaoDeFiltro
            nome="status"
            rotulo="Status"
            opcoes={STATUS_PLANO}
            valor={params.status}
          />
          <SelecaoDeFiltro
            nome="origem"
            rotulo="Origem"
            opcoes={ORIGENS_PLANO}
            valor={params.origem}
          />
          <label className="flex h-9 items-center gap-2 text-base text-texto-2">
            <input
              type="checkbox"
              name="atrasados"
              value="true"
              defaultChecked={params.atrasados === "true"}
              className="size-4 rounded-xs"
            />
            Só atrasados
          </label>
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          {filtrando && (
            <Link
              href="/qualidade/planos-de-acao"
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
              ? "Nenhum plano com esses filtros."
              : "Nenhum plano de ação ainda. Crie um a partir de uma NC ou pelo botão Criar plano."}
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-sm text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Número</th>
                  <th className="px-4 py-2 font-semibold">Título</th>
                  <th className="px-4 py-2 font-semibold">Origem</th>
                  <th className="px-4 py-2 font-semibold">Responsável</th>
                  <th className="px-4 py-2 font-semibold">Progresso</th>
                  <th className="px-4 py-2 font-semibold">Prazo</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.itens.map((p) => {
                  const terminado =
                    p.status === "encerrado" || p.status === "cancelado";
                  return (
                    <tr key={p.id} className="">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <Link
                          href={`/qualidade/planos-de-acao/${p.id}`}
                          className="font-mono text-sm font-medium text-info hover:underline"
                        >
                          {p.numero}
                        </Link>
                      </td>
                      <td className="max-w-md px-4 py-2">
                        <span className="line-clamp-2">{p.titulo}</span>
                        <span className="text-xs text-texto-3">
                          {TIPOS_PLANO[p.tipo]}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-texto-2">
                        {ORIGENS_PLANO[p.origem]}
                        {p.origemRef && (
                          <span className="block font-mono text-xs">
                            {p.origemRef}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-texto-2">
                        {p.responsavel}
                      </td>
                      <td className="px-4 py-2">
                        <Progresso valor={p.progresso} />
                        {!terminado && p.tarefasPendentes > 0 && (
                          <span className="block text-xs text-texto-3">
                            {p.tarefasPendentes}{" "}
                            {p.tarefasPendentes === 1
                              ? "tarefa pendente"
                              : "tarefas pendentes"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatarData(p.prazo)}
                        {!terminado && (
                          <span
                            className={`block text-xs ${p.atrasado ? "text-nao-conforme" : "text-texto-3"}`}
                          >
                            {p.atrasado
                              ? "tarefa vencida"
                              : prazoRelativo(p.prazo)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <StatusDoPlano
                          status={p.status}
                          atrasado={p.atrasado}
                          prazo={p.prazo}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="border-t border-borda px-4 py-2.5 text-sm text-texto-2">
              {lista.dados.total.toLocaleString("pt-BR")}{" "}
              {lista.dados.total === 1 ? "plano" : "planos"}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
