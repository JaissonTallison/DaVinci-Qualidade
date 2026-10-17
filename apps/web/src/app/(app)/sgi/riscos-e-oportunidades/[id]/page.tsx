import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  TIPOS_RO,
  type DadosDoUsuario,
  type RiscoOuOportunidade,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { ClasseDoRo } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { Dado } from "../../dado";
import { FormularioDeRo } from "../formulario";
import { EncerrarRo } from "./acoes";

export const metadata: Metadata = { title: "Risco ou oportunidade" };
const AVISOS = {
  criado: "Registrado.",
  salvo: "Salvo.",
  encerrado: "Encerrado com o resultado.",
} as Record<string, string>;

export default async function DetalheDoRo({
  params,
  searchParams,
}: PageProps<"/sgi/riscos-e-oportunidades/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<RiscoOuOportunidade>(`/riscos-e-oportunidades/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const x = r.dados;
  const podeEditar =
    eu.ok && eu.dados.permissoes.includes("sgi.editar") && !x.encerradoEm;
  return (
    <article>
      <Link
        href="/sgi/riscos-e-oportunidades"
        className="dv-voltar"
      >
        Riscos e oportunidades
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4">
        <ClasseDoRo classe={x.classe} />
        <span className="text-texto-2">
          {TIPOS_RO[x.tipo]} · {x.processo}
          {x.encerradoEm ? " · Encerrado" : ""}
        </span>
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>{x.descricao}</h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          {x.contexto && (
            <Dado rotulo="Contexto ou causa" largo>
              {x.contexto}
            </Dado>
          )}
          <Dado rotulo="Probabilidade × impacto">
            {x.probabilidade} × {x.impacto}
          </Dado>
          {x.responsavel && <Dado rotulo="Responsável">{x.responsavel}</Dado>}
          {x.prazo && (
            <Dado rotulo="Prazo">
              <span className={x.prazoVencido ? "text-nao-conforme" : ""}>
                {formatarData(x.prazo)}
                {x.prazoVencido && " · vencido"}
              </span>
            </Dado>
          )}
          {x.acao && (
            <Dado rotulo="Ação" largo>
              {x.acao}
            </Dado>
          )}
          {x.resultado && (
            <Dado
              rotulo={`Resultado (encerrado em ${formatarMomento(x.encerradoEm!)})`}
              largo
            >
              {x.resultado}
            </Dado>
          )}
        </dl>
      </section>
      {podeEditar && <EncerrarRo ro={x} />}
      {podeEditar && (
        <Recolhido titulo="Reavaliar ou corrigir">
          <FormularioDeRo ro={x} embutido />
        </Recolhido>
      )}
    </article>
  );
}
