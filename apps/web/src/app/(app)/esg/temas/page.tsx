import type { Metadata } from "next";
import Link from "next/link";
import { ListFilter } from "lucide-react";
import {
  CATALOGO_ESG,
  PILARES,
  type DadosDoUsuario,
  type TemaEsg,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { IconeDaTela } from "@/components/icones-do-menu";
import { IconeOds, Materialidade } from "@/components/marcadores-esg";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";
import { ImportarCatalogo } from "./importar";

export const metadata: Metadata = { title: "Temas ESG" };

export default async function Temas({ searchParams }: PageProps<"/esg/temas">) {
  const { pilar, aviso, criados } = (await searchParams) as {
    pilar?: string;
    aviso?: string;
    criados?: string;
  };
  const [r, todos, eu] = await Promise.all([
    chamarApi<TemaEsg[]>(
      `/esg/temas${pilar ? `?pilar=${encodeURIComponent(pilar)}` : ""}`,
    ),
    chamarApi<TemaEsg[]>("/esg/temas?situacao=todos"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const faltamDoCatalogo = todos.ok
    ? CATALOGO_ESG.filter(
        (c) => !todos.dados.some((t) => t.codigoCatalogo === c.codigo),
      ).length
    : 0;
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Temas ESG</h1>
          <p className="mt-1 max-w-2xl text-base text-texto-2">
            Os temas ambientais, sociais e de governança da empresa. Dupla
            materialidade = impacto × relevância (1 a 5 cada); a partir de 15 o
            tema é material e ganha meta, responsável e prazo.
          </p>
        </div>
        {permissoes.includes("esg.editar") && (
          <Link href="/esg/temas/novo" className={botaoPrimario}>
            <IconeDaTela href="/esg/temas" />
            Novo tema
          </Link>
        )}
      </header>
      <Aviso
        avisos={{
          importado:
            criados === "0"
              ? "O catálogo já estava todo importado."
              : `${criados} temas importados do catálogo. Avalie impacto e relevância de cada um.`,
        }}
        chave={aviso}
      />
      {permissoes.includes("esg.importar-catalogo") && faltamDoCatalogo > 0 && (
        <section
          className={`${painel} mt-6 flex flex-wrap items-center justify-between gap-4 p-5`}
        >
          <div className="max-w-2xl">
            <p className="text-base font-semibold">Catálogo de referência</p>
            <p className="mt-0.5 text-sm text-texto-2">
              {CATALOGO_ESG.length} temas da Agenda ESG (mudanças climáticas,
              recursos hídricos, direitos humanos, conduta empresarial e
              outros), com os subtemas e os ODS ligados.{" "}
              {faltamDoCatalogo === CATALOGO_ESG.length
                ? "Importe para começar e depois avalie ou inative o que não se aplica."
                : `Faltam ${faltamDoCatalogo} temas do catálogo.`}
            </p>
          </div>
          <ImportarCatalogo
            rotulo={
              faltamDoCatalogo === CATALOGO_ESG.length
                ? "Importar o catálogo"
                : "Importar os que faltam"
            }
          />
        </section>
      )}
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3">
          <SelecaoDeFiltro
            nome="pilar"
            rotulo="Pilar"
            opcoes={PILARES}
            valor={pilar}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
        </form>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : r.dados.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            Nenhum tema{pilar ? " neste pilar" : ""}.
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-xs text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Tema</th>
                  <th className="px-4 py-2 font-semibold">Pilar</th>
                  <th className="px-4 py-2 font-semibold">Materialidade</th>
                  <th className="px-4 py-2 font-semibold">ODS</th>
                  <th className="px-4 py-2 font-semibold">Meta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {r.dados.map((t) => (
                  <tr key={t.id} className="hover:bg-superficie-2">
                    <td className="max-w-sm px-4 py-2">
                      <Link
                        href={`/esg/temas/${t.id}`}
                        className="text-info hover:underline"
                      >
                        {t.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-texto-2">
                      {PILARES[t.pilar]}
                    </td>
                    <td className="px-4 py-2">
                      <Materialidade nivel={t.nivel} nota={t.nota} />
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex flex-wrap gap-1">
                        {t.ods.map((n) => (
                          <IconeOds key={n} numero={n} />
                        ))}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-2 text-sm whitespace-nowrap ${t.metaAtrasada ? "text-nao-conforme" : "text-texto-2"}`}
                    >
                      {t.prazoMeta
                        ? `${t.progresso}% · até ${formatarData(t.prazoMeta)}${t.metaAtrasada ? " · atrasada" : ""}`
                        : t.material
                          ? "Sem meta"
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
