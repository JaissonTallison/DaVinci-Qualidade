import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  NORMAS,
  PROCESSOS_AUDITADOS,
  type Auditoria,
  type DadosDoUsuario,
  type ModeloDeNc,
  type RoteiroDaAuditoria,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { TipoDaConstatacao } from "@/components/marcadores";
import { RespostaMarcador } from "@/components/marcadores-auditoria";
import { chamarApi } from "@/lib/api";
import { painel, tituloDaSecao } from "@/lib/estilos";
import { FormalizarNc } from "../acoes";
import { CabecalhoDaAuditoria } from "../cabecalho";
import { RegistrarAchado } from "./formulario";

export const metadata: Metadata = { title: "Registrar achados" };

/** Etapa Registrar: respostas Parcial e Não conforme viram constatações; as de NC são formalizadas na Qualidade. */
export default async function Achados({
  params,
  searchParams,
}: PageProps<"/auditorias/[id]/achados">) {
  const { id } = await params;
  const { aviso, nc } = (await searchParams) as { aviso?: string; nc?: string };
  const [a, r, eu] = await Promise.all([
    chamarApi<Auditoria>(`/auditorias/${id}`),
    chamarApi<RoteiroDaAuditoria>(`/auditorias/${id}/roteiro`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!a.ok && a.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!a.ok) return <AvisoDeErro erro={a.erro} />;
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const aud = a.dados;
  const podeEditar =
    eu.ok &&
    eu.dados.permissoes.includes("auditorias.editar") &&
    aud.status === "em_andamento";
  const registradas = new Set(
    aud.constatacoes.map((c) => c.perguntaCodigo).filter(Boolean),
  );
  const aRegistrar = r.dados.perguntas.filter(
    (p) =>
      (p.resposta === "parcial" || p.resposta === "nao_conforme") &&
      !registradas.has(p.codigo),
  );
  const pares = [...new Set(aRegistrar.map((p) => `${p.norma}|${p.clausula}`))];
  const buscas = await Promise.all(
    pares.map((par) => {
      const [norma, clausula] = par.split("|");
      return chamarApi<ModeloDeNc[]>(
        `/modelos-de-nc?norma=${norma}&clausula=${encodeURIComponent(clausula)}`,
      );
    }),
  );
  const modelosPor = new Map(
    pares.map((par, i) => [
      par,
      buscas[i].ok ? buscas[i].dados.slice(0, 40) : [],
    ]),
  );
  const voltar = `/auditorias/${id}/achados`;
  const texto =
    aviso === "nc"
      ? `Constatação formalizada: ${nc} aberta na Qualidade.`
      : aviso === "constatacao"
        ? "Constatação registrada."
        : undefined;

  return (
    <article>
      <CabecalhoDaAuditoria auditoria={aud} etapa="registrar" />
      {texto && (
        <p
          role="status"
          className="mt-4 rounded-sm border border-borda bg-superficie px-4 py-2.5 text-base"
        >
          {texto}
        </p>
      )}

      <section className={`${painel} mt-6`}>
        <div className="px-5 pt-5">
          <h2 className={tituloDaSecao}>Achados a registrar</h2>
          <p className="mt-1 text-base text-texto-2">
            Respostas Parcial ou Não conforme da execução que ainda não viraram
            constatação.
          </p>
        </div>
        {aRegistrar.length === 0 ? (
          <p className="px-5 py-5 text-base text-texto-2">
            Nenhum achado pendente.
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-borda border-t border-borda">
            {aRegistrar.map((p) => (
              <li key={p.codigo} className="px-5 py-4">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-texto-2">
                  <RespostaMarcador resposta={p.resposta} />
                  <span className="font-mono">
                    {NORMAS[p.norma]} {p.clausula}
                  </span>
                  <span>{PROCESSOS_AUDITADOS[p.processo]}</span>
                </p>
                <p className="mt-1 text-base font-semibold">{p.pergunta}</p>
                {p.evidencia && (
                  <p className="mt-1 text-sm text-texto-2">
                    Evidência: {p.evidencia}
                  </p>
                )}
                {podeEditar && (
                  <Recolhido titulo="Registrar como constatação">
                    <RegistrarAchado
                      auditoria={aud}
                      pergunta={p}
                      area={PROCESSOS_AUDITADOS[p.processo]}
                      modelos={modelosPor.get(`${p.norma}|${p.clausula}`) ?? []}
                    />
                  </Recolhido>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section id="constatacoes" className={`${painel} mt-6`}>
        <div className="px-5 pt-5">
          <h2 className={tituloDaSecao}>Constatações registradas</h2>
          <p className="mt-1 text-base text-texto-2">
            {aud.ncsPendentes > 0
              ? `${aud.ncsPendentes} NC a formalizar na Qualidade antes de concluir.`
              : "Todas as NCs formalizadas."}
          </p>
        </div>
        {aud.constatacoes.length === 0 ? (
          <p className="px-5 py-5 text-base text-texto-2">
            Nenhuma constatação ainda.
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-borda border-t border-borda">
            {aud.constatacoes.map((c) => (
              <li
                key={c.id}
                className="grid gap-3 px-5 py-3 lg:grid-cols-[12rem_minmax(0,1fr)_auto]"
              >
                <div className="flex flex-col gap-1">
                  <TipoDaConstatacao tipo={c.tipo} />
                  <span className="text-sm text-texto-2">
                    {NORMAS[c.norma]}
                    {c.clausula && ` · ${c.clausula}`}
                  </span>
                  {c.area && (
                    <span className="text-sm text-texto-3">{c.area}</span>
                  )}
                </div>
                <div>
                  <p className="text-base whitespace-pre-line">{c.descricao}</p>
                  {c.evidencia && (
                    <p className="mt-1 text-sm whitespace-pre-line text-texto-2">
                      Evidência: {c.evidencia}
                    </p>
                  )}
                  {c.causaRaiz && (
                    <p className="mt-1 text-sm text-texto-2">
                      Causa raiz provável: {c.causaRaiz}
                    </p>
                  )}
                </div>
                <div className="lg:text-right">
                  {c.ncId ? (
                    <Link
                      href={`/qualidade/nao-conformidades/${c.ncId}`}
                      className="font-mono text-sm font-medium text-info hover:underline"
                    >
                      {c.ncNumero}
                    </Link>
                  ) : (c.tipo === "nc_maior" || c.tipo === "nc_menor") &&
                    podeEditar ? (
                    <FormalizarNc
                      auditoria={aud}
                      constatacaoId={c.id}
                      voltar={voltar}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {podeEditar && (
        <Recolhido titulo="Constatação avulsa (fora do roteiro)">
          <p className="text-base text-texto-2">
            Algo visto fora das perguntas do roteiro. Para partir de um modelo,
            consulte o{" "}
            <Link
              href="/auditorias/banco-de-ncs"
              className="text-info hover:underline"
            >
              banco de NCs
            </Link>
            .
          </p>
          <RegistrarAchado auditoria={aud} modelos={[]} />
        </Recolhido>
      )}
    </article>
  );
}
