import { ListFilter, Siren } from "lucide-react";
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
  STATUS_ACIDENTE,
  TIPOS_ACIDENTE,
  type AcidenteResumo,
  type DadosDoUsuario,
  type Pagina,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { StatusDoAcidente, TipoDoAcidente } from "@/components/marcadores";
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

export const metadata: Metadata = { title: "Acidentes" };

const BASE = "/seguranca/acidentes";
const FILTROS = ["busca", "tipo", "status", "ordenar", "ordem", "pagina"] as const;
const NAO_FILTRAM = new Set(["ordenar", "ordem", "pagina"]);

export default async function ListaDeAcidentes({
  searchParams,
}: PageProps<"/seguranca/acidentes">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number], string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const [lista, eu] = await Promise.all([
    chamarApi<Pagina<AcidenteResumo>>(`/acidentes?${consulta}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeRegistrar =
    eu.ok && eu.dados.permissoes.includes("seguranca.editar");
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
  if (params.tipo)
    chips.push({
      rotulo: "Tipo",
      valor:
        TIPOS_ACIDENTE[params.tipo as keyof typeof TIPOS_ACIDENTE] ??
        params.tipo,
      href: semFiltro("tipo"),
    });
  if (params.status)
    chips.push({
      rotulo: "Status",
      valor:
        STATUS_ACIDENTE[params.status as keyof typeof STATUS_ACIDENTE] ??
        params.status,
      href: semFiltro("status"),
    });

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Acidentes</h1>
          <p className={subtituloDaPagina}>
            Acidentes e incidentes registrados, com a investigação e a CAT de
            cada um.
          </p>
        </div>
        {podeRegistrar && (
          <Link href={`${BASE}/novo`} className={botaoPrimario}>
            <IconeDaTela href={`${BASE}/novo`} />
            Registrar acidente
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
            placeholder="Número, pessoa, local ou descrição"
            aria-label="Buscar"
            className={`${campoCompacto} w-64`}
          />
          <SelecaoDeFiltro
            nome="tipo"
            rotulo="Tipo"
            opcoes={TIPOS_ACIDENTE}
            valor={params.tipo}
          />
          <SelecaoDeFiltro
            nome="status"
            rotulo="Status"
            opcoes={STATUS_ACIDENTE}
            valor={params.status}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          <BotaoExportar recurso="acidentes" consulta={consulta} />
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
            icone={<Siren aria-hidden size={40} strokeWidth={1.5} />}
            titulo={
              filtrando
                ? "Nenhum registro com esses filtros."
                : "Nenhum acidente registrado."
            }
            descricao={
              filtrando
                ? "Ajuste ou limpe os filtros para ver mais registros."
                : "Registre também incidentes e quase-acidentes: eles mostram onde o próximo acidente pode acontecer."
            }
            acao={
              filtrando ? (
                <Link href={BASE} className={botaoSecundario}>
                  Limpar filtros
                </Link>
              ) : podeRegistrar ? (
                <Link href={`${BASE}/novo`} className={botaoPrimario}>
                  <IconeDaTela href={`${BASE}/novo`} />
                  Registrar o primeiro acidente
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
                      campo="data"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Data
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
                    <th className="px-4 py-2 font-semibold">Acidentado</th>
                    <th className="px-4 py-2 font-semibold">Local</th>
                    <th className="px-4 py-2 font-semibold">Dias perdidos</th>
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
                  {lista.dados.itens.map((a) => (
                    <tr key={a.id} className="relative hover:bg-campo">
                      <td className="relative z-10 px-3 py-2">
                        <CaixaDeSelecao
                          id={a.id}
                          rotulo={`Selecionar o acidente ${a.numero}`}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <Link
                          href={`${BASE}/${a.id}`}
                          aria-label={`Abrir o acidente ${a.numero}`}
                          className="font-mono text-sm font-medium text-info after:absolute after:inset-0 after:content-[''] hover:underline"
                        >
                          {a.numero}
                        </Link>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatarData(a.data)}
                      </td>
                      <td className="px-4 py-2">
                        <TipoDoAcidente tipo={a.tipo} />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {a.acidentado ?? "—"}
                      </td>
                      <td className="max-w-xs px-4 py-2 text-texto-2">
                        {a.local}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {a.diasPerdidos || "—"}
                      </td>
                      <td className="px-4 py-2">
                        <StatusDoAcidente status={a.status} />
                        {a.catAtrasada && (
                          <span className="block text-xs font-semibold text-nao-conforme">
                            CAT atrasada
                          </span>
                        )}
                      </td>
                      <td className="relative z-10 px-2 py-2 text-right">
                        <AcoesDaLinha rotulo={`Ações do acidente ${a.numero}`}>
                          <Link href={`${BASE}/${a.id}`} className={itemDeAcao}>
                            Abrir
                          </Link>
                          <a
                            href={`${BASE}/${a.id}`}
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
              rotulo={["registro", "registros"]}
            />
            <BarraDeSelecao
              recurso="acidentes"
              rotulo={["registro selecionado", "registros selecionados"]}
            />
          </SelecaoDeLinhas>
        )}
      </section>
    </>
  );
}
