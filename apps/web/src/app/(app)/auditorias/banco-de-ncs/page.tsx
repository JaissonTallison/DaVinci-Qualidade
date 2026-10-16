import type { Metadata } from "next";
import { Suspense } from "react";
import { ListFilter } from "lucide-react";
import { NORMAS, TIPOS_DE_DESVIO, type ModeloDeNc } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { BotaoCopiar } from "@/components/botao-copiar";
import { BuscasSalvas } from "@/components/buscas-salvas";
import { SelecaoDeFiltro } from "@/components/filtros";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import {
  botaoSecundario,
  campoCompacto,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";
import { CAPITULOS, PACKS } from "../biblioteca/filtros";
import { AssistenteDeNc } from "./assistente";

export const metadata: Metadata = { title: "Banco de NCs" };

/** Consulta dos modelos de NC: redação, causa raiz comum, ação corretiva e evidência de fechamento. */
export default async function BancoDeNcs({
  searchParams,
}: PageProps<"/auditorias/banco-de-ncs">) {
  const f = (await searchParams) as Record<string, string | undefined>;
  const filtro = new URLSearchParams();
  for (const k of ["pack", "norma", "clausula", "tipo", "controle", "busca"])
    if (f[k]) filtro.set(k, f[k]!);
  const r = await chamarApi<ModeloDeNc[]>(`/modelos-de-nc?${filtro}`);
  return (
    <>
      <h1 className={tituloDaPagina}>Banco de NCs</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        Modelos de redação de não conformidade por norma e cláusula, com a causa
        raiz comum, a ação corretiva e a evidência de fechamento. Na auditoria,
        escolha o modelo na etapa Registrar e ajuste ao que foi visto.
      </p>
      <Recolhido titulo="Assistente de NC: prompts para reescrever, achar a causa e montar o plano">
        <AssistenteDeNc />
      </Recolhido>
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-2 border-b border-borda px-4 py-3">
          <SelecaoDeFiltro
            nome="pack"
            rotulo="Pack Anti-NC"
            opcoes={PACKS}
            valor={f.pack}
          />
          <SelecaoDeFiltro
            nome="norma"
            rotulo="Norma"
            opcoes={NORMAS}
            valor={f.norma}
          />
          <SelecaoDeFiltro
            nome="clausula"
            rotulo="Cláusula"
            opcoes={CAPITULOS}
            valor={f.clausula}
          />
          <SelecaoDeFiltro
            nome="tipo"
            rotulo="Tipo de desvio"
            opcoes={TIPOS_DE_DESVIO}
            valor={f.tipo}
          />
          {(f.norma === "iso27001" || f.clausula === "A") && (
            <input
              name="controle"
              defaultValue={f.controle}
              placeholder="Controle (A.5.15)"
              aria-label="Controle"
              className={`${campoCompacto} w-36`}
            />
          )}
          <input
            name="busca"
            defaultValue={f.busca}
            placeholder="Palavra-chave"
            aria-label="Palavra-chave"
            className={`${campoCompacto} w-44`}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
        </form>
        <Suspense>
          <BuscasSalvas />
        </Suspense>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : r.dados.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            Nenhum modelo neste filtro.
          </p>
        ) : (
          <>
            <p className="border-b border-borda px-4 py-2 text-sm text-texto-2">
              {r.dados.length} modelos
            </p>
            <ul className="divide-y divide-borda">
              {r.dados.map((m) => (
                <li key={m.codigo} className="px-4 py-2.5">
                  <details>
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="w-28 shrink-0 text-sm font-semibold text-texto-2">
                        {NORMAS[m.norma]}
                      </span>
                      <span className="w-20 shrink-0 font-mono text-sm">
                        {m.controle ?? m.clausula}
                      </span>
                      <span className="min-w-0 basis-full text-base sm:basis-0 sm:flex-1">
                        {m.titulo}
                        {m.origem === "propria" && (
                          <span className="text-sm text-texto-2"> · minha</span>
                        )}
                      </span>
                      <span className="text-sm text-texto-2">
                        {TIPOS_DE_DESVIO[m.tipo]}
                      </span>
                    </summary>
                    <div className="mt-2 grid gap-1.5 text-sm sm:pl-[12.5rem]">
                      <p className="text-base">{m.descricao}</p>
                      <p>
                        <span className="font-semibold">Causa raiz comum:</span>{" "}
                        {m.causaRaiz}
                      </p>
                      <p>
                        <span className="font-semibold">Ação corretiva:</span>{" "}
                        {m.acaoCorretiva}
                      </p>
                      <p>
                        <span className="font-semibold">
                          Evidência de fechamento:
                        </span>{" "}
                        {m.evidenciaFechamento}
                      </p>
                      <div className="mt-1">
                        <BotaoCopiar
                          texto={m.descricao}
                          rotulo="Copiar redação"
                        />
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
