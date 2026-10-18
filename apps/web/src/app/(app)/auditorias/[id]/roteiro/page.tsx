import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListFilter, Printer } from "lucide-react";
import {
  NORMAS,
  PROCESSOS_AUDITADOS,
  TIPOS_AUDITORIA,
  type Auditoria,
  type DadosDoUsuario,
  type PerguntaDeRoteiro,
  type RoteiroDaAuditoria,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { Recolhido } from "@/components/formulario-de-acao";
import { StatusDaAuditoria } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import {
  botaoSecundario,
  campoCompacto,
  painel,
  tituloDaPagina,
  tituloDaSecao,
} from "@/lib/estilos";
import { EtapasDaAuditoria } from "../etapas";
import { Suspense } from "react";
import { BuscasSalvas } from "@/components/buscas-salvas";
import { PACKS } from "../../biblioteca/filtros";
import { AbasDoPlanejar } from "../planejar-abas";
import {
  BancoDePerguntas,
  NovaPerguntaPropria,
  RetirarPergunta,
} from "./formularios";

export const metadata: Metadata = { title: "Roteiro de entrevista" };

/** Etapa Planejar: escolher as perguntas que serão feitas em campo (8 a 15 por processo é um roteiro realista). */
export default async function RoteiroDaAuditoriaPage({
  params,
  searchParams,
}: PageProps<"/auditorias/[id]/roteiro">) {
  const { id } = await params;
  const f = (await searchParams) as {
    pack?: string;
    processo?: string;
    norma?: string;
    clausula?: string;
    busca?: string;
    aviso?: string;
  };
  const filtro = new URLSearchParams();
  for (const k of ["pack", "processo", "norma", "clausula", "busca"] as const)
    if (f[k]) filtro.set(k, f[k]!);
  const filtrou = filtro.size > 0;
  const [a, roteiro, banco, eu] = await Promise.all([
    chamarApi<Auditoria>(`/auditorias/${id}`),
    chamarApi<RoteiroDaAuditoria>(`/auditorias/${id}/roteiro`),
    filtrou
      ? chamarApi<PerguntaDeRoteiro[]>(`/perguntas-de-auditoria?${filtro}`)
      : Promise.resolve(null),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!a.ok && a.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!a.ok) return <AvisoDeErro erro={a.erro} />;
  if (!roteiro.ok) return <AvisoDeErro erro={roteiro.erro} />;
  const r = roteiro.dados;
  const podeEditar =
    eu.ok &&
    eu.dados.permissoes.includes("auditorias.editar") &&
    !r.somenteLeitura;
  const porProcesso = Object.entries(PROCESSOS_AUDITADOS)
    .map(([k, n]) => ({
      k,
      n,
      perguntas: r.perguntas.filter((p) => p.processo === k),
    }))
    .filter((g) => g.perguntas.length);
  return (
    <article>
      <Link href="/auditorias" className="dv-voltar">
        Auditorias
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-lg text-texto-2">{a.dados.numero}</span>
        <StatusDaAuditoria status={a.dados.status} />
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>
        Auditoria {TIPOS_AUDITORIA[a.dados.tipo].toLowerCase()} ·{" "}
        {a.dados.normas.map((n) => NORMAS[n]).join(", ")}
      </h1>
      <EtapasDaAuditoria id={id} atual="planejar" />
      <AbasDoPlanejar id={id} atual="roteiro" />
      <Aviso
        avisos={{
          pergunta:
            "Pergunta salva em minhas perguntas. Marque-a no banco para incluir no roteiro.",
        }}
        chave={f.aviso}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className={painel} aria-label="Roteiro desta auditoria">
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5">
            <h2 className={tituloDaSecao}>Roteiro desta auditoria</h2>
            {r.perguntas.length > 0 && (
              <Link
                href={`/auditorias/${id}/roteiro/imprimir`}
                className={botaoSecundario}
              >
                <Printer aria-hidden size={16} strokeWidth={2} />
                Roteiro de campo
              </Link>
            )}
          </div>
          {r.perguntas.length === 0 ? (
            <p className="px-5 pt-2 pb-5 text-base text-texto-2">
              Nenhuma pergunta ainda. Filtre o banco ao lado por processo ou
              norma e inclua de 8 a 15 por processo.
            </p>
          ) : (
            <div className="mt-3">
              {porProcesso.map((g) => (
                <div key={g.k} className="border-t border-borda">
                  <p className="bg-superficie-2 px-5 py-1.5 text-xs font-semibold tracking-[0.06em] text-texto-2 uppercase">
                    {g.n} · {g.perguntas.length}
                  </p>
                  <ul className="divide-y divide-borda">
                    {g.perguntas.map((p) => (
                      <li
                        key={p.codigo}
                        className="flex items-start gap-3 px-5 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-base">{p.pergunta}</p>
                          <p className="text-sm text-texto-2">
                            <span className="font-mono">
                              {NORMAS[p.norma]} {p.clausula}
                            </span>
                            {p.resposta !== "pendente" && " · respondida"}
                          </p>
                        </div>
                        {podeEditar && p.resposta === "pendente" && (
                          <RetirarPergunta auditoriaId={id} codigo={p.codigo} />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={painel} aria-label="Banco de perguntas">
          <h2 className={`${tituloDaSecao} px-5 pt-5`}>Banco de perguntas</h2>
          <form className="flex flex-wrap items-end gap-2 border-b border-borda px-4 py-3">
            <SelecaoDeFiltro
              nome="pack"
              rotulo="Pack Anti-NC"
              opcoes={PACKS}
              valor={f.pack}
            />
            <SelecaoDeFiltro
              nome="processo"
              rotulo="Processo"
              opcoes={PROCESSOS_AUDITADOS}
              valor={f.processo}
            />
            <SelecaoDeFiltro
              nome="norma"
              rotulo="Norma"
              opcoes={NORMAS}
              valor={f.norma}
            />
            <input
              name="clausula"
              defaultValue={f.clausula}
              placeholder="Cláusula"
              aria-label="Cláusula"
              className={`${campoCompacto} w-24`}
            />
            <input
              name="busca"
              defaultValue={f.busca}
              placeholder="Palavra-chave"
              aria-label="Palavra-chave"
              className={`${campoCompacto} w-40`}
            />
            <button type="submit" className={botaoSecundario}>
              <ListFilter aria-hidden size={16} strokeWidth={2} />
              Filtrar
            </button>
          </form>
          <Suspense>
            <BuscasSalvas />
          </Suspense>
          {!banco ? (
            <p className="px-5 py-6 text-base text-texto-2">
              Escolha um pack, um processo, uma norma ou digite uma palavra para
              ver as perguntas.
            </p>
          ) : !banco.ok ? (
            <div className="p-4">
              <AvisoDeErro erro={banco.erro} />
            </div>
          ) : banco.dados.length === 0 ? (
            <p className="px-5 py-6 text-base text-texto-2">
              Nenhuma pergunta neste filtro.
            </p>
          ) : (
            <BancoDePerguntas
              auditoriaId={id}
              perguntas={banco.dados}
              noRoteiro={r.perguntas.map((p) => p.codigo)}
              podeEditar={podeEditar}
            />
          )}
        </section>
      </div>

      {podeEditar && (
        <Recolhido titulo="Criar pergunta minha (fica salva para as próximas auditorias)">
          <NovaPerguntaPropria auditoriaId={id} />
        </Recolhido>
      )}
    </article>
  );
}
