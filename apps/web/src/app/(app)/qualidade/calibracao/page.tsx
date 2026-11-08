import { ListFilter, Plus, Ruler } from "@/components/icones";
import type { Metadata } from "next";
import Link from "next/link";
import { AcoesDaLinha, itemDeAcao } from "@/components/acoes-da-linha";
import { BotaoExportar } from "@/components/botao-exportar";
import { BuscasSalvas } from "@/components/buscas-salvas";
import { ThOrdenavel, type Ordem } from "@/components/cabecalho-ordenavel";
import { ChipsDeFiltro, type ChipDeFiltro } from "@/components/chips-de-filtro";
import { EstadoVazio } from "@/components/estado-vazio";
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
  type ResumoCalibracao,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { SituacaoDoInstrumento } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, prazoRelativo } from "@/lib/datas";
import {
  campoCompacto,
  linkDiscreto,
  painel,
  subtituloDaPagina,
  tituloDaPagina,
} from "@/lib/estilos";
import { Botao } from "@/components/botao";

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
  const [lista, eu, resumo] = await Promise.all([
    chamarApi<Pagina<InstrumentoResumo>>(`/instrumentos?${consulta}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
    chamarApi<ResumoCalibracao>("/instrumentos/resumo"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("qualidade.editar");
  const filtrando = FILTROS.some((f) => !NAO_FILTRAM.has(f) && params[f]);
  const ordenar = params.ordenar;
  const ordem = params.ordem as Ordem | undefined;
  const plural = (n: number, um: string, varios: string) =>
    `${n} ${n === 1 ? um : varios}`;
  // Em dia = em uso menos os que pedem alguma ação (vencido, vence em breve, reprovado, sem calibração).
  const emDia = resumo.ok
    ? Math.max(
        resumo.dados.emUso -
          resumo.dados.vencidos -
          resumo.dados.vencemEmBreve -
          resumo.dados.reprovados -
          resumo.dados.semCalibracao,
        0,
      )
    : 0;

  const semFiltro = (nome: string) => {
    const q = new URLSearchParams(consulta);
    q.delete(nome);
    q.delete("pagina");
    const s = q.toString();
    return s ? `${BASE}?${s}` : BASE;
  };
  const chips: ChipDeFiltro[] = [];
  if (params.busca)
    chips.push({
      rotulo: "Busca",
      valor: params.busca,
      href: semFiltro("busca"),
    });
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
          {resumo.ok ? (
            <>
              <p className={subtituloDaPagina}>
                {plural(resumo.dados.emUso, "em uso", "em uso")}
                {emDia > 0 && ` · ${emDia} em dia`}
              </p>
              {resumo.dados.vencemEmBreve > 0 && (
                <p className="mt-0.5 text-sm text-atencao">
                  <Link
                    href={`${BASE}?situacao=vence_em_breve`}
                    className="hover:underline"
                  >
                    {plural(
                      resumo.dados.vencemEmBreve,
                      "vence em até 30 dias",
                      "vencem em até 30 dias",
                    )}
                  </Link>
                </p>
              )}
              {(resumo.dados.vencidos > 0 || resumo.dados.reprovados > 0) && (
                <p className="mt-0.5 text-sm font-semibold text-nao-conforme">
                  {resumo.dados.vencidos > 0 && (
                    <Link
                      href={`${BASE}?situacao=vencido`}
                      className="hover:underline"
                    >
                      {plural(resumo.dados.vencidos, "vencido", "vencidos")}
                    </Link>
                  )}
                  {resumo.dados.vencidos > 0 &&
                    resumo.dados.reprovados > 0 &&
                    " · "}
                  {resumo.dados.reprovados > 0 && (
                    <Link
                      href={`${BASE}?situacao=reprovado`}
                      className="hover:underline"
                    >
                      {plural(
                        resumo.dados.reprovados,
                        "reprovado",
                        "reprovados",
                      )}
                    </Link>
                  )}
                </p>
              )}
            </>
          ) : (
            <p className={subtituloDaPagina}>
              Instrumentos de medição e a situação de calibração de cada um.
            </p>
          )}
        </div>
        {podeCriar && (
          <Botao
            href={`${BASE}/novo`}
            variante="primario"
            tamanho="grande"
            icone={Plus}
          >
            Cadastrar instrumento
          </Botao>
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
          <Botao type="submit" icone={ListFilter}>
            Filtrar
          </Botao>
          <BotaoExportar recurso="calibracao" consulta={consulta} />
          {filtrando && (
            <Link href={BASE} className={`h-9 content-center ${linkDiscreto}`}>
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
            icone={<Ruler aria-hidden size={28} strokeWidth={1.5} />}
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
                <Botao href={BASE}>Limpar filtros</Botao>
              ) : podeCriar ? (
                <Botao href={`${BASE}/novo`} variante="primario" icone={Plus}>
                  Cadastrar o primeiro instrumento
                </Botao>
              ) : undefined
            }
          />
        ) : (
          <SelecaoDeLinhas>
            <div className="relative overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-superficie-2 text-xs uppercase tracking-[0.04em] text-texto-2">
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
                      className="sm:hidden lg:table-cell"
                    >
                      Local
                    </ThOrdenavel>
                    <ThOrdenavel
                      campo="ultimaCalibracao"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                      className="sm:hidden lg:table-cell"
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
                    <tr key={i.id} className="relative hover:bg-superficie-2">
                      <td className="relative z-10 px-3 py-3">
                        <CaixaDeSelecao
                          id={i.id}
                          rotulo={`Selecionar o instrumento ${i.tag}`}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          href={`${BASE}/${i.id}`}
                          aria-label={`Abrir o instrumento ${i.tag}`}
                          className="font-mono text-sm font-medium text-info after:absolute after:inset-0 after:content-[''] hover:underline"
                        >
                          {i.tag}
                        </Link>
                      </td>
                      <td className="max-w-md px-4 py-3">
                        {i.descricao}
                        <span className="block text-xs text-texto-3">
                          a cada {i.frequenciaMeses}{" "}
                          {i.frequenciaMeses === 1 ? "mês" : "meses"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-texto-2 sm:hidden lg:table-cell">
                        {i.local}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap sm:hidden lg:table-cell">
                        {i.ultimaCalibracao
                          ? formatarData(i.ultimaCalibracao)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {i.proximaCalibracao
                          ? formatarData(i.proximaCalibracao)
                          : "—"}
                        {i.proximaCalibracao &&
                          i.situacao !== "fora_de_uso" &&
                          i.situacao !== "reprovado" && (
                            <span
                              className={`block text-xs ${i.situacao === "vence_em_breve" ? "text-atencao" : "text-texto-3"}`}
                            >
                              {prazoRelativo(i.proximaCalibracao)}
                            </span>
                          )}
                      </td>
                      <td className="px-4 py-3">
                        <SituacaoDoInstrumento
                          situacao={i.situacao}
                          desde={i.proximaCalibracao}
                        />
                      </td>
                      <td className="relative z-10 px-2 py-3 text-right">
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
