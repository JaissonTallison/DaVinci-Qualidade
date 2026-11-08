import { ListFilter, Plus, ShieldCheck } from "@/components/icones";
import type { Metadata } from "next";
import Link from "next/link";
import { BotaoExportar } from "@/components/botao-exportar";
import { BuscasSalvas } from "@/components/buscas-salvas";
import { ChipsDeFiltro, type ChipDeFiltro } from "@/components/chips-de-filtro";
import { EstadoVazio } from "@/components/estado-vazio";
import { Paginacao } from "@/components/paginacao";
import {
  SITUACOES_ENTREGA,
  type DadosDoUsuario,
  type EntregaEpi,
  type Epi,
  type Funcionario,
  type Pagina,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { TabelaDeEntregas } from "@/components/tabela-de-entregas";
import { chamarApi } from "@/lib/api";
import {
  linkDiscreto,
  painel,
  subtituloDaPagina,
  tituloDaPagina,
} from "@/lib/estilos";
import { Botao } from "@/components/botao";

export const metadata: Metadata = { title: "Entregas de EPI" };

const FILTROS = ["funcionarioId", "epiId", "situacao", "pagina"] as const;
const AVISOS: Record<string, string> = {
  entregue: "Entrega registrada.",
  devolvido: "Devolução registrada.",
  anulada: "Entrega anulada: ela continua na ficha, riscada.",
};

export default async function EntregasDeEpi({
  searchParams,
}: PageProps<"/seguranca/entregas-de-epi">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number] | "aviso", string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const [lista, epis, eu, funcionario] = await Promise.all([
    chamarApi<Pagina<EntregaEpi>>(`/epis/entregas?${consulta}`),
    chamarApi<Epi[]>("/epis?situacao=todos"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
    params.funcionarioId
      ? chamarApi<Funcionario>(`/funcionarios/${params.funcionarioId}`)
      : null,
  ]);
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const podeEditar = permissoes.includes("seguranca.editar");
  const filtrando = Boolean(
    params.funcionarioId || params.epiId || params.situacao,
  );
  const voltar = `/seguranca/entregas-de-epi${consulta.size ? `?${consulta}` : ""}`;
  const BASE = "/seguranca/entregas-de-epi";
  const semFiltro = (nome: string) => {
    const q = new URLSearchParams(consulta);
    q.delete(nome);
    q.delete("pagina");
    const s = q.toString();
    return s ? `${BASE}?${s}` : BASE;
  };
  const chips: ChipDeFiltro[] = [];
  if (params.epiId && epis.ok) {
    const e = epis.dados.find((x) => x.id === params.epiId);
    chips.push({
      rotulo: "EPI",
      valor: e ? `${e.nome} (CA ${e.ca})` : params.epiId,
      href: semFiltro("epiId"),
    });
  }
  if (params.situacao)
    chips.push({
      rotulo: "Situação",
      valor:
        SITUACOES_ENTREGA[params.situacao as keyof typeof SITUACOES_ENTREGA] ??
        params.situacao,
      href: semFiltro("situacao"),
    });

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Entregas de EPI</h1>
          <p className={subtituloDaPagina}>
            Entregas de EPI por profissional, com o CA e o termo de
            responsabilidade de cada uma.
          </p>
        </div>
        {podeEditar && (
          <Botao
            href={`/seguranca/entregas-de-epi/nova${params.funcionarioId ? `?funcionario=${params.funcionarioId}` : ""}`}
            variante="primario"
            tamanho="grande"
            icone={Plus}
          >
            Registrar entrega
          </Botao>
        )}
      </header>
      <Aviso avisos={AVISOS} chave={params.aviso} />

      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3">
          {params.funcionarioId && (
            <>
              <input
                type="hidden"
                name="funcionarioId"
                value={params.funcionarioId}
              />
              <span className="h-9 content-center text-base">
                Ficha de{" "}
                <strong className="font-semibold">
                  {funcionario?.ok ? funcionario.dados.nome : "profissional"}
                </strong>
              </span>
            </>
          )}
          {epis.ok && (
            <SelecaoDeFiltro
              nome="epiId"
              rotulo="EPI"
              opcoes={Object.fromEntries(
                epis.dados.map((e) => [e.id, `${e.nome} (CA ${e.ca})`]),
              )}
              valor={params.epiId}
            />
          )}
          <SelecaoDeFiltro
            nome="situacao"
            rotulo="Situação"
            opcoes={SITUACOES_ENTREGA}
            valor={params.situacao}
          />
          <Botao type="submit" icone={ListFilter}>
            Filtrar
          </Botao>
          <BotaoExportar recurso="entregas-de-epi" consulta={consulta} />
          {filtrando && (
            <Link
              href="/seguranca/entregas-de-epi"
              className={`h-9 content-center ${linkDiscreto}`}
            >
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
            icone={<ShieldCheck aria-hidden size={28} strokeWidth={1.5} />}
            titulo={
              filtrando
                ? "Nenhuma entrega com esses filtros."
                : "Nenhuma entrega registrada."
            }
            descricao={
              filtrando
                ? "Ajuste ou limpe os filtros para ver mais registros."
                : "Cadastre os EPIs no catálogo e registre cada entrega com o profissional."
            }
            acao={
              filtrando ? (
                <Botao href={BASE}>Limpar filtros</Botao>
              ) : podeEditar ? (
                <Botao href={`${BASE}/nova`} variante="primario" icone={Plus}>
                  Registrar a primeira entrega
                </Botao>
              ) : undefined
            }
          />
        ) : (
          <>
            <TabelaDeEntregas
              entregas={lista.dados.itens}
              voltar={voltar}
              podeEditar={podeEditar}
              gestor={permissoes.includes("seguranca.excluir")}
            />
            <Paginacao
              pagina={lista.dados}
              base={BASE}
              consulta={consulta}
              rotulo={["entrega", "entregas"]}
            />
          </>
        )}
      </section>
    </>
  );
}
