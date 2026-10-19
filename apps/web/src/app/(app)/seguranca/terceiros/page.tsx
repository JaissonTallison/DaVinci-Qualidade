import { Building2, ListFilter } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AcoesDaLinha, itemDeAcao } from "@/components/acoes-da-linha";
import { BotaoExportar } from "@/components/botao-exportar";
import { BuscasSalvas } from "@/components/buscas-salvas";
import { ChipsDeFiltro, type ChipDeFiltro } from "@/components/chips-de-filtro";
import { EstadoVazio } from "@/components/estado-vazio";
import { IconeDaTela } from "@/components/icones-do-menu";
import {
  formatarDocumento,
  SITUACOES_TERCEIRO,
  type DadosDoUsuario,
  type TerceiroResumo,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { chamarApi } from "@/lib/api";
import {
  botaoPrimario,
  botaoSecundario,
  campoCompacto,
  painel,
  subtituloDaPagina,
  tituloDaPagina,
} from "@/lib/estilos";
import { SituacaoDoTerceiro } from "./situacao";

export const metadata: Metadata = { title: "Terceiros" };

const BASE = "/seguranca/terceiros";
const ORDENACOES = {
  razaoSocial: "Razão social",
  servico: "Serviço",
  situacao: "Situação",
} as const;
const FILTROS = ["situacao", "busca", "ordenar"] as const;

export default async function Terceiros({
  searchParams,
}: PageProps<"/seguranca/terceiros">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number], string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const consultaApi = new URLSearchParams();
  if (params.situacao) consultaApi.set("situacao", params.situacao);
  if (params.busca) consultaApi.set("busca", params.busca);
  const [lista, eu] = await Promise.all([
    chamarApi<TerceiroResumo[]>(`/terceiros?${consultaApi}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("seguranca.editar");
  const filtrando = Boolean(params.situacao || params.busca);
  const ordenar = params.ordenar as keyof typeof ORDENACOES | undefined;

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
        SITUACOES_TERCEIRO[
          params.situacao as keyof typeof SITUACOES_TERCEIRO
        ] ?? params.situacao,
      href: semFiltro("situacao"),
    });
  if (params.busca)
    chips.push({ rotulo: "Busca", valor: params.busca, href: semFiltro("busca") });

  const chave = (t: TerceiroResumo): string => {
    switch (ordenar) {
      case "servico":
        return t.servico;
      case "situacao":
        return SITUACOES_TERCEIRO[t.situacao] ?? t.situacao;
      case "razaoSocial":
      default:
        return t.razaoSocial;
    }
  };
  const itens =
    lista.ok && ordenar
      ? [...lista.dados].sort((a, b) =>
          chave(a).localeCompare(chave(b), "pt-BR"),
        )
      : lista.ok
        ? lista.dados
        : [];

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Terceiros</h1>
          <p className={subtituloDaPagina}>
            Empresas terceiras e a situação dos documentos de cada uma.
          </p>
        </div>
        {podeCriar && (
          <Link href={`${BASE}/novo`} className={botaoPrimario}>
            <IconeDaTela href={`${BASE}/novo`} />
            Cadastrar terceiro
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
            placeholder="Razão social, serviço ou CNPJ"
            aria-label="Buscar"
            className={`${campoCompacto} w-64`}
          />
          <SelecaoDeFiltro
            nome="situacao"
            rotulo="Situação"
            opcoes={SITUACOES_TERCEIRO}
            valor={params.situacao}
          />
          <SelecaoDeFiltro
            nome="ordenar"
            rotulo="Ordenar por"
            opcoes={ORDENACOES}
            valor={params.ordenar}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          <BotaoExportar recurso="terceiros" consulta={consulta} />
          {(filtrando || ordenar) && (
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
            icone={<Building2 aria-hidden size={40} strokeWidth={1.5} />}
            titulo={
              filtrando
                ? "Nenhuma empresa terceirizada com esses filtros."
                : "Nenhuma empresa terceirizada cadastrada."
            }
            descricao={
              filtrando
                ? "Ajuste ou limpe os filtros para ver mais registros."
                : "Cadastre as empresas terceiras e acompanhe os documentos de cada uma."
            }
            acao={
              filtrando ? (
                <Link href={BASE} className={botaoSecundario}>
                  Limpar filtros
                </Link>
              ) : podeCriar ? (
                <Link href={`${BASE}/novo`} className={botaoPrimario}>
                  <IconeDaTela href={`${BASE}/novo`} />
                  Cadastrar o primeiro terceiro
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-borda">
            {itens.map((t) => (
              <li
                key={t.id}
                className="relative flex flex-wrap items-start justify-between gap-3 px-4 py-3 hover:bg-campo"
              >
                <div className="min-w-0">
                  <Link
                    href={`${BASE}/${t.id}`}
                    aria-label={`Abrir o terceiro ${t.razaoSocial}`}
                    className="font-medium text-info after:absolute after:inset-0 after:content-[''] hover:underline"
                  >
                    {t.razaoSocial}
                  </Link>
                  <p className="text-sm text-texto-2">
                    <span className="font-mono">
                      {formatarDocumento(t.cnpj)}
                    </span>{" "}
                    · {t.servico}
                  </p>
                  {t.pendencias.length > 0 && (
                    <p className="mt-1 text-sm text-nao-conforme">
                      {t.pendencias.join(" · ")}
                    </p>
                  )}
                </div>
                <div className="relative z-10 flex items-center gap-2">
                  <SituacaoDoTerceiro situacao={t.situacao} />
                  <AcoesDaLinha rotulo={`Ações de ${t.razaoSocial}`}>
                    <Link href={`${BASE}/${t.id}`} className={itemDeAcao}>
                      Abrir
                    </Link>
                    <a
                      href={`${BASE}/${t.id}`}
                      target="_blank"
                      rel="noopener"
                      className={itemDeAcao}
                    >
                      Abrir em nova aba
                    </a>
                  </AcoesDaLinha>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
