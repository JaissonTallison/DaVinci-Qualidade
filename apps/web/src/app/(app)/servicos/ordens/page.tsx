import type { Metadata } from "next";
import Link from "next/link";
import { ListFilter, Wrench } from "lucide-react";
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
  STATUS_OS,
  type DadosDoUsuario,
  type OrdemDeServico,
  type Pagina,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { StatusDaOs } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  painel,
  subtituloDaPagina,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Ordens de serviço" };

const BASE = "/servicos/ordens";
const FILTROS = ["status", "ordenar", "ordem", "pagina"] as const;
const NAO_FILTRAM = new Set(["ordenar", "ordem", "pagina"]);

export default async function Ordens({
  searchParams,
}: PageProps<"/servicos/ordens">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number], string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const [lista, eu] = await Promise.all([
    chamarApi<Pagina<OrdemDeServico>>(`/ordens-de-servico?${consulta}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("servicos.editar");
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
      valor: STATUS_OS[params.status as keyof typeof STATUS_OS] ?? params.status,
      href: semFiltro("status"),
    });

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Ordens de serviço</h1>
          <p className={subtituloDaPagina}>
            Ordens de serviço e o andamento de cada atendimento.
          </p>
        </div>
        {podeCriar && (
          <Link href={`${BASE}/nova`} className={botaoPrimario}>
            <IconeDaTela href={`${BASE}/nova`} />
            Abrir OS
          </Link>
        )}
      </header>
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3">
          <SelecaoDeFiltro
            nome="status"
            rotulo="Status"
            opcoes={STATUS_OS}
            valor={params.status}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          <BotaoExportar recurso="ordens" consulta={consulta} />
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
            icone={<Wrench aria-hidden size={40} strokeWidth={1.5} />}
            titulo={
              filtrando
                ? "Nenhuma ordem de serviço com este status."
                : "Nenhuma ordem de serviço."
            }
            descricao={
              filtrando
                ? "Ajuste ou limpe os filtros para ver mais registros."
                : "Abra uma OS para registrar e acompanhar cada atendimento."
            }
            acao={
              filtrando ? (
                <Link href={BASE} className={botaoSecundario}>
                  Limpar filtros
                </Link>
              ) : podeCriar ? (
                <Link href={`${BASE}/nova`} className={botaoPrimario}>
                  <IconeDaTela href={`${BASE}/nova`} />
                  Abrir a primeira OS
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
                      Serviço
                    </ThOrdenavel>
                    <ThOrdenavel
                      campo="clienteNome"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Cliente
                    </ThOrdenavel>
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
                    <th className="px-4 py-2 font-semibold">Avaliação</th>
                    <th className="w-10 px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {lista.dados.itens.map((o) => (
                    <tr key={o.id} className="relative hover:bg-campo">
                      <td className="relative z-10 px-3 py-2">
                        <CaixaDeSelecao
                          id={o.id}
                          rotulo={`Selecionar a OS ${o.numero}`}
                        />
                      </td>
                      <td className="px-4 py-2 font-mono text-sm whitespace-nowrap">
                        <Link
                          href={`${BASE}/${o.id}`}
                          aria-label={`Abrir a OS ${o.numero}`}
                          className="text-info after:absolute after:inset-0 after:content-[''] hover:underline"
                        >
                          {o.numero}
                        </Link>
                      </td>
                      <td className="max-w-md px-4 py-2">{o.titulo}</td>
                      <td className="px-4 py-2 text-texto-2">{o.clienteNome}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatarData(o.prazo)}
                      </td>
                      <td className="px-4 py-2">
                        <StatusDaOs
                          status={o.status}
                          atrasada={o.atrasada}
                          prazo={o.prazo}
                        />
                      </td>
                      <td className="px-4 py-2 tabular-nums">
                        {o.nota ? `${o.nota} de 5` : "—"}
                      </td>
                      <td className="relative z-10 px-2 py-2 text-right">
                        <AcoesDaLinha rotulo={`Ações da OS ${o.numero}`}>
                          <Link href={`${BASE}/${o.id}`} className={itemDeAcao}>
                            Abrir
                          </Link>
                          <a
                            href={`${BASE}/${o.id}`}
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
              rotulo={["ordem", "ordens"]}
            />
            <BarraDeSelecao
              recurso="ordens"
              rotulo={["ordem selecionada", "ordens selecionadas"]}
            />
          </SelecaoDeLinhas>
        )}
      </section>
    </>
  );
}
