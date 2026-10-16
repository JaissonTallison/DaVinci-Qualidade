import { ListFilter } from "lucide-react";
import { Pendencias } from "@/components/pendencias";
import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import {
  SITUACOES_ENTREGA,
  type DadosDoUsuario,
  type EntregaEpi,
  type Epi,
  type Funcionario,
  type Pagina,
  type ResumoEpis,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { TabelaDeEntregas } from "@/components/tabela-de-entregas";
import { chamarApi } from "@/lib/api";
import {
  botaoPrimario,
  botaoSecundario,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";

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
  const [lista, resumo, epis, eu, funcionario] = await Promise.all([
    chamarApi<Pagina<EntregaEpi>>(`/epis/entregas?${consulta}`),
    chamarApi<ResumoEpis>("/epis/resumo"),
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

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Entregas de EPI</h1>
          {resumo.ok && (
            <Pendencias
              itens={[
                {
                  valor: resumo.dados.trocasVencidas,
                  rotulo: "trocas vencidas",
                  singular: "troca vencida",
                  alerta: true,
                },
                { valor: resumo.dados.semTermo, rotulo: "sem termo assinado" },
                {
                  valor: resumo.dados.casVencendo,
                  rotulo: "CAs vencidos ou vencendo",
                },
              ]}
            />
          )}
        </div>
        {podeEditar && (
          <Link
            href={`/seguranca/entregas-de-epi/nova${params.funcionarioId ? `?funcionario=${params.funcionarioId}` : ""}`}
            className={botaoPrimario}
          >
            <IconeDaTela href="/seguranca/entregas-de-epi" />
            Registrar entrega
          </Link>
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
                  {funcionario?.ok ? funcionario.dados.nome : "funcionário"}
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
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          {filtrando && (
            <Link
              href="/seguranca/entregas-de-epi"
              className="h-9 content-center text-sm text-texto-2 hover:underline"
            >
              Limpar filtros
            </Link>
          )}
        </form>
        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : lista.dados.itens.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            {filtrando
              ? "Nenhuma entrega com esses filtros."
              : "Nenhuma entrega registrada. Cadastre os EPIs no catálogo e registre cada entrega com o funcionário."}
          </p>
        ) : (
          <>
            <TabelaDeEntregas
              entregas={lista.dados.itens}
              voltar={voltar}
              podeEditar={podeEditar}
              gestor={permissoes.includes("seguranca.excluir")}
            />
            <p className="border-t border-borda px-4 py-2.5 text-sm text-texto-2">
              {lista.dados.total.toLocaleString("pt-BR")}{" "}
              {lista.dados.total === 1 ? "entrega" : "entregas"}
            </p>
          </>
        )}
      </section>
    </>
  );
}
