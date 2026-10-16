import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  NORMAS,
  PROCESSOS_AUDITADOS,
  TIPOS_DE_CRITERIO,
  TIPOS_DE_DESVIO,
  type CriterioProprio,
  type DadosDoUsuario,
  type EvidenciaDaBiblioteca,
  type ModeloDeNc,
  type PerguntaDeRoteiro,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import {
  RiscoDaEvidenciaMarcador,
  TipoDaEvidencia,
} from "@/components/marcadores-auditoria";
import { chamarApi } from "@/lib/api";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { NovaEvidenciaPropria } from "../biblioteca/nova";
import {
  ExcluirProprio,
  ImportarPlanilha,
  NovoCriterio,
  NovoModeloNc,
} from "./formularios";

export const metadata: Metadata = { title: "Minha biblioteca" };

const ABAS = {
  criterios: "Critérios",
  perguntas: "Perguntas",
  evidencias: "Evidências",
  ncs: "NCs",
  importar: "Importar planilha",
} as const;
type Aba = keyof typeof ABAS;

/** O que a empresa acrescenta aos bancos: critérios, perguntas, evidências e modelos de NC próprios. */
export default async function MinhaBiblioteca({
  searchParams,
}: PageProps<"/auditorias/minha-biblioteca">) {
  const f = (await searchParams) as {
    aba?: string;
    aviso?: string;
    n?: string;
  };
  const aba: Aba = f.aba && f.aba in ABAS ? (f.aba as Aba) : "criterios";
  const [criterios, perguntas, evidencias, modelos, eu] = await Promise.all([
    chamarApi<CriterioProprio[]>("/criterios-de-auditoria"),
    chamarApi<PerguntaDeRoteiro[]>("/perguntas-de-auditoria"),
    chamarApi<EvidenciaDaBiblioteca[]>("/evidencias-de-auditoria"),
    chamarApi<ModeloDeNc[]>("/modelos-de-nc"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("auditorias.editar");
  const minhas = {
    perguntas: perguntas.ok
      ? perguntas.dados.filter((p) => p.origem === "propria")
      : [],
    evidencias: evidencias.ok
      ? evidencias.dados.filter((e) => e.origem === "propria")
      : [],
    ncs: modelos.ok ? modelos.dados.filter((m) => m.origem === "propria") : [],
  };
  const contagem: Record<Aba, number | null> = {
    criterios: criterios.ok ? criterios.dados.length : 0,
    perguntas: minhas.perguntas.length,
    evidencias: minhas.evidencias.length,
    ncs: minhas.ncs.length,
    importar: null,
  };
  const avisos: Record<string, string> = {
    criterio: "Critério salvo.",
    modelo: "Modelo de NC salvo.",
    importado: `${f.n ?? "As"} linha(s) importada(s).`,
  };
  const erro = [criterios, perguntas, evidencias, modelos].find((r) => !r.ok);

  return (
    <>
      <h1 className={tituloDaPagina}>Minha biblioteca</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        O que a empresa acrescenta aos bancos do sistema: critérios além das
        normas (legislação, norma interna, contrato), perguntas, evidências e
        modelos de NC próprios. Eles aparecem junto com os do sistema nos
        roteiros, na biblioteca e no banco de NCs.
      </p>
      {f.aviso && avisos[f.aviso] && (
        <p
          role="status"
          className="mt-4 rounded-sm border border-borda bg-superficie px-4 py-2.5 text-base"
        >
          {avisos[f.aviso]}
        </p>
      )}
      {erro && !erro.ok && <AvisoDeErro erro={erro.erro} />}
      <nav
        aria-label="Minha biblioteca"
        className="mt-6 flex flex-wrap gap-2 border-b border-borda"
      >
        {(Object.keys(ABAS) as Aba[]).map((k) => (
          <Link
            key={k}
            href={`?aba=${k}`}
            aria-current={aba === k ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 pb-2.5 text-base ${aba === k ? "border-menu font-semibold text-texto" : "border-transparent text-texto-2 hover:text-texto"}`}
          >
            {ABAS[k]}
            {contagem[k] !== null && (
              <span className="ml-1.5 text-sm text-texto-3 tabular-nums">
                {contagem[k]}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {aba === "criterios" && (
        <>
          <Lista vazio="Nenhum critério próprio. Cadastre leis, normas internas ou requisitos de contrato que entram como critério de auditoria.">
            {criterios.ok &&
              criterios.dados.map((c) => (
                <li key={c.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-base font-semibold">
                      {c.nome}{" "}
                      <span className="text-sm font-normal text-texto-2">
                        · {TIPOS_DE_CRITERIO[c.tipo]}
                        {c.referencia && ` · ${c.referencia}`}
                      </span>
                    </p>
                    {podeEditar && (
                      <ExcluirProprio tipo="criterio" id={c.id} nome={c.nome} />
                    )}
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-line text-texto-2">
                    {c.requisitos}
                  </p>
                </li>
              ))}
          </Lista>
          {podeEditar && (
            <Recolhido titulo="Novo critério">
              <NovoCriterio />
            </Recolhido>
          )}
        </>
      )}

      {aba === "perguntas" && (
        <>
          <Lista vazio="Nenhuma pergunta própria. Crie no roteiro de uma auditoria ou importe por planilha.">
            {minhas.perguntas.map((p) => (
              <li key={p.codigo} className="px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm text-texto-2">
                    <span className="font-mono">
                      {NORMAS[p.norma]} {p.clausula}
                    </span>{" "}
                    · {PROCESSOS_AUDITADOS[p.processo]}
                  </p>
                  {podeEditar && (
                    <ExcluirProprio
                      tipo="pergunta"
                      id={p.codigo}
                      nome={p.pergunta}
                    />
                  )}
                </div>
                <p className="mt-1 text-base">{p.pergunta}</p>
                <p className="mt-0.5 text-sm text-texto-2">
                  Esperada: {p.respostaEsperada} · Alerta: {p.sinalDeAlerta}
                </p>
              </li>
            ))}
          </Lista>
        </>
      )}

      {aba === "evidencias" && (
        <>
          <Lista vazio="Nenhuma evidência própria.">
            {minhas.evidencias.map((e) => (
              <li key={e.codigo} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex flex-wrap items-center gap-x-3 text-base">
                    <span className="font-mono text-sm text-texto-2">
                      {NORMAS[e.norma]} {e.clausula}
                    </span>
                    {e.titulo}
                    <TipoDaEvidencia tipo={e.tipo} />
                    <RiscoDaEvidenciaMarcador risco={e.risco} />
                  </p>
                  {podeEditar && (
                    <ExcluirProprio
                      tipo="evidencia"
                      id={e.codigo}
                      nome={e.titulo}
                    />
                  )}
                </div>
                <p className="mt-1 text-sm text-texto-2">
                  O que pedir: {e.oQuePedir}
                </p>
              </li>
            ))}
          </Lista>
          {podeEditar && (
            <Recolhido titulo="Nova evidência">
              <NovaEvidenciaPropria />
            </Recolhido>
          )}
        </>
      )}

      {aba === "ncs" && (
        <>
          <Lista vazio="Nenhum modelo de NC próprio.">
            {minhas.ncs.map((m) => (
              <li key={m.codigo} className="px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-base font-semibold">
                    {m.titulo}{" "}
                    <span className="font-mono text-sm font-normal text-texto-2">
                      · {NORMAS[m.norma]} {m.clausula} ·{" "}
                      {TIPOS_DE_DESVIO[m.tipo]}
                    </span>
                  </p>
                  {podeEditar && (
                    <ExcluirProprio
                      tipo="modelo"
                      id={m.codigo}
                      nome={m.titulo}
                    />
                  )}
                </div>
                <p className="mt-1 text-sm">{m.descricao}</p>
              </li>
            ))}
          </Lista>
          {podeEditar && (
            <Recolhido titulo="Novo modelo de NC">
              <NovoModeloNc />
            </Recolhido>
          )}
        </>
      )}

      {aba === "importar" &&
        (podeEditar ? (
          <section className={`${painel} mt-6 p-5`}>
            <p className="text-base text-texto-2">
              Traga perguntas, evidências ou modelos de NC de uma planilha. Tudo
              é conferido antes de gravar: com uma linha errada, nada entra e a
              mensagem diz o que corrigir.
            </p>
            <ImportarPlanilha />
          </section>
        ) : (
          <p className={`${painel} mt-6 px-5 py-4 text-base text-texto-2`}>
            Importar pede a permissão de editar auditorias.
          </p>
        ))}
    </>
  );
}

function Lista({ vazio, children }: { vazio: string; children: ReactNode }) {
  const itens = Array.isArray(children)
    ? children.flat().filter(Boolean)
    : children
      ? [children]
      : [];
  return (
    <section className={`${painel} mt-6`}>
      {itens.length === 0 ? (
        <p className="px-4 py-6 text-base text-texto-2">{vazio}</p>
      ) : (
        <ul className="divide-y divide-borda">{children}</ul>
      )}
    </section>
  );
}
