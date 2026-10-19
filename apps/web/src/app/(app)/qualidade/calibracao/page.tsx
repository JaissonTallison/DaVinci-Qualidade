import { ListFilter, Ruler } from "lucide-react";
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
  SITUACOES_INSTRUMENTO,
  type DadosDoUsuario,
  type InstrumentoResumo,
  type Pagina,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { SituacaoDoInstrumento } from "@/components/marcadores";
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

export const metadata: Metadata = { title: "Calibração" };

const BASE = "/qualidade/calibracao";
const FILTROS = ["busca", "situacao", "ordenar", "ordem", "pagina"] as const;
const NAO_FILTRAM = new Set(["ordenar", "ordem", "pagina"]);

export default async function ListaDeInstrumentos({
  searchParams,
}: PageProps<"/qualidade/calibracao">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number], string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const [lista, eu] = await Promise.all([
    chamarApi<Pagina<InstrumentoResumo>>(`/instrumentos?${consulta}`),
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
  if (params.situacao)
    chips.push({
      rotulo: "Situação",
      valor:
        SITUACOES_INSTRUMENTO[
          params.situacao as keyof typeof SITUACOES_INSTRUMENTO
        ] ?? params.situacao,
      href: semFiltro("situacao"),
    });

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Calibração</h1>
          <p className={subtituloDaPagina}>
            Instrumentos de medição e a situação de calibração de cada um.
          </p>
        </div>
        {podeCriar && (
          <Link href={`${BASE}/novo`} className={botaoPrimario}>
            <IconeDaTela href={`${BASE}/novo`} />
            Cadastrar instrumento
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
            placeholder="TAG ou descrição"
            aria-label="Buscar por TAG ou descrição"
            className={`${campoCompacto} w-56`}
          />
          <SelecaoDeFiltro
            nome="situacao"
            rotulo="Situação"
            opcoes={SITUACOES_INSTRUMENTO}
            valor={params.situacao}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          <BotaoExportar recurso="calibracao" consulta={consulta} />
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
            icone={<Ruler aria-hidden size={40} strokeWidth={1.5} />}
            titulo={
              filtrando
                ? "Nenhum instrumento com esses filtros."
                : "Nenhum instrumento cadastrado."
            }
            descricao={
              filtrando
                ? "Ajuste ou limpe os filtros para ver mais registros."
                : "Cadastre os instrumentos usados nas inspeções e medições para acompanhar a calibração."
            }
            acao={
              filtrando ? (
                <Link href={BASE} className={botaoSecundario}>
                  Limpar filtros
                </Link>
              ) : podeCriar ? (
                <Link href={`${BASE}/novo`} className={botaoPrimario}>
                  <IconeDaTela href={`${BASE}/novo`} />
                  Cadastrar o primeiro instrumento
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
                      campo="tag"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      TAG
                    </ThOrdenavel>
                    <ThOrdenavel
                      campo="descricao"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Instrumento
                    </ThOrdenavel>
                    <ThOrdenavel
                      campo="local"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Local
                    </ThOrdenavel>
                    <ThOrdenavel
                      campo="ultimaCalibracao"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Última
                    </ThOrdenavel>
                    <ThOrdenavel
                      campo="proximaCalibracao"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Próxima
                    </ThOrdenavel>
                    <ThOrdenavel
                      campo="situacao"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Situação
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
                          rotulo={`Selecionar o instrumento ${i.tag}`}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <Link
                          href={`${BASE}/${i.id}`}
                          aria-label={`Abrir o instrumento ${i.tag}`}
                          className="font-mono text-sm font-medium text-info after:absolute after:inset-0 after:content-[''] hover:underline"
                        >
                          {i.tag}
                        </Link>
                      </td>
                      <td className="max-w-md px-4 py-2">
                        {i.descricao}
                        <span className="block text-xs text-texto-3">
                          a cada {i.frequenciaMeses}{" "}
                          {i.frequenciaMeses === 1 ? "mês" : "meses"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-texto-2">{i.local}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {i.ultimaCalibracao
                          ? formatarData(i.ultimaCalibracao)
                          : "—"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {i.proximaCalibracao
                          ? formatarData(i.proximaCalibracao)
                          : "—"}
                        {i.proximaCalibracao &&
                          i.situacao !== "fora_de_uso" &&
                          i.situacao !== "reprovado" && (
                            <span
                              className={`block text-xs ${i.situacao === "vencido" ? "text-nao-conforme" : "text-texto-3"}`}
                            >
                              {prazoRelativo(i.proximaCalibracao)}
                            </span>
                          )}
                      </td>
                      <td className="px-4 py-2">
                        <SituacaoDoInstrumento
                          situacao={i.situacao}
                          desde={i.proximaCalibracao}
                        />
                      </td>
                      <td className="relative z-10 px-2 py-2 text-right">
                        <AcoesDaLinha rotulo={`Ações do instrumento ${i.tag}`}>
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
              rotulo={["instrumento", "instrumentos"]}
            />
            <BarraDeSelecao
              recurso="calibracao"
              rotulo={["instrumento selecionado", "instrumentos selecionados"]}
            />
          </SelecaoDeLinhas>
        )}
      </section>
    </>
  );
}
