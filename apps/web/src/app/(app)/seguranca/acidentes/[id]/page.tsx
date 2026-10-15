import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ehAcidenteComLesao,
  type Acidente,
  type DadosDoUsuario,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { StatusDoAcidente, TipoDoAcidente } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";
import {
  botaoSecundario,
  painel,
  tituloDaPagina,
  tituloDaSecao,
} from "@/lib/estilos";
import { FormularioDeAcidente } from "../formulario";
import {
  CancelarAcidente,
  ConcluirInvestigacao,
  IniciarInvestigacao,
  RegistrarCat,
} from "./acoes";
import { Anexos } from "@/components/anexos";

export const metadata: Metadata = { title: "Acidente" };

const AVISOS: Record<string, string> = {
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
  registrado:
    "Registro feito. Acidente com lesão: registre a CAT até o primeiro dia útil seguinte.",
  salvo: "Registro salvo.",
  cat: "CAT registrada.",
  investigacao: "Investigação iniciada.",
  concluido: "Investigação concluída.",
  cancelado: "Registro cancelado.",
};

export default async function DetalheDoAcidente({
  params,
  searchParams,
}: PageProps<"/seguranca/acidentes/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Acidente>(`/acidentes/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const a = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const podeEditar = permissoes.includes("seguranca.editar");
  const aberto = a.status === "registrado" || a.status === "em_investigacao";
  const comLesao = ehAcidenteComLesao(a.tipo);

  return (
    <article className="max-w-6xl">
      <Link
        href="/seguranca/acidentes"
        className="text-sm text-texto-2 hover:underline"
      >
        Acidentes
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-lg text-texto-2">{a.numero}</span>
        <StatusDoAcidente status={a.status} />
        <TipoDoAcidente tipo={a.tipo} />
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>
        {a.acidentado ? `${a.acidentado} · ${a.local}` : a.local}
      </h1>
      {aviso && AVISOS[aviso] && (
        <p
          role="status"
          className="mt-4 rounded-sm border border-borda bg-superficie px-4 py-2.5 text-base text-texto"
        >
          {AVISOS[aviso]}
        </p>
      )}

      {a.catAtrasada && (
        <p
          role="alert"
          className="mt-4 rounded-sm border border-nao-conforme bg-nao-conforme/10 px-4 py-2.5 text-base text-texto"
        >
          CAT atrasada: o prazo legal era {formatarData(a.prazoCat!)} (primeiro
          dia útil depois do acidente).
        </p>
      )}

      <section className={`${painel} mt-6 p-5`}>
        <p className="max-w-[72ch] text-md whitespace-pre-line">
          {a.descricao}
        </p>
        <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
          <Dado rotulo="Data">
            {formatarData(a.data)}
            {a.hora && ` às ${a.hora}`}
          </Dado>
          {a.setor && <Dado rotulo="Setor">{a.setor}</Dado>}
          {a.funcao && <Dado rotulo="Função">{a.funcao}</Dado>}
          {a.lesao && <Dado rotulo="Lesão">{a.lesao}</Dado>}
          {a.parteDoCorpo && (
            <Dado rotulo="Parte do corpo">{a.parteDoCorpo}</Dado>
          )}
          {a.agenteCausador && (
            <Dado rotulo="Agente causador">{a.agenteCausador}</Dado>
          )}
          {a.tipo === "com_afastamento" && (
            <Dado rotulo="Dias perdidos">
              {a.diasPerdidos}
              {a.diasDebitados > 0 && ` + ${a.diasDebitados} debitados`}
            </Dado>
          )}
          {comLesao && (
            <Dado rotulo="CAT">
              {a.catNumero ? (
                <>
                  <span className="font-mono">{a.catNumero}</span> ·{" "}
                  {formatarData(a.catData!)}
                </>
              ) : (
                <span
                  className={
                    a.catAtrasada ? "text-nao-conforme" : "text-atencao"
                  }
                >
                  Pendente, prazo {formatarData(a.prazoCat!)}
                </span>
              )}
            </Dado>
          )}
          {a.testemunhas && <Dado rotulo="Testemunhas">{a.testemunhas}</Dado>}
        </dl>
        {a.medidasImediatas && (
          <Texto rotulo="Medidas imediatas" texto={a.medidasImediatas} />
        )}
      </section>

      {comLesao && !a.catNumero && a.status !== "cancelado" && podeEditar && (
        <RegistrarCat acidente={a} />
      )}
      {a.status === "registrado" && podeEditar && (
        <IniciarInvestigacao acidente={a} />
      )}
      {a.status === "em_investigacao" && podeEditar && (
        <ConcluirInvestigacao acidente={a} />
      )}

      {a.status === "concluido" && (
        <section className={`${painel} mt-6 p-5`}>
          <h2 className={tituloDaSecao}>Investigação</h2>
          {a.causas && <Texto rotulo="Causas" texto={a.causas} />}
          {a.medidas && (
            <Texto rotulo="Medidas para evitar a repetição" texto={a.medidas} />
          )}
        </section>
      )}
      {a.status === "cancelado" && a.motivoCancelamento && (
        <section className={`${painel} mt-6 p-5`}>
          <h2 className={tituloDaSecao}>Cancelamento</h2>
          <p className="mt-2 text-base">{a.motivoCancelamento}</p>
        </section>
      )}

      {a.status !== "cancelado" && permissoes.includes("qualidade.editar") && (
        <section
          className={`${painel} mt-6 flex flex-wrap items-center justify-between gap-3 p-5`}
        >
          <p className="max-w-2xl text-base text-texto-2">
            O tratamento (ação corretiva e verificação de eficácia) segue o
            ciclo da NC no Qualidade.
          </p>
          <Link
            href={`/qualidade/nao-conformidades/nova?acidente=${a.id}`}
            className={botaoSecundario}
          >
            Abrir NC
          </Link>
        </section>
      )}

      {aberto && podeEditar && (
        <Recolhido titulo="Corrigir o registro">
          <FormularioDeAcidente acidente={a} hoje={hojeEmBrasilia()} embutido />
        </Recolhido>
      )}
      {aberto && permissoes.includes("seguranca.excluir") && (
        <CancelarAcidente acidente={a} />
      )}
      <Anexos
        registro="acidente"
        registroId={a.id}
        voltar={`/seguranca/acidentes/${a.id}`}
        podeEditar={permissoes.includes("seguranca.editar")}
      />
    </article>
  );
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd className="mt-0.5 text-base">{children}</dd>
    </div>
  );
}

function Texto({ rotulo, texto }: { rotulo: string; texto: string }) {
  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-texto-2">{rotulo}</p>
      <p className="mt-1 max-w-[72ch] text-base whitespace-pre-line">{texto}</p>
    </div>
  );
}
