import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  TIPOS_INOVACAO,
  type DadosDoUsuario,
  type Mudanca,
} from "@davinci/types";
import { Anexos } from "@/components/anexos";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { StatusDaMudanca } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento } from "@/lib/datas";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import { Dado } from "../../dado";
import { DecidirInovacao, ImplementarInovacao } from "./acoes";
import { LinhaDoTempoDaInovacao } from "./linha-do-tempo";

import { CabecalhoComVoltar } from "@/components/pagina-de-cadastro";
export const metadata: Metadata = { title: "Inovação" };
const AVISOS: Record<string, string> = {
  proposta: "Inovação proposta. Agora um gestor avalia.",
  aprovada: "Inovação aprovada.",
  rejeitada: "Inovação reprovada.",
  implementada: "Inovação implementada.",
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
};

export default async function DetalheDaInovacao({
  params,
  searchParams,
}: PageProps<"/sgi/inovacao/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Mudanca>(`/mudancas/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const m = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  return (
    <article>
      <CabecalhoComVoltar
        voltar={{ href: "/sgi/inovacao", rotulo: "Gestão de inovação" }}
      >
        <header className="flex flex-wrap items-baseline gap-x-4">
          <span className="font-mono text-lg text-texto-2">{m.numero}</span>
          <StatusDaMudanca status={m.status} />
        </header>
        <h1 className={`${tituloDaPagina} mt-1`}>{m.titulo}</h1>
        <Aviso avisos={AVISOS} chave={aviso} />
      </CabecalhoComVoltar>
      <section className={`${painel} mt-6 p-5`}>
        <h2 className={tituloDaSecao}>Linha do tempo</h2>
        <LinhaDoTempoDaInovacao m={m} />
      </section>
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          {m.tipoInovacao && TIPOS_INOVACAO[m.tipoInovacao] && (
            <Dado rotulo="Tipo de inovação">
              {TIPOS_INOVACAO[m.tipoInovacao]}
            </Dado>
          )}
          <Dado rotulo="A proposta de inovação" largo>
            {m.descricao}
          </Dado>
          <Dado rotulo="Oportunidade ou motivação" largo>
            {m.motivo}
          </Dado>
          {m.ganhoEsperado && (
            <Dado rotulo="Ganho esperado" largo>
              {m.ganhoEsperado}
            </Dado>
          )}
          <Dado rotulo="Impactos e recursos necessários" largo>
            {m.impactos}
          </Dado>
          <Dado rotulo="Responsável">{m.responsavel}</Dado>
          <Dado rotulo="Previsão de implementação">
            {formatarData(m.dataPrevista)}
          </Dado>
          {m.parecer && (
            <Dado rotulo={`Parecer (${formatarMomento(m.decididaEm!)})`} largo>
              {m.parecer}
            </Dado>
          )}
          {m.verificacao && (
            <Dado
              rotulo={`Resultados obtidos (${formatarMomento(m.implementadaEm!)})`}
              largo
            >
              {m.verificacao}
            </Dado>
          )}
        </dl>
      </section>
      {m.status === "proposta" &&
        permissoes.includes("sgi.excluir") &&
        !m.propostaPorMim && <DecidirInovacao mudanca={m} />}
      {m.status === "proposta" && m.propostaPorMim && (
        <p className="mt-6 text-base text-texto-2">
          Você propôs esta inovação: a decisão é de outro gestor.
        </p>
      )}
      {m.status === "aprovada" && permissoes.includes("sgi.editar") && (
        <ImplementarInovacao mudanca={m} />
      )}
      <Anexos
        registro="mudanca"
        registroId={m.id}
        voltar={`/sgi/inovacao/${m.id}`}
        podeEditar={permissoes.includes("sgi.editar")}
      />
    </article>
  );
}
