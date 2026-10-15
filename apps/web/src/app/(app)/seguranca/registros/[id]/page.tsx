import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  TIPOS_REGISTRO_SST,
  type DadosDoUsuario,
  type RegistroSst,
} from "@davinci/types";
import { Anexos } from "@/components/anexos";
import { AnularRegistro } from "@/components/anular-registro";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { anularRegistroSst } from "@/lib/acoes-pgr-pt";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";

export const metadata: Metadata = { title: "Registro de segurança" };

const AVISOS: Record<string, string> = {
  criado: "Registro salvo. Anexe a lista de presença assinada, se houver.",
  anulado: "Registro anulado.",
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
};

export default async function DetalheDoRegistro({
  params,
  searchParams,
}: PageProps<"/seguranca/registros/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<RegistroSst>(`/registros-de-seguranca/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const x = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const t = TIPOS_REGISTRO_SST[x.tipo];
  return (
    <article className="max-w-5xl">
      <Link
        href="/seguranca/registros"
        className="text-sm text-texto-2 hover:underline"
      >
        Registros de segurança
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-texto-2">
          {t.rotulo} · {formatarData(x.data)}
          {x.motivoAnulacao ? " · Anulado" : ""}
        </span>
        {!x.motivoAnulacao && permissoes.includes("seguranca.excluir") && (
          <AnularRegistro id={x.id} acao={anularRegistroSst.bind(null, x.id)} />
        )}
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>{x.tema}</h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-texto-2">Conduziu</dt>
            <dd className="mt-0.5">{x.responsavel}</dd>
          </div>
          <div>
            <dt className="text-xs text-texto-2">Participantes</dt>
            <dd className="mt-0.5 tabular-nums">{x.participantes}</dd>
          </div>
          {x.local && (
            <div>
              <dt className="text-xs text-texto-2">Local</dt>
              <dd className="mt-0.5">{x.local}</dd>
            </div>
          )}
          <div className="sm:col-span-3">
            <dt className="text-xs text-texto-2">{t.conteudo}</dt>
            <dd className="mt-0.5 whitespace-pre-line">{x.conteudo}</dd>
          </div>
          {x.motivoAnulacao && (
            <div className="sm:col-span-3">
              <dt className="text-xs text-texto-2">Motivo da anulação</dt>
              <dd className="mt-0.5">{x.motivoAnulacao}</dd>
            </div>
          )}
        </dl>
      </section>
      <Anexos
        registro="registro_sst"
        registroId={x.id}
        voltar={`/seguranca/registros/${x.id}`}
        podeEditar={
          permissoes.includes("seguranca.editar") && !x.motivoAnulacao
        }
      />
    </article>
  );
}
