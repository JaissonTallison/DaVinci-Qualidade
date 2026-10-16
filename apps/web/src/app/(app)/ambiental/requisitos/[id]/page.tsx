import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ESFERAS,
  type DadosDoUsuario,
  type RequisitoLegal,
} from "@davinci/types";
import { Anexos } from "@/components/anexos";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { AtendimentoDoRequisito } from "@/components/marcadores-ambientais";
import { atualizarRequisito } from "@/lib/acoes-ambiental";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { FormularioDeRequisito } from "../formulario";
import { AvaliarRequisito } from "./avaliar";

export const metadata: Metadata = { title: "Requisito legal" };
const AVISOS: Record<string, string> = {
  criado: "Requisito cadastrado. Registre a primeira avaliação de atendimento.",
  salvo: "Alterações salvas.",
  avaliado: "Avaliação registrada.",
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
};

export default async function DetalheDoRequisito({
  params,
  searchParams,
}: PageProps<"/ambiental/requisitos/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<RequisitoLegal>(`/requisitos-legais/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const q = r.dados;
  const podeEditar = eu.ok && eu.dados.permissoes.includes("ambiental.editar");
  return (
    <article>
      <Link
        href="/ambiental/requisitos"
        className="text-sm text-texto-2 hover:underline"
      >
        Requisitos legais
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4">
        <span className="text-texto-2">
          {ESFERAS[q.esfera]} · {q.tema}
        </span>
        <AtendimentoDoRequisito atendimento={q.atendimento} />
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>{q.norma}</h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <Dado rotulo="O que exige" largo>
            {q.requisito}
          </Dado>
          <Dado rotulo="Última avaliação">
            {q.ultimaAvaliacao
              ? formatarData(q.ultimaAvaliacao)
              : "Nunca avaliado"}
          </Dado>
          <Dado rotulo="Próxima avaliação">
            <span className={q.avaliacaoVencida ? "text-nao-conforme" : ""}>
              {q.proximaAvaliacao
                ? formatarData(q.proximaAvaliacao)
                : "Pendente"}
              {q.avaliacaoVencida && q.proximaAvaliacao && " · vencida"}
            </span>
          </Dado>
          {q.evidencia && <Dado rotulo="Evidência">{q.evidencia}</Dado>}
          {q.acao && (
            <Dado rotulo="Ação para atender" largo>
              {q.acao}
            </Dado>
          )}
        </dl>
      </section>
      {podeEditar && <AvaliarRequisito requisito={q} />}
      <Anexos
        registro="requisito_legal"
        registroId={q.id}
        voltar={`/ambiental/requisitos/${q.id}`}
        podeEditar={podeEditar}
      />
      {podeEditar && (
        <Recolhido titulo="Editar o requisito">
          <FormularioDeRequisito
            acao={atualizarRequisito.bind(null, q.id)}
            requisito={q}
          />
        </Recolhido>
      )}
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
