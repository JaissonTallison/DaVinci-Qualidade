import { ClipboardList, ListFilter } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AcoesDaLinha, itemDeAcao } from "@/components/acoes-da-linha";
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
import {
  GRAVIDADES_NC,
  ORIGENS_NC,
  STATUS_NC,
  type DadosDoUsuario,
  type NaoConformidadeResumo,
  type Pagina,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { GravidadeDaNc, StatusDaNc } from "@/components/marcadores";
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

export const metadata: Metadata = { title: "Não conformidades" };

const BASE = "/qualidade/nao-conformidades";
const FILTROS = [
  "busca",
  "status",
  "gravidade",
  "origem",
  "vencidas",
  "ordenar",
  "ordem",
  "pagina",
] as const;
const NAO_FILTRAM = new Set(["ordenar", "ordem", "pagina"]);

export default async function ListaDeNcs({
  searchParams,
}: PageProps<"/qualidade/nao-conformidades">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number], string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const [lista, eu] = await Promise.all([
    chamarApi<Pagina<NaoConformidadeResumo>>(`${BASE}?${consulta}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeAbrir = eu.ok && eu.dados.permissoes.includes("qualidade.editar");
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
      valor: STATUS_NC[params.status as keyof typeof STATUS_NC] ?? params.status,
      href: semFiltro("status"),
    });
  if (params.gravidade)
    chips.push({
      rotulo: "Gravidade",
      valor:
        GRAVIDADES_NC[params.gravidade as keyof typeof GRAVIDADES_NC] ??
        params.gravidade,
      href: semFiltro("gravidade"),
    });
  if (params.origem)
    chips.push({
      rotulo: "Origem",
      valor: ORIGENS_NC[params.origem as keyof typeof ORIGENS_NC] ?? params.origem,
      href: semFiltro("origem"),
    });
  if (params.vencidas === "true")
    chips.push({ rotulo: "Prazo", valor: "Só vencidas", href: semFiltro("vencidas") });

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Não conformidades</h1>
          <p className={subtituloDaPagina}>
            Não conformidades registradas e o andamento do tratamento de cada
            uma.
          </p>
        </div>
        {podeAbrir && (
          <Link href={`${BASE}/nova`} className={botaoPrimario}>
            <IconeDaTela href={`${BASE}/nova`} />
            Abrir NC
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
            opcoes={STATUS_NC}
            valor={params.status}
          />
          <SelecaoDeFiltro
            nome="gravidade"
            rotulo="Gravidade"
            opcoes={GRAVIDADES_NC}
            valor={params.gravidade}
          />
          <SelecaoDeFiltro
            nome="origem"
            rotulo="Origem"
            opcoes={ORIGENS_NC}
            valor={params.origem}
          />
          <label className="flex h-9 items-center gap-2 text-base text-texto-2">
            <input
              type="checkbox"
              name="vencidas"
              value="true"
              defaultChecked={params.vencidas === "true"}
              className="size-4 rounded-xs"
            />
            Só vencidas
          </label>
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          <BotaoExportar recurso="nao-conformidades" consulta={consulta} />
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
            icone={<ClipboardList aria-hidden size={40} strokeWidth={1.5} />}
            titulo={
              filtrando
                ? "Nenhuma NC com esses filtros."
                : "Nenhuma não conformidade registrada."
            }
            descricao={
              filtrando
                ? "Ajuste ou limpe os filtros para ver mais registros."
                : "Quando uma inspeção, auditoria ou reclamação apontar um problema, abra a NC aqui."
            }
            acao={
              filtrando ? (
                <Link href={BASE} className={botaoSecundario}>
                  Limpar filtros
                </Link>
              ) : podeAbrir ? (
                <Link href={`${BASE}/nova`} className={botaoPrimario}>
                  <IconeDaTela href={`${BASE}/nova`} />
                  Abrir a primeira NC
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
                    <th className="px-4 py-2 font-semibold">Gravidade</th>
                    <th className="px-4 py-2 font-semibold">Responsável</th>
                    <ThOrdenavel
                      campo="prazo"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Prazo
                    </ThOrdenavel>
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
                  {lista.dados.itens.map((nc) => {
                    const terminada =
                      nc.status === "encerrada" || nc.status === "cancelada";
                    return (
                      <tr key={nc.id} className="relative hover:bg-campo">
                        <td className="relative z-10 px-3 py-2">
                          <CaixaDeSelecao
                            id={nc.id}
                            rotulo={`Selecionar a NC ${nc.numero}`}
                          />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <Link
                            href={`${BASE}/${nc.id}`}
                            aria-label={`Abrir a NC ${nc.numero}`}
                            className="font-mono text-sm font-medium text-info after:absolute after:inset-0 after:content-[''] hover:underline"
                          >
                            {nc.numero}
                          </Link>
                        </td>
                        <td className="max-w-md px-4 py-2">
                          <span className="line-clamp-2">{nc.titulo}</span>
                          {nc.ciclos >= 2 && (
                            <span className="text-xs text-atencao">
                              Reincidente: {nc.ciclos}º ciclo
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-texto-2">
                          {ORIGENS_NC[nc.origem]}
                        </td>
                        <td className="px-4 py-2">
                          <GravidadeDaNc gravidade={nc.gravidade} />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-texto-2">
                          {nc.responsavel}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {formatarData(nc.prazo)}
                          {!terminada && (
                            <span
                              className={`block text-xs ${nc.vencida ? "text-nao-conforme" : "text-texto-3"}`}
                            >
                              {prazoRelativo(nc.prazo)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <StatusDaNc
                            status={nc.status}
                            vencida={nc.vencida}
                            prazo={nc.prazo}
                          />
                        </td>
                        <td className="relative z-10 px-2 py-2 text-right">
                          <AcoesDaLinha rotulo={`Ações da NC ${nc.numero}`}>
                            <Link href={`${BASE}/${nc.id}`} className={itemDeAcao}>
                              Abrir
                            </Link>
                            <a
                              href={`${BASE}/${nc.id}`}
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
              rotulo={["NC", "NCs"]}
            />
            <BarraDeSelecao
              recurso="nao-conformidades"
              rotulo={["NC selecionada", "NCs selecionadas"]}
            />
          </SelecaoDeLinhas>
        )}
      </section>
    </>
  );
}
