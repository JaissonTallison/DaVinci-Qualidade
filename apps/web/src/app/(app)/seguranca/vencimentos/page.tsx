import { CalendarClock, ListFilter } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AcoesDaLinha, itemDeAcao } from "@/components/acoes-da-linha";
import { BotaoExportar } from "@/components/botao-exportar";
import { BuscasSalvas } from "@/components/buscas-salvas";
import { ThOrdenavel, type Ordem } from "@/components/cabecalho-ordenavel";
import { ChipsDeFiltro, type ChipDeFiltro } from "@/components/chips-de-filtro";
import { EstadoVazio } from "@/components/estado-vazio";
import { SITUACOES_VENCIMENTO, type Vencimento } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { Validade } from "@/components/situacao-do-vencimento";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import {
  botaoSecundario,
  painel,
  subtituloDaPagina,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = {
  title: "Vencimentos de ASO e treinamentos",
};

const BASE = "/seguranca/vencimentos";
const TIPOS = { aso: "ASO", treinamento: "Treinamento" } as const;
const FILTROS = ["situacao", "tipo", "ordenar", "ordem"] as const;

export default async function Vencimentos({
  searchParams,
}: PageProps<"/seguranca/vencimentos">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number], string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const consultaApi = new URLSearchParams();
  if (params.situacao) consultaApi.set("situacao", params.situacao);
  if (params.tipo) consultaApi.set("tipo", params.tipo);
  const lista = await chamarApi<Vencimento[]>(`/vencimentos?${consultaApi}`);
  const filtrando = Boolean(params.situacao || params.tipo);
  const ordenar = params.ordenar;
  const ordem = params.ordem as Ordem | undefined;

  const semFiltro = (nome: string) => {
    const q = new URLSearchParams(consulta);
    q.delete(nome);
    const s = q.toString();
    return s ? `${BASE}?${s}` : BASE;
  };
  const chips: ChipDeFiltro[] = [];
  if (params.situacao)
    chips.push({
      rotulo: "Situação",
      valor:
        SITUACOES_VENCIMENTO[
          params.situacao as keyof typeof SITUACOES_VENCIMENTO
        ] ?? params.situacao,
      href: semFiltro("situacao"),
    });
  if (params.tipo)
    chips.push({
      rotulo: "Tipo",
      valor: TIPOS[params.tipo as keyof typeof TIPOS] ?? params.tipo,
      href: semFiltro("tipo"),
    });

  const chave = (v: Vencimento): string => {
    switch (ordenar) {
      case "funcionarioNome":
        return v.funcionarioNome;
      case "descricao":
        return v.descricao;
      case "data":
        return v.data;
      case "validade":
      default:
        return v.validade;
    }
  };
  const itens =
    lista.ok && ordenar
      ? [...lista.dados].sort((a, b) => {
          const dir = ordem === "desc" ? -1 : 1;
          return chave(a).localeCompare(chave(b), "pt-BR") * dir;
        })
      : lista.ok
        ? lista.dados
        : [];

  return (
    <>
      <h1 className={tituloDaPagina}>Vencimentos de ASO e treinamentos</h1>
      <p className={subtituloDaPagina}>
        ASOs e treinamentos com validade, do mais próximo de vencer ao mais
        distante.
      </p>
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3">
          <SelecaoDeFiltro
            nome="situacao"
            rotulo="Situação"
            opcoes={SITUACOES_VENCIMENTO}
            valor={params.situacao}
          />
          <SelecaoDeFiltro
            nome="tipo"
            rotulo="Tipo"
            opcoes={TIPOS}
            valor={params.tipo}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          <BotaoExportar recurso="vencimentos" consulta={consulta} />
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
            icone={<CalendarClock aria-hidden size={40} strokeWidth={1.5} />}
            titulo={
              filtrando
                ? "Nada com esses filtros."
                : "Nenhum ASO ou treinamento com validade registrado."
            }
            descricao={
              filtrando
                ? "Ajuste ou limpe os filtros para ver mais registros."
                : "Registre os ASOs e treinamentos na página de cada funcionário."
            }
            acao={
              filtrando ? (
                <Link href={BASE} className={botaoSecundario}>
                  Limpar filtros
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-sm text-texto-2">
                <tr>
                  <ThOrdenavel
                    campo="validade"
                    ordenar={ordenar}
                    ordem={ordem}
                    base={BASE}
                    consulta={consulta}
                  >
                    Vence em
                  </ThOrdenavel>
                  <ThOrdenavel
                    campo="funcionarioNome"
                    ordenar={ordenar}
                    ordem={ordem}
                    base={BASE}
                    consulta={consulta}
                  >
                    Funcionário
                  </ThOrdenavel>
                  <ThOrdenavel
                    campo="descricao"
                    ordenar={ordenar}
                    ordem={ordem}
                    base={BASE}
                    consulta={consulta}
                  >
                    O quê
                  </ThOrdenavel>
                  <ThOrdenavel
                    campo="data"
                    ordenar={ordenar}
                    ordem={ordem}
                    base={BASE}
                    consulta={consulta}
                  >
                    Realizado em
                  </ThOrdenavel>
                  <th className="w-10 px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {itens.map((v) => (
                  <tr
                    key={`${v.tipo}-${v.funcionarioId}-${v.descricao}`}
                    className="relative hover:bg-campo"
                  >
                    <td className="px-4 py-2">
                      <Validade validade={v.validade} situacao={v.situacao} />
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/cadastros/funcionarios/${v.funcionarioId}`}
                        aria-label={`Abrir o funcionário ${v.funcionarioNome}`}
                        className="text-info after:absolute after:inset-0 after:content-[''] hover:underline"
                      >
                        {v.funcionarioNome}
                      </Link>
                      <span className="block font-mono text-xs text-texto-3">
                        {v.matricula}
                      </span>
                    </td>
                    <td className="px-4 py-2">{v.descricao}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-texto-2">
                      {formatarData(v.data)}
                    </td>
                    <td className="relative z-10 px-2 py-2 text-right">
                      <AcoesDaLinha rotulo={`Ações de ${v.funcionarioNome}`}>
                        <Link
                          href={`/cadastros/funcionarios/${v.funcionarioId}`}
                          className={itemDeAcao}
                        >
                          Abrir funcionário
                        </Link>
                        <a
                          href={`/cadastros/funcionarios/${v.funcionarioId}`}
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
              {itens.length} {itens.length === 1 ? "item" : "itens"}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
