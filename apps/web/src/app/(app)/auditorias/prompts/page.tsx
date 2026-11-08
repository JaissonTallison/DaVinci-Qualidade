import type { Metadata } from "next";
import { Suspense } from "react";
import { ListFilter } from "@/components/icones";
import {
  NORMAS,
  PROCESSOS_AUDITADOS,
  TIPOS_DE_EVIDENCIA,
  type PromptDeIa,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { BotaoCopiar } from "@/components/botao-copiar";
import { BuscasSalvas } from "@/components/buscas-salvas";
import { SelecaoDeFiltro } from "@/components/filtros";
import { chamarApi } from "@/lib/api";
import { campoCompacto, painel } from "@/lib/estilos";
import { Botao } from "@/components/botao";
import { CabecalhoDaPagina } from "@/components/cabecalho-da-pagina";

export const metadata: Metadata = { title: "Prompts de IA" };

/** Comandos prontos para ferramentas de IA, por norma, categoria, processo e tipo de evidência. */
export default async function Prompts({
  searchParams,
}: PageProps<"/auditorias/prompts">) {
  const f = (await searchParams) as Record<string, string | undefined>;
  const filtro = new URLSearchParams();
  for (const k of ["norma", "processo", "busca"])
    if (f[k]) filtro.set(k, f[k]!);
  const [r, todos] = await Promise.all([
    chamarApi<PromptDeIa[]>(`/prompts-de-ia?${filtro}`),
    chamarApi<PromptDeIa[]>("/prompts-de-ia"),
  ]);
  const categorias = Object.fromEntries(
    [...new Set((todos.ok ? todos.dados : []).map((p) => p.categoria))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .map((c) => [c, c]),
  );
  const lista = r.ok
    ? r.dados.filter(
        (p) =>
          (!f.categoria || p.categoria === f.categoria) &&
          (!f.tipo || p.tipoEvidencia === f.tipo),
      )
    : [];
  return (
    <>
      <CabecalhoDaPagina
        titulo="Prompts de IA"
        descricao="Comandos prontos para colar no ChatGPT, Gemini ou Claude: redação de NC, causa raiz, plano de ação, comunicação com a liderança e outros. Revise a resposta com os dados reais; o prompt acelera a redação, não substitui a evidência."
      />
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-2 border-b border-borda px-4 py-3">
          <SelecaoDeFiltro
            nome="norma"
            rotulo="Norma"
            opcoes={NORMAS}
            valor={f.norma}
          />
          <SelecaoDeFiltro
            nome="categoria"
            rotulo="Categoria"
            opcoes={categorias}
            valor={f.categoria}
          />
          <SelecaoDeFiltro
            nome="processo"
            rotulo="Processo"
            opcoes={PROCESSOS_AUDITADOS}
            valor={f.processo}
          />
          <SelecaoDeFiltro
            nome="tipo"
            rotulo="Tipo de evidência"
            opcoes={TIPOS_DE_EVIDENCIA}
            valor={f.tipo}
          />
          <input
            name="busca"
            defaultValue={f.busca}
            placeholder="Palavra-chave"
            aria-label="Palavra-chave"
            className={`${campoCompacto} w-44`}
          />
          <Botao type="submit" icone={ListFilter}>
            Filtrar
          </Botao>
        </form>
        <Suspense>
          <BuscasSalvas />
        </Suspense>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : lista.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            Nenhum prompt neste filtro.
          </p>
        ) : (
          <>
            <p className="border-b border-borda px-4 py-2 text-sm text-texto-2">
              {lista.length} prompts
            </p>
            <ul className="divide-y divide-borda">
              {lista.map((p) => (
                <li key={p.codigo} className="px-4 py-2.5">
                  <details>
                    <summary className="flex dv-abrir cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="w-28 shrink-0 text-sm font-semibold text-texto-2">
                        {NORMAS[p.norma]}
                      </span>
                      <span className="w-16 shrink-0 font-mono text-sm">
                        {p.clausula}
                      </span>
                      <span className="min-w-0 basis-full text-base sm:basis-0 sm:flex-1">
                        {p.titulo}
                      </span>
                      <span className="text-sm text-texto-2">
                        {p.categoria}
                      </span>
                    </summary>
                    <div className="mt-2 grid gap-2 text-sm sm:pl-[11.5rem]">
                      <p>
                        <span className="font-semibold">Objetivo:</span>{" "}
                        {p.objetivo}
                      </p>
                      <pre className="max-h-64 overflow-auto rounded-xs bg-superficie-2 p-3 font-sans whitespace-pre-wrap">
                        {p.prompt}
                      </pre>
                      {p.dica && (
                        <p className="text-texto-2">
                          <span className="font-semibold">Dica:</span> {p.dica}
                        </p>
                      )}
                      <p className="text-texto-3">
                        {p.processo && PROCESSOS_AUDITADOS[p.processo]}
                        {p.processo && p.tipoEvidencia && " · "}
                        {p.tipoEvidencia && TIPOS_DE_EVIDENCIA[p.tipoEvidencia]}
                      </p>
                      <div>
                        <BotaoCopiar texto={p.prompt} rotulo="Copiar prompt" />
                      </div>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
