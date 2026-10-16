import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ODS,
  PILARES,
  type DadosDoUsuario,
  type TemaEsg,
} from "@davinci/types";
import { Anexos } from "@/components/anexos";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { IconeOds, Materialidade } from "@/components/marcadores-esg";
import { atualizarTema } from "@/lib/acoes-esg";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import { FormularioDeTema } from "../formulario";
import { RegistrarAndamento, SituacaoDoTema } from "./acoes";

export const metadata: Metadata = { title: "Tema ESG" };
const AVISOS: Record<string, string> = {
  criado: "Tema cadastrado.",
  salvo: "Alterações salvas.",
  andamento: "Andamento registrado.",
  inativado: "Tema inativado.",
  reativado: "Tema reativado.",
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
};

export default async function DetalheDoTema({
  params,
  searchParams,
}: PageProps<"/esg/temas/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<TemaEsg>(`/esg/temas/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const t = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const podeEditar = permissoes.includes("esg.editar");
  return (
    <article>
      <Link href="/esg/temas" className="text-sm text-texto-2 hover:underline">
        Temas ESG
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4">
        <span className="text-texto-2">{PILARES[t.pilar]}</span>
        <Materialidade nivel={t.nivel} nota={t.nota} />
        {!t.ativo && <span className="text-texto-2">Inativo</span>}
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>{t.nome}</h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          {t.descricao && (
            <Dado rotulo="Descrição" largo>
              {t.descricao}
            </Dado>
          )}
          <Dado rotulo="Impacto × relevância">
            {t.nota === null
              ? "Não avaliado"
              : `${t.impacto} × ${t.relevancia} = ${t.nota}${t.material ? " · material" : ""}`}
          </Dado>
          {t.responsavel && <Dado rotulo="Responsável">{t.responsavel}</Dado>}
          {t.prazoMeta && (
            <Dado rotulo="Prazo da meta">
              <span className={t.metaAtrasada ? "text-nao-conforme" : ""}>
                {formatarData(t.prazoMeta)}
                {t.metaAtrasada && " · atrasada"}
              </span>
            </Dado>
          )}
          {t.meta && (
            <Dado rotulo="Meta" largo>
              {t.meta}
            </Dado>
          )}
          <Dado rotulo="ODS" largo>
            {t.ods.length === 0 ? (
              "Nenhum ODS ligado"
            ) : (
              <ul className="mt-1 flex flex-col gap-1.5">
                {t.ods.map((n) => (
                  <li key={n} className="inline-flex items-center gap-2">
                    <IconeOds numero={n} />
                    {ODS[n]}
                  </li>
                ))}
              </ul>
            )}
          </Dado>
        </dl>
      </section>
      {t.meta && (
        <section className={`${painel} mt-6 p-5`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={tituloDaSecao}>Andamento da meta</h2>
            <span
              className={`text-2xl font-semibold tabular-nums ${t.metaAtrasada ? "text-nao-conforme" : "text-texto"}`}
            >
              {t.progresso}% da meta
              {t.metaAtrasada && (
                <span className="ml-2 text-sm font-normal">atrasada</span>
              )}
            </span>
          </div>
          {(t.andamentos ?? []).length > 0 && (
            <ul className="mt-4 divide-y divide-borda text-base">
              {(t.andamentos ?? []).map((a) => (
                <li key={a.id} className="flex flex-wrap gap-x-4 py-2">
                  <span className="w-24 text-texto-2">
                    {formatarData(a.data)}
                  </span>
                  <span className="w-12 font-semibold tabular-nums">
                    {a.progresso}%
                  </span>
                  <span className="min-w-0 flex-1">{a.comentario}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {podeEditar && t.ativo && t.meta && <RegistrarAndamento tema={t} />}
      <Anexos
        registro="tema_esg"
        registroId={t.id}
        voltar={`/esg/temas/${t.id}`}
        podeEditar={podeEditar}
      />
      {podeEditar && t.ativo && (
        <Recolhido titulo="Avaliar ou editar o tema (notas, meta, ODS)">
          <FormularioDeTema acao={atualizarTema.bind(null, t.id)} tema={t} />
        </Recolhido>
      )}
      {permissoes.includes("esg.excluir") && <SituacaoDoTema tema={t} />}
    </article>
  );
}

function Dado({
  rotulo,
  children,
  largo = false,
}: {
  rotulo: string;
  children: ReactNode;
  largo?: boolean;
}) {
  return (
    <div className={largo ? "sm:col-span-3" : ""}>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd className="mt-0.5 text-base whitespace-pre-line">{children}</dd>
    </div>
  );
}
