import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ehAcidenteComLesao,
  type Acidente,
  type DadosDoUsuario,
  type NaoConformidadeResumo,
  type Pagina,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import {
  GravidadeDaNc,
  StatusDaNc,
  StatusDoAcidente,
  TipoDoAcidente,
} from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";
import {
  botaoSecundario,
  cabecalhoDoPainel,
  painel,
  tituloDaPagina,
  tituloDoPainel,
} from "@/lib/estilos";
import { FormularioDeAcidente } from "../formulario";
import {
  CancelarAcidente,
  ConcluirInvestigacao,
  IniciarInvestigacao,
  RegistrarCat,
} from "./acoes";
import { Anexos } from "@/components/anexos";
import { ArvoreDeCausas } from "./arvore";
import { InvestigacaoEstruturada } from "./investigacao";
import { LinhaDoTempoDoAcidente } from "./linha-do-tempo";

import { CabecalhoComVoltar } from "@/components/pagina-de-cadastro";
import { CaixaDeAlerta } from "@/components/caixa-de-alerta";
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
  "investigacao-salva": "Investigação salva.",
  "dados-cat": "Dados da CAT para o eSocial salvos.",
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
  const ncsGeradas = await chamarApi<Pagina<NaoConformidadeResumo>>(
    `/nao-conformidades?origemRef=${encodeURIComponent(a.numero)}&porPagina=50`,
  );
  const ncs = ncsGeradas.ok ? ncsGeradas.dados.itens : [];
  const comLesao = ehAcidenteComLesao(a.tipo);
  const temInvestigacao =
    a.investigacao.testemunhas.length +
      a.investigacao.porques.length +
      a.investigacao.fatos.length >
    0;

  return (
    <article>
      <CabecalhoComVoltar
        voltar={{ href: "/seguranca/acidentes", rotulo: "Acidentes" }}
      >
        <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-mono text-lg text-texto-2">{a.numero}</span>
          <StatusDoAcidente status={a.status} />
          <TipoDoAcidente tipo={a.tipo} />
        </header>
        <h1 className={`${tituloDaPagina} mt-1`}>
          {a.acidentado ? `${a.acidentado} · ${a.local}` : a.local}
        </h1>
      </CabecalhoComVoltar>

      <section className={`${painel} mt-6`}>
        <header className={cabecalhoDoPainel}>
          <h2 className={tituloDoPainel}>Linha do tempo</h2>
        </header>
        <div className="p-5">
          <LinhaDoTempoDoAcidente a={a} />
        </div>
      </section>

      {ncs.length > 0 && (
        <section className={`${painel} mt-6`}>
          <header className={cabecalhoDoPainel}>
            <h2 className={tituloDoPainel}>Não conformidades geradas</h2>
          </header>
          <div className="p-5">
            <ul className="divide-y divide-borda">
              {ncs.map((n) => (
                <li
                  key={n.id}
                  className="flex flex-wrap items-center gap-x-6 gap-y-1 py-2.5"
                >
                  <Link
                    href={`/qualidade/nao-conformidades/${n.id}`}
                    className="font-mono text-sm font-medium text-acao hover:underline"
                  >
                    {n.numero}
                  </Link>
                  <span className="min-w-48 flex-1">{n.titulo}</span>
                  <GravidadeDaNc gravidade={n.gravidade} />
                  <StatusDaNc status={n.status} vencida={n.vencida} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      {aviso && AVISOS[aviso] && (
        <CaixaDeAlerta tom="sucesso" className="mt-4">
          {AVISOS[aviso]}
        </CaixaDeAlerta>
      )}

      {a.catAtrasada && (
        <CaixaDeAlerta tom="perigo" className="mt-4">
          CAT atrasada: o prazo legal era {formatarData(a.prazoCat!)} (primeiro
          dia útil depois do acidente).
        </CaixaDeAlerta>
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
      {a.status === "em_investigacao" && podeEditar ? (
        <section id="investigacao" className={`${painel} mt-6`}>
          <header className={cabecalhoDoPainel}>
            <h2 className={tituloDoPainel}>Investigação</h2>
          </header>
          <div className="p-5">
            <InvestigacaoEstruturada acidente={a} />
            {a.investigacao.fatos.length > 0 && (
              <div className="mt-5 border-t border-borda pt-4">
                <ArvoreDeCausas fatos={a.investigacao.fatos} />
              </div>
            )}
          </div>
        </section>
      ) : (
        temInvestigacao && (
          <section id="investigacao" className={`${painel} mt-6`}>
            <header className={cabecalhoDoPainel}>
              <h2 className={tituloDoPainel}>Investigação</h2>
            </header>
            <div className="p-5">
              {a.investigacao.testemunhas.length > 0 && (
                <>
                  <h3 className="mt-4 text-sm font-semibold text-texto-2">
                    Relatos
                  </h3>
                  <ul className="mt-2 flex flex-col gap-2 text-base">
                    {a.investigacao.testemunhas.map((t, i) => (
                      <li key={i}>
                        <span className="font-semibold">{t.nome}</span>
                        {t.funcao && (
                          <span className="text-texto-2"> · {t.funcao}</span>
                        )}
                        : {t.relato}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {a.investigacao.porques.length > 0 && (
                <>
                  <h3 className="mt-4 text-sm font-semibold text-texto-2">
                    5 porquês
                  </h3>
                  <ol className="mt-2 list-decimal pl-5 text-base">
                    {a.investigacao.porques.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ol>
                </>
              )}
              <div className="mt-3">
                <ArvoreDeCausas fatos={a.investigacao.fatos} />
              </div>
            </div>
          </section>
        )
      )}
      {a.status === "em_investigacao" && podeEditar && (
        <ConcluirInvestigacao acidente={a} />
      )}
      {a.status === "concluido" && (
        <section className={`${painel} mt-6`}>
          <header className={cabecalhoDoPainel}>
            <h2 className={tituloDoPainel}>Conclusão da investigação</h2>
          </header>
          <div className="p-5">
            {a.causas && <Texto rotulo="Causas" texto={a.causas} />}
            {a.medidas && (
              <Texto
                rotulo="Medidas para evitar a repetição"
                texto={a.medidas}
              />
            )}
          </div>
        </section>
      )}
      {a.status === "cancelado" && a.motivoCancelamento && (
        <section className={`${painel} mt-6`}>
          <header className={cabecalhoDoPainel}>
            <h2 className={tituloDoPainel}>Cancelamento</h2>
          </header>
          <div className="p-5">
            <p className="text-base">{a.motivoCancelamento}</p>
          </div>
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
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/qualidade/nao-conformidades/nova?acidente=${a.id}`}
              className={botaoSecundario}
            >
              Abrir NC
            </Link>
            <Link
              href={`/qualidade/planos-de-acao/novo?acidente=${a.id}`}
              className={botaoSecundario}
            >
              Criar plano de ação
            </Link>
          </div>
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
