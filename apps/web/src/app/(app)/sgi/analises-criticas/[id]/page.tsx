import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { AnaliseCritica, DadosDoUsuario } from "@davinci/types";
import { Anexos } from "@/components/anexos";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { Dado } from "../../dado";

export const metadata: Metadata = { title: "Análise crítica" };
const AVISOS: Record<string, string> = {
  criada: "Análise crítica registrada. Anexe a ata assinada, se houver.",
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
};

export default async function DetalheDaAnalise({
  params,
  searchParams,
}: PageProps<"/sgi/analises-criticas/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<AnaliseCritica>(`/analises-criticas/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const a = r.dados;
  return (
    <article>
      <Link
        href="/sgi/analises-criticas"
        className="dv-voltar"
      >
        Análises críticas
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>
        Análise crítica de {formatarData(a.data)}
      </h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <Dado rotulo="Participantes" largo>
            {a.participantes}
          </Dado>
          <Dado rotulo="Entradas analisadas" largo>
            {a.entradas}
          </Dado>
          <Dado rotulo="Decisões e ações" largo>
            {a.decisoes}
          </Dado>
          <Dado rotulo="Próxima análise">{formatarData(a.proximaAnalise)}</Dado>
        </dl>
      </section>
      <Anexos
        registro="analise_critica"
        registroId={a.id}
        voltar={`/sgi/analises-criticas/${a.id}`}
        podeEditar={eu.ok && eu.dados.permissoes.includes("sgi.editar")}
      />
    </article>
  );
}
