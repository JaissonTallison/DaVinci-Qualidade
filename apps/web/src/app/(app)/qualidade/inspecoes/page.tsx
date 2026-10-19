import { ClipboardCheck, ListFilter } from "lucide-react";
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
  STATUS_INSPECAO,
  TIPOS_INSPECAO,
  type DadosDoUsuario,
  type InspecaoResumo,
  type Pagina,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { StatusDaInspecao } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  campoCompacto,
  painel,
  subtituloDaPagina,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Inspeções" };

const BASE = "/qualidade/inspecoes";
const FILTROS = ["busca", "status", "tipo", "ordenar", "ordem", "pagina"] as const;
const NAO_FILTRAM = new Set(["ordenar", "ordem", "pagina"]);

export default async function ListaDeInspecoes({
  searchParams,
}: PageProps<"/qualidade/inspecoes">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number], string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const [lista, eu] = await Promise.all([
    chamarApi<Pagina<InspecaoResumo>>(`/inspecoes?${consulta}`),
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
        STATUS_INSPECAO[params.status as keyof typeof STATUS_INSPECAO] ??
        params.status,
      href: semFiltro("status"),
    });
  if (params.tipo)
    chips.push({
      rotulo: "Tipo",
      valor:
        TIPOS_INSPECAO[params.tipo as keyof typeof TIPOS_INSPECAO] ??
        params.tipo,
      href: semFiltro("tipo"),
    });

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Inspeções</h1>
          <p className={subtituloDaPagina}>
            Inspeções de produto e processo, com o resultado de cada uma.
          </p>
        </div>
        {podeCriar && (
          <Link href={`${BASE}/nova`} className={botaoPrimario}>
            <IconeDaTela href={`${BASE}/nova`} />
            Nova inspeção
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
            placeholder="Número, objeto ou lote"
            aria-label="Buscar por número, objeto ou lote"
            className={`${campoCompacto} w-56`}
          />
          <SelecaoDeFiltro
            nome="status"
            rotulo="Status"
            opcoes={STATUS_INSPECAO}
            valor={params.status}
          />
          <SelecaoDeFiltro
            nome="tipo"
            rotulo="Tipo"
            opcoes={TIPOS_INSPECAO}
            valor={params.tipo}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          <BotaoExportar recurso="inspecoes" consulta={consulta} />
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
            icone={<ClipboardCheck aria-hidden size={40} strokeWidth={1.5} />}
            titulo={
              filtrando
                ? "Nenhuma inspeção com esses filtros."
                : "Nenhuma inspeção registrada."
            }
            descricao={
              filtrando
                ? "Ajuste ou limpe os filtros para ver mais registros."
                : "Para listas que se repetem, crie antes um modelo de inspeção."
            }
            acao={
              filtrando ? (
                <Link href={BASE} className={botaoSecundario}>
                  Limpar filtros
                </Link>
              ) : podeCriar ? (
                <Link href={`${BASE}/nova`} className={botaoPrimario}>
                  <IconeDaTela href={`${BASE}/nova`} />
                  Registrar a primeira inspeção
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
                      campo="objeto"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Objeto
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
                    <ThOrdenavel
                      campo="data"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Data
                    </ThOrdenavel>
                    <th className="px-4 py-2 font-semibold">Inspetor</th>
                    <th className="px-4 py-2 font-semibold">Itens</th>
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
                  {lista.dados.itens.map((i) => (
                    <tr key={i.id} className="relative hover:bg-campo">
                      <td className="relative z-10 px-3 py-2">
                        <CaixaDeSelecao
                          id={i.id}
                          rotulo={`Selecionar a inspeção ${i.numero}`}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <Link
                          href={`${BASE}/${i.id}`}
                          aria-label={`Abrir a inspeção ${i.numero}`}
                          className="font-mono text-sm font-medium text-info after:absolute after:inset-0 after:content-[''] hover:underline"
                        >
                          {i.numero}
                        </Link>
                      </td>
                      <td className="max-w-md px-4 py-2">
                        <span className="line-clamp-2">{i.objeto}</span>
                        {i.lote && (
                          <span className="font-mono text-xs text-texto-3">
                            Lote {i.lote}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-texto-2">
                        {TIPOS_INSPECAO[i.tipo]}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatarData(i.data)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-texto-2">
                        {i.inspetor}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-texto-2">
                        {i.status === "em_andamento"
                          ? `${i.respondidos} de ${i.totalDeItens} respondidos`
                          : `${i.totalDeItens} itens`}
                        {i.naoConformes > 0 && (
                          <span className="block text-xs text-nao-conforme">
                            {i.naoConformes} NOK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <StatusDaInspecao status={i.status} />
                      </td>
                      <td className="relative z-10 px-2 py-2 text-right">
                        <AcoesDaLinha rotulo={`Ações da inspeção ${i.numero}`}>
                          <Link href={`${BASE}/${i.id}`} className={itemDeAcao}>
                            Abrir
                          </Link>
                          <a
                            href={`${BASE}/${i.id}`}
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
              rotulo={["inspeção", "inspeções"]}
            />
            <BarraDeSelecao
              recurso="inspecoes"
              rotulo={["inspeção selecionada", "inspeções selecionadas"]}
            />
          </SelecaoDeLinhas>
        )}
      </section>
    </>
  );
}
