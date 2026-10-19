import { ListFilter, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AcoesDaLinha, itemDeAcao } from "@/components/acoes-da-linha";
import { BotaoExportar } from "@/components/botao-exportar";
import { BuscasSalvas } from "@/components/buscas-salvas";
import { ThOrdenavel, type Ordem } from "@/components/cabecalho-ordenavel";
import { ChipsDeFiltro, type ChipDeFiltro } from "@/components/chips-de-filtro";
import { EstadoVazio } from "@/components/estado-vazio";
import { IconeDaTela } from "@/components/icones-do-menu";
import {
  BarraDeSelecao,
  CaixaDeSelecao,
  CaixaSelecionarTodos,
  SelecaoDeLinhas,
} from "@/components/selecao-de-linhas";
import {
  GRUPOS_DE_RISCO,
  NIVEIS_DE_RISCO,
  type DadosDoUsuario,
  type Risco,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { NivelDoRisco } from "@/components/marcadores";
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

export const metadata: Metadata = { title: "PGR" };

const BASE = "/seguranca/pgr";
const FILTROS = ["grupo", "nivel", "busca", "ordenar", "ordem"] as const;

export default async function Pgr({
  searchParams,
}: PageProps<"/seguranca/pgr">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number], string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const consultaApi = new URLSearchParams();
  for (const k of ["grupo", "nivel", "busca"] as const)
    if (params[k]) consultaApi.set(k, params[k]!);
  const [lista, eu] = await Promise.all([
    chamarApi<Risco[]>(`/riscos?${consultaApi}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("seguranca.editar");
  const filtrando = Boolean(params.grupo || params.nivel || params.busca);
  const ordenar = params.ordenar;
  const ordem = params.ordem as Ordem | undefined;

  const semFiltro = (nome: string) => {
    const q = new URLSearchParams(consulta);
    q.delete(nome);
    const s = q.toString();
    return s ? `${BASE}?${s}` : BASE;
  };
  const chips: ChipDeFiltro[] = [];
  if (params.grupo)
    chips.push({
      rotulo: "Grupo",
      valor:
        GRUPOS_DE_RISCO[params.grupo as keyof typeof GRUPOS_DE_RISCO] ??
        params.grupo,
      href: semFiltro("grupo"),
    });
  if (params.nivel)
    chips.push({
      rotulo: "Nível",
      valor:
        NIVEIS_DE_RISCO[params.nivel as keyof typeof NIVEIS_DE_RISCO] ??
        params.nivel,
      href: semFiltro("nivel"),
    });
  if (params.busca)
    chips.push({ rotulo: "Busca", valor: params.busca, href: semFiltro("busca") });

  const niveis = Object.keys(NIVEIS_DE_RISCO);
  const chave = (r: Risco): string | number => {
    switch (ordenar) {
      case "nivel":
        return niveis.indexOf(r.nivel);
      case "risco":
        return r.severidade * r.probabilidade;
      case "grupo":
        return GRUPOS_DE_RISCO[r.grupo] ?? r.grupo;
      case "prazo":
        return r.prazo ?? "";
      case "local":
        return r.local;
      case "perigo":
        return r.perigo;
      default:
        return "";
    }
  };
  const itens =
    lista.ok && ordenar
      ? [...lista.dados].sort((a, b) => {
          const dir = ordem === "desc" ? -1 : 1;
          const va = chave(a);
          const vb = chave(b);
          if (typeof va === "number" && typeof vb === "number")
            return (va - vb) * dir;
          return String(va).localeCompare(String(vb), "pt-BR") * dir;
        })
      : lista.ok
        ? lista.dados
        : [];

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>PGR · Inventário de riscos</h1>
          <p className={subtituloDaPagina}>
            Inventário de riscos do PGR e as ações de controle de cada um.
          </p>
        </div>
        {podeCriar && (
          <Link href={`${BASE}/novo`} className={botaoPrimario}>
            <IconeDaTela href={`${BASE}/novo`} />
            Cadastrar risco
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
            placeholder="Setor, atividade ou perigo"
            aria-label="Buscar"
            className={`${campoCompacto} w-60`}
          />
          <SelecaoDeFiltro
            nome="grupo"
            rotulo="Grupo"
            opcoes={GRUPOS_DE_RISCO}
            valor={params.grupo}
          />
          <SelecaoDeFiltro
            nome="nivel"
            rotulo="Nível"
            opcoes={NIVEIS_DE_RISCO}
            valor={params.nivel}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          <BotaoExportar recurso="pgr" consulta={consulta} />
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
        ) : itens.length === 0 ? (
          <EstadoVazio
            icone={<ShieldAlert aria-hidden size={40} strokeWidth={1.5} />}
            titulo={
              filtrando
                ? "Nenhum risco com esses filtros."
                : "Nenhum risco no inventário."
            }
            descricao={
              filtrando
                ? "Ajuste ou limpe os filtros para ver mais registros."
                : "Percorra cada setor e registre os perigos que encontrar."
            }
            acao={
              filtrando ? (
                <Link href={BASE} className={botaoSecundario}>
                  Limpar filtros
                </Link>
              ) : podeCriar ? (
                <Link href={`${BASE}/novo`} className={botaoPrimario}>
                  <IconeDaTela href={`${BASE}/novo`} />
                  Cadastrar o primeiro risco
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
                      <CaixaSelecionarTodos ids={itens.map((r) => r.id)} />
                    </th>
                    <ThOrdenavel
                      campo="nivel"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Nível
                    </ThOrdenavel>
                    <ThOrdenavel
                      campo="local"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Setor ou atividade
                    </ThOrdenavel>
                    <ThOrdenavel
                      campo="perigo"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Perigo
                    </ThOrdenavel>
                    <ThOrdenavel
                      campo="grupo"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Grupo
                    </ThOrdenavel>
                    <ThOrdenavel
                      campo="risco"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      S × P
                    </ThOrdenavel>
                    <ThOrdenavel
                      campo="prazo"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Prazo da ação
                    </ThOrdenavel>
                    <th className="w-10 px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {itens.map((r) => (
                    <tr key={r.id} className="relative hover:bg-campo">
                      <td className="relative z-10 px-3 py-2">
                        <CaixaDeSelecao
                          id={r.id}
                          rotulo={`Selecionar o risco: ${r.perigo}`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <NivelDoRisco nivel={r.nivel} />
                      </td>
                      <td className="px-4 py-2">{r.local}</td>
                      <td className="max-w-md px-4 py-2">
                        <Link
                          href={`${BASE}/${r.id}`}
                          aria-label={`Abrir o risco: ${r.perigo}`}
                          className="text-info after:absolute after:inset-0 after:content-[''] hover:underline"
                        >
                          {r.perigo}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-texto-2">
                        {GRUPOS_DE_RISCO[r.grupo]}
                      </td>
                      <td className="px-4 py-2 tabular-nums text-texto-2">
                        {r.severidade} × {r.probabilidade}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {r.prazo ? (
                          <span
                            className={r.acaoVencida ? "text-nao-conforme" : ""}
                          >
                            {formatarData(r.prazo)}
                            {r.acaoVencida && " · vencido"}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="relative z-10 px-2 py-2 text-right">
                        <AcoesDaLinha rotulo={`Ações do risco ${r.perigo}`}>
                          <Link href={`${BASE}/${r.id}`} className={itemDeAcao}>
                            Abrir
                          </Link>
                          <a
                            href={`${BASE}/${r.id}`}
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
              <p className="border-t border-borda px-4 py-2.5 text-sm text-texto-2">
                {itens.length} {itens.length === 1 ? "risco" : "riscos"}
              </p>
            </div>
            <BarraDeSelecao
              recurso="pgr"
              rotulo={["risco selecionado", "riscos selecionados"]}
            />
          </SelecaoDeLinhas>
        )}
      </section>
    </>
  );
}
