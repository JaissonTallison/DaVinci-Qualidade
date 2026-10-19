import { HardHat, ListFilter } from "lucide-react";
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
  STATUS_PT,
  TIPOS_PT,
  type DadosDoUsuario,
  type Pagina,
  type PermissaoDeTrabalho,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { StatusDaPt } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import {
  botaoPrimario,
  botaoSecundario,
  painel,
  subtituloDaPagina,
  tituloDaPagina,
} from "@/lib/estilos";
import { periodoDaPt } from "./periodo";

export const metadata: Metadata = { title: "Permissões de trabalho" };

const BASE = "/seguranca/permissoes-de-trabalho";
const FILTROS = ["status", "tipo", "ordenar", "ordem", "pagina"] as const;
const NAO_FILTRAM = new Set(["ordenar", "ordem", "pagina"]);

export default async function PermissoesDeTrabalho({
  searchParams,
}: PageProps<"/seguranca/permissoes-de-trabalho">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number], string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const [lista, eu] = await Promise.all([
    chamarApi<Pagina<PermissaoDeTrabalho>>(
      `/permissoes-de-trabalho?${consulta}`,
    ),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("seguranca.editar");
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
  if (params.status)
    chips.push({
      rotulo: "Status",
      valor: STATUS_PT[params.status as keyof typeof STATUS_PT] ?? params.status,
      href: semFiltro("status"),
    });
  if (params.tipo)
    chips.push({
      rotulo: "Tipo",
      valor: TIPOS_PT[params.tipo as keyof typeof TIPOS_PT] ?? params.tipo,
      href: semFiltro("tipo"),
    });

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Permissões de trabalho</h1>
          <p className={subtituloDaPagina}>
            Permissões de trabalho e a situação de cada liberação.
          </p>
        </div>
        {podeCriar && (
          <Link href={`${BASE}/nova`} className={botaoPrimario}>
            <IconeDaTela href={`${BASE}/nova`} />
            Solicitar PT
          </Link>
        )}
      </header>
      <section className={`${painel} mt-6`}>
        <form
          className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3"
          role="search"
        >
          <SelecaoDeFiltro
            nome="status"
            rotulo="Status"
            opcoes={STATUS_PT}
            valor={params.status}
          />
          <SelecaoDeFiltro
            nome="tipo"
            rotulo="Tipo"
            opcoes={TIPOS_PT}
            valor={params.tipo}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          <BotaoExportar recurso="permissoes-de-trabalho" consulta={consulta} />
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
            icone={<HardHat aria-hidden size={40} strokeWidth={1.5} />}
            titulo={
              filtrando
                ? "Nenhuma permissão com esses filtros."
                : "Nenhuma permissão de trabalho."
            }
            descricao={
              filtrando
                ? "Ajuste ou limpe os filtros para ver mais registros."
                : "Solicite uma PT para liberar trabalhos de risco (altura, espaço confinado, a quente)."
            }
            acao={
              filtrando ? (
                <Link href={BASE} className={botaoSecundario}>
                  Limpar filtros
                </Link>
              ) : podeCriar ? (
                <Link href={`${BASE}/nova`} className={botaoPrimario}>
                  <IconeDaTela href={`${BASE}/nova`} />
                  Solicitar a primeira PT
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
                      campo="tipo"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Tipo
                    </ThOrdenavel>
                    <th className="px-4 py-2 font-semibold">Local e serviço</th>
                    <ThOrdenavel
                      campo="inicio"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Período
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
                  {lista.dados.itens.map((p) => (
                    <tr key={p.id} className="relative hover:bg-campo">
                      <td className="relative z-10 px-3 py-2">
                        <CaixaDeSelecao
                          id={p.id}
                          rotulo={`Selecionar a permissão ${p.numero}`}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <Link
                          href={`${BASE}/${p.id}`}
                          aria-label={`Abrir a permissão ${p.numero}`}
                          className="font-mono text-sm font-medium text-info after:absolute after:inset-0 after:content-[''] hover:underline"
                        >
                          {p.numero}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-texto-2">
                        {TIPOS_PT[p.tipo]}
                      </td>
                      <td className="max-w-md px-4 py-2">
                        {p.local}
                        <span className="block truncate text-sm text-texto-2">
                          {p.servico}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {periodoDaPt(p.inicio, p.fim)}
                      </td>
                      <td className="px-4 py-2">
                        <StatusDaPt
                          status={p.status}
                          vencida={p.vencida}
                          fim={p.fim}
                        />
                      </td>
                      <td className="relative z-10 px-2 py-2 text-right">
                        <AcoesDaLinha rotulo={`Ações da permissão ${p.numero}`}>
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
                  ))}
                </tbody>
              </table>
            </div>
            <Paginacao
              pagina={lista.dados}
              base={BASE}
              consulta={consulta}
              rotulo={["permissão", "permissões"]}
            />
            <BarraDeSelecao
              recurso="permissoes-de-trabalho"
              rotulo={["permissão selecionada", "permissões selecionadas"]}
            />
          </SelecaoDeLinhas>
        )}
      </section>
    </>
  );
}
