import { FileSearch, ListFilter } from "lucide-react";
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
  NORMAS,
  STATUS_AUDITORIA,
  TIPOS_AUDITORIA,
  type AuditoriaResumo,
  type DadosDoUsuario,
  type Pagina,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { StatusDaAuditoria } from "@/components/marcadores";
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

export const metadata: Metadata = { title: "Auditorias" };

const BASE = "/auditorias";
const FILTROS = ["busca", "status", "tipo", "ordenar", "ordem", "pagina"] as const;
const NAO_FILTRAM = new Set(["ordenar", "ordem", "pagina"]);

export default async function ListaDeAuditorias({
  searchParams,
}: PageProps<"/auditorias">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number], string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const [lista, eu] = await Promise.all([
    chamarApi<Pagina<AuditoriaResumo>>(`${BASE}?${consulta}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("auditorias.editar");
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
        STATUS_AUDITORIA[params.status as keyof typeof STATUS_AUDITORIA] ??
        params.status,
      href: semFiltro("status"),
    });
  if (params.tipo)
    chips.push({
      rotulo: "Tipo",
      valor:
        TIPOS_AUDITORIA[params.tipo as keyof typeof TIPOS_AUDITORIA] ??
        params.tipo,
      href: semFiltro("tipo"),
    });

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Auditorias</h1>
          <p className={subtituloDaPagina}>
            Programação e resultado das auditorias internas e externas do
            sistema de gestão.
          </p>
        </div>
        {podeCriar && (
          <Link href={`${BASE}/nova`} className={botaoPrimario}>
            <IconeDaTela href={`${BASE}/nova`} />
            Planejar auditoria
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
            placeholder="Número, escopo ou auditor"
            aria-label="Buscar"
            className={`${campoCompacto} w-56`}
          />
          <SelecaoDeFiltro
            nome="status"
            rotulo="Status"
            opcoes={STATUS_AUDITORIA}
            valor={params.status}
          />
          <SelecaoDeFiltro
            nome="tipo"
            rotulo="Tipo"
            opcoes={TIPOS_AUDITORIA}
            valor={params.tipo}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          <BotaoExportar recurso="auditorias" consulta={consulta} />
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
            icone={<FileSearch aria-hidden size={40} strokeWidth={1.5} />}
            titulo={
              filtrando
                ? "Nenhuma auditoria com esses filtros."
                : "Nenhuma auditoria registrada."
            }
            descricao={
              filtrando
                ? "Ajuste ou limpe os filtros para ver mais registros."
                : "Planeje a primeira com escopo, normas e equipe."
            }
            acao={
              filtrando ? (
                <Link href={BASE} className={botaoSecundario}>
                  Limpar filtros
                </Link>
              ) : podeCriar ? (
                <Link href={`${BASE}/nova`} className={botaoPrimario}>
                  <IconeDaTela href={`${BASE}/nova`} />
                  Planejar a primeira auditoria
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
                    <th className="px-4 py-2 font-semibold">Escopo</th>
                    <th className="px-4 py-2 font-semibold">Normas</th>
                    <ThOrdenavel
                      campo="auditorLider"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Auditor líder
                    </ThOrdenavel>
                    <ThOrdenavel
                      campo="dataInicio"
                      ordenar={ordenar}
                      ordem={ordem}
                      base={BASE}
                      consulta={consulta}
                    >
                      Período
                    </ThOrdenavel>
                    <th className="px-4 py-2 font-semibold">NCs</th>
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
                          rotulo={`Selecionar a auditoria ${a.numero}`}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <Link
                          href={`${BASE}/${a.id}`}
                          aria-label={`Abrir a auditoria ${a.numero}`}
                          className="font-mono text-sm font-medium text-info after:absolute after:inset-0 after:content-[''] hover:underline"
                        >
                          {a.numero}
                        </Link>
                      </td>
                      <td className="max-w-md px-4 py-2">
                        <span className="line-clamp-2">{a.escopo}</span>
                        <span className="text-xs text-texto-3">
                          {TIPOS_AUDITORIA[a.tipo]}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-texto-2">
                        {a.normas.map((n) => NORMAS[n]).join(", ")}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-texto-2">
                        {a.auditorLider}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {a.dataInicio === a.dataFim
                          ? formatarData(a.dataInicio)
                          : `${formatarData(a.dataInicio)} a ${formatarData(a.dataFim)}`}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {a.constatacoesDeNc}
                        {a.ncsPendentes > 0 && (
                          <span className="block text-xs text-atencao">
                            {a.ncsPendentes} a formalizar
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <StatusDaAuditoria status={a.status} />
                      </td>
                      <td className="relative z-10 px-2 py-2 text-right">
                        <AcoesDaLinha rotulo={`Ações da auditoria ${a.numero}`}>
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
              rotulo={["auditoria", "auditorias"]}
            />
            <BarraDeSelecao
              recurso="auditorias"
              rotulo={["auditoria selecionada", "auditorias selecionadas"]}
            />
          </SelecaoDeLinhas>
        )}
      </section>
    </>
  );
}
