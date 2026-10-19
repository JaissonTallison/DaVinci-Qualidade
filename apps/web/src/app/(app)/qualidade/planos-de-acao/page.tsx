import { ListChecks, ListFilter } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AcoesDaLinha, itemDeAcao } from "@/components/acoes-da-linha";
import { AtribuirResponsavelEmLote } from "@/components/atribuir-responsavel-em-lote";
import { BotaoExportar } from "@/components/botao-exportar";
import { BuscasSalvas } from "@/components/buscas-salvas";
import { ThOrdenavel, type Ordem } from "@/components/cabecalho-ordenavel";
import { ChipsDeFiltro, type ChipDeFiltro } from "@/components/chips-de-filtro";
import { EstadoVazio } from "@/components/estado-vazio";
import { IconeDaTela } from "@/components/icones-do-menu";
import { Paginacao } from "@/components/paginacao";
import {
  BarraDeSelecao,
  CaixaDeSelecao,
  CaixaSelecionarTodos,
  SelecaoDeLinhas,
} from "@/components/selecao-de-linhas";
import { atribuirResponsavelPlanoEmLote } from "./acoes";
import {
  ORIGENS_PLANO,
  STATUS_PLANO,
  TIPOS_PLANO,
  type DadosDoUsuario,
  type Pagina,
  type PlanoResumo,
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
  subtituloDaPagina,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Planos de ação" };

const BASE = "/qualidade/planos-de-acao";
const FILTROS = [
  "busca",
  "status",
  "origem",
  "atrasados",
  "ordenar",
  "ordem",
  "pagina",
] as const;
const NAO_FILTRAM = new Set(["ordenar", "ordem", "pagina"]);

export default async function ListaDePlanos({
  searchParams,
}: PageProps<"/qualidade/planos-de-acao">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number], string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const [lista, eu] = await Promise.all([
    chamarApi<Pagina<PlanoResumo>>(`/planos-de-acao?${consulta}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("qualidade.editar");
  const filtrando = FILTROS.some((f) => !NAO_FILTRAM.has(f) && params[f]);
  const ordenar = params.ordenar;
  const ordem = params.ordem as Ordem | undefined;

  const semFiltro = (nome: string) => {
    const q = new URLSearchParams(consulta);
    q.delete(nome);
    q.delete("pagina");
    const s = q.toString();
    return s ? `${BASE}?${s}` : BASE;
  };
  const chips: ChipDeFiltro[] = [];
  if (params.busca)
    chips.push({ rotulo: "Busca", valor: params.busca, href: semFiltro("busca") });
  if (params.status)
    chips.push({
      rotulo: "Status",
      valor:
        STATUS_PLANO[params.status as keyof typeof STATUS_PLANO] ??
        params.status,
      href: semFiltro("status"),
    });
  if (params.origem)
    chips.push({
      rotulo: "Origem",
      valor:
        ORIGENS_PLANO[params.origem as keyof typeof ORIGENS_PLANO] ??
        params.origem,
      href: semFiltro("origem"),
    });
  if (params.atrasados === "true")
    chips.push({ rotulo: "Prazo", valor: "Só atrasados", href: semFiltro("atrasados") });

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Planos de ação</h1>
          <p className={subtituloDaPagina}>
            Planos de ação e o acompanhamento de cada prazo e da eficácia.
          </p>
        </div>
        {podeCriar && (
          <Link href={`${BASE}/novo`} className={botaoPrimario}>
            <IconeDaTela href={`${BASE}/novo`} />
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
          <BotaoExportar recurso="planos-de-acao" consulta={consulta} />
          {filtrando && (
            <Link href={BASE} className="h-9 content-center dv-voltar">
              Limpar filtros
            </Link>
          )}
        </form>

        <ChipsDeFiltro itens={chips} />
        <BuscasSalvas />

        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : lista.dados.itens.length === 0 ? (
          <EstadoVazio
            icone={<ListChecks aria-hidden size={40} strokeWidth={1.5} />}
            titulo={
              filtrando
                ? "Nenhum plano com esses filtros."
                : "Nenhum plano de ação ainda."
            }
            descricao={
              filtrando
                ? "Ajuste ou limpe os filtros para ver mais registros."
                : "Crie um plano a partir de uma NC ou pelo botão Criar plano."
            }
            acao={
              filtrando ? (
                <Link href={BASE} className={botaoSecundario}>
                  Limpar filtros
                </Link>
              ) : podeCriar ? (
                <Link href={`${BASE}/novo`} className={botaoPrimario}>
                  <IconeDaTela href={`${BASE}/novo`} />
                  Criar o primeiro plano
                </Link>
              ) : undefined
            }
          />
        ) : (
          <SelecaoDeLinhas>
            <div className="relative overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-superficie-2 text-sm text-texto-2">
                  <tr>
                    <th className="w-10 px-3 py-2">
                      <CaixaSelecionarTodos
                        ids={lista.dados.itens.map((i) => i.id)}
                      />
                    </th>
                    <ThOrdenavel
                      campo="numero"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Número
                    </ThOrdenavel>
                    <ThOrdenavel
                      campo="titulo"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Título
                    </ThOrdenavel>
                    <ThOrdenavel
                      campo="origem"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Origem
                    </ThOrdenavel>
                    <th className="px-4 py-2 font-semibold">Responsável</th>
                    <th className="px-4 py-2 font-semibold">Progresso</th>
                    <th className="px-4 py-2 font-semibold">Prazo</th>
                    <ThOrdenavel
                      campo="status"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Status
                    </ThOrdenavel>
                    <th className="w-10 px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {lista.dados.itens.map((p) => {
                    const terminado =
                      p.status === "encerrado" || p.status === "cancelado";
                    return (
                      <tr key={p.id} className="relative hover:bg-campo">
                        <td className="relative z-10 px-3 py-2">
                          <CaixaDeSelecao
                            id={p.id}
                            rotulo={`Selecionar o plano ${p.numero}`}
                          />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <Link
                            href={`${BASE}/${p.id}`}
                            aria-label={`Abrir o plano ${p.numero}`}
                            className="font-mono text-sm font-medium text-info after:absolute after:inset-0 after:content-[''] hover:underline"
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
                        <td className="relative z-10 px-2 py-2 text-right">
                          <AcoesDaLinha rotulo={`Ações do plano ${p.numero}`}>
                            <Link href={`${BASE}/${p.id}`} className={itemDeAcao}>
                              Abrir
                            </Link>
                            <a
                              href={`${BASE}/${p.id}`}
                              target="_blank"
                              rel="noopener"
                              className={itemDeAcao}
                            >
                              Abrir em nova aba
                            </a>
                          </AcoesDaLinha>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Paginacao
              pagina={lista.dados}
              base={BASE}
              consulta={consulta}
              rotulo={["plano", "planos"]}
            />
            <BarraDeSelecao
              recurso="planos-de-acao"
              rotulo={["plano selecionado", "planos selecionados"]}
            >
              {podeCriar && (
                <AtribuirResponsavelEmLote
                  acao={atribuirResponsavelPlanoEmLote}
                />
              )}
            </BarraDeSelecao>
          </SelecaoDeLinhas>
        )}
      </section>
    </>
  );
}
