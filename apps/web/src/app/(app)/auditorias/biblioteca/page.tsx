import type { Metadata } from "next";
import { ListFilter, Printer } from "@/components/icones";
import {
  NORMAS,
  TEMAS_DO_ANEXO_A,
  type DadosDoUsuario,
  type EvidenciaDaBiblioteca,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { Recolhido } from "@/components/recolhido";
import { chamarApi } from "@/lib/api";
import { campoCompacto, painel } from "@/lib/estilos";
import { Suspense } from "react";
import { BuscasSalvas } from "@/components/buscas-salvas";
import { CAPITULOS, PACKS, filtrosDaBiblioteca } from "./filtros";
import { ListaDeEvidencias } from "./lista";
import { NovaEvidenciaPropria } from "./nova";
import { Botao } from "@/components/botao";
import { CabecalhoDaPagina } from "@/components/cabecalho-da-pagina";

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
      <CabecalhoDaPagina
        titulo="Biblioteca de evidências"
        descricao="O que apresentar em cada cláusula das normas: tipo de evidência, risco se ela não existir, o que pedir e um exemplo aceitável. Na ISO 27001, filtre pelo tema e pelo controle do Anexo A."
      />
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
          <Botao type="submit" icone={ListFilter}>
            Filtrar
          </Botao>
          {r.ok && r.dados.length > 0 && (
            <Botao
              href={`/auditorias/biblioteca/imprimir?${filtro}`}
              icone={Printer}
              className="ml-auto"
            >
              Imprimir ({r.dados.length})
            </Botao>
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
