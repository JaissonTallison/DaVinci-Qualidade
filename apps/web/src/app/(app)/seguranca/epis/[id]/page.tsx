import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { DadosDoUsuario, Epi } from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Bloco } from "@/components/formulario-de-acao";
import { ValidadeDoCa } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { FormularioDeEpi } from "../formulario";
import { SituacaoDoEpi } from "./situacao";

export const metadata: Metadata = { title: "EPI" };

const AVISOS: Record<string, string> = {
  salvo:
    "EPI salvo. As próximas entregas usam estes dados; as antigas guardam o CA do dia.",
  inativado: "EPI inativado: ele sai da escolha na entrega.",
  ativado: "EPI reativado.",
};

export default async function DetalheDoEpi({
  params,
  searchParams,
}: PageProps<"/seguranca/epis/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Epi>(`/epis/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const e = r.dados;
  const podeEditar = eu.ok && eu.dados.permissoes.includes("seguranca.editar");

  return (
    <article>
      <Link
        href="/seguranca/epis"
        className="dv-voltar"
      >
        Catálogo de EPIs
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-lg text-texto-2">CA {e.ca}</span>
        <span className="text-texto-2">{e.ativo ? "Ativo" : "Inativo"}</span>
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>{e.nome}</h1>
      <Aviso avisos={AVISOS} chave={aviso} />

      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-texto-2">Validade do CA</dt>
            <dd className="mt-0.5 text-base">
              <ValidadeDoCa
                validade={e.validadeCa}
                vencido={e.caVencido}
                venceEmBreve={e.caVenceEmBreve}
              />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-texto-2">Vida útil</dt>
            <dd className="mt-0.5 text-base">
              {e.vidaUtilDias
                ? `${e.vidaUtilDias} ${e.vidaUtilDias === 1 ? "dia" : "dias"}`
                : "Sem troca periódica"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-texto-2">Entregas</dt>
            <dd className="mt-0.5 text-base">
              <Link
                href={`/seguranca/entregas-de-epi?epiId=${e.id}`}
                className="text-info hover:underline"
              >
                Ver entregas deste EPI
              </Link>
            </dd>
          </div>
        </dl>
      </section>

      {podeEditar && e.caVencido && e.ativo && (
        <p className="mt-6 max-w-3xl rounded-sm border border-nao-conforme bg-nao-conforme/10 px-4 py-2.5 text-base text-texto">
          CA vencido: nenhuma entrega deste EPI é aceita. Se chegou lote com CA
          novo, atualize o número e a validade abaixo.
        </p>
      )}
      {podeEditar && (
        <Bloco
          titulo="Dados do EPI"
          descricao="Trocar o CA (lote novo) vale para as entregas daqui em diante."
        >
          <div className="mt-4">
            <FormularioDeEpi epi={e} />
          </div>
        </Bloco>
      )}
      {podeEditar && <SituacaoDoEpi epi={e} />}
    </article>
  );
}
