import type { Metadata } from "next";
import Link from "next/link";
import { ListFilter, Printer } from "lucide-react";
import {
  NORMAS,
  TEMAS_DO_ANEXO_A,
  type DadosDoUsuario,
  type EvidenciaDaBiblioteca,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import {
  botaoSecundario,
  campoCompacto,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";
import { Suspense } from "react";
import { BuscasSalvas } from "@/components/buscas-salvas";
import { CAPITULOS, PACKS, filtrosDaBiblioteca } from "./filtros";
import { ListaDeEvidencias } from "./lista";
import { NovaEvidenciaPropria } from "./nova";

export const metadata: Metadata = { title: "Biblioteca de evidências" };

/** Consulta livre: o que apresentar em cada cláusula de cada norma. */
export default async function Biblioteca({
  searchParams,
}: PageProps<"/auditorias/biblioteca">) {
  const f = (await searchParams) as Record<string, string | undefined>;
  const filtro = filtrosDaBiblioteca(f);
  const [r, eu] = await Promise.all([
    chamarApi<EvidenciaDaBiblioteca[]>(`/evidencias-de-auditoria?${filtro}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("auditorias.editar");
  const anexoA = f.norma === "iso27001" || f.clausula === "A";
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Biblioteca de evidências</h1>
          <p className="mt-1 max-w-3xl text-base text-texto-2">
            O que apresentar em cada cláusula das normas: tipo de evidência,
            risco se ela não existir, o que pedir e um exemplo aceitável. Na ISO
            27001, filtre pelo tema e pelo controle do Anexo A.
          </p>
        </div>
      </header>
      <Aviso
        avisos={{ evidencia: "Evidência salva na biblioteca." }}
        chave={f.aviso}
      />
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
          {anexoA && (
            <>
              <SelecaoDeFiltro
                nome="tema"
                rotulo="Tema do Anexo A"
                opcoes={TEMAS_DO_ANEXO_A}
                valor={f.tema}
              />
              <input
                name="controle"
                defaultValue={f.controle}
                placeholder="Controle (A.5.15)"
                aria-label="Controle"
                className={`${campoCompacto} w-36`}
              />
            </>
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
          {r.ok && r.dados.length > 0 && (
            <Link
              href={`/auditorias/biblioteca/imprimir?${filtro}`}
              className={`${botaoSecundario} ml-auto`}
            >
              <Printer aria-hidden size={16} strokeWidth={2} />
              Imprimir ({r.dados.length})
            </Link>
          )}
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
            Nenhuma evidência neste filtro.
          </p>
        ) : (
          <>
            <p className="border-b border-borda px-4 py-2 text-sm text-texto-2">
              {r.dados.length} evidências
            </p>
            <ListaDeEvidencias evidencias={r.dados} />
          </>
        )}
      </section>
      {podeEditar && (
        <Recolhido titulo="Nova evidência minha">
          <NovaEvidenciaPropria />
        </Recolhido>
      )}
    </>
  );
}
