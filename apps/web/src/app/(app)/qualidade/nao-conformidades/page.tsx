import { ListFilter } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import {
  GRAVIDADES_NC,
  ORIGENS_NC,
  STATUS_NC,
  type DadosDoUsuario,
  type NaoConformidadeResumo,
  type Pagina,
  type ResumoNcs,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { GravidadeDaNc, StatusDaNc } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, prazoRelativo } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  campoCompacto,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Não conformidades" };

const FILTROS = [
  "busca",
  "status",
  "gravidade",
  "origem",
  "vencidas",
  "pagina",
] as const;

export default async function ListaDeNcs({
  searchParams,
}: PageProps<"/qualidade/nao-conformidades">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number], string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const [lista, resumo, eu] = await Promise.all([
    chamarApi<Pagina<NaoConformidadeResumo>>(`/nao-conformidades?${consulta}`),
    chamarApi<ResumoNcs>("/nao-conformidades/resumo"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeAbrir = eu.ok && eu.dados.permissoes.includes("qualidade.editar");
  const filtrando = FILTROS.some((f) => f !== "pagina" && params[f]);

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Não conformidades</h1>
          {resumo.ok && (
            <p className="mt-1 text-base text-texto-2">
              {resumo.dados.abertas} em aberto · {resumo.dados.vencidas}{" "}
              {resumo.dados.vencidas === 1 ? "vencida" : "vencidas"} ·{" "}
              {resumo.dados.graves} altas ou críticas
            </p>
          )}
        </div>
        {podeAbrir && (
          <Link
            href="/qualidade/nao-conformidades/nova"
            className={botaoPrimario}
          >
            <IconeDaTela href={"/qualidade/nao-conformidades/nova"} />
            Abrir NC
          </Link>
        )}
      </header>

      <section className={`${painel} mt-6`}>
        <form
          className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3"
          role="search"
        >
          <input
            name="busca"
            defaultValue={params.busca}
            placeholder="Número ou título"
            aria-label="Buscar por número ou título"
            className={`${campoCompacto} w-56`}
          />
          <SelecaoDeFiltro
            nome="status"
            rotulo="Status"
            opcoes={STATUS_NC}
            valor={params.status}
          />
          <SelecaoDeFiltro
            nome="gravidade"
            rotulo="Gravidade"
            opcoes={GRAVIDADES_NC}
            valor={params.gravidade}
          />
          <SelecaoDeFiltro
            nome="origem"
            rotulo="Origem"
            opcoes={ORIGENS_NC}
            valor={params.origem}
          />
          <label className="flex h-9 items-center gap-2 text-base text-texto-2">
            <input
              type="checkbox"
              name="vencidas"
              value="true"
              defaultChecked={params.vencidas === "true"}
              className="size-4 rounded-xs"
            />
            Só vencidas
          </label>
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          {filtrando && (
            <Link
              href="/qualidade/nao-conformidades"
              className="h-9 content-center text-sm text-texto-2 hover:underline"
            >
              Limpar filtros
            </Link>
          )}
        </form>

        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : lista.dados.itens.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            {filtrando
              ? "Nenhuma NC com esses filtros."
              : "Nenhuma não conformidade registrada. Quando uma inspeção, auditoria ou reclamação apontar um problema, abra a NC aqui."}
          </p>
        ) : (
          <Tabela pagina={lista.dados} consulta={consulta} />
        )}
      </section>
    </>
  );
}

function Tabela({
  pagina,
  consulta,
}: {
  pagina: Pagina<NaoConformidadeResumo>;
  consulta: URLSearchParams;
}) {
  const paginas = Math.max(1, Math.ceil(pagina.total / pagina.porPagina));
  const link = (n: number) => {
    const q = new URLSearchParams(consulta);
    q.set("pagina", String(n));
    return `/qualidade/nao-conformidades?${q}`;
  };
  return (
    <>
      <div className="relative overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-superficie-2 text-xs text-texto-2">
            <tr>
              <th className="px-4 py-2 font-semibold">Número</th>
              <th className="px-4 py-2 font-semibold">Título</th>
              <th className="px-4 py-2 font-semibold">Origem</th>
              <th className="px-4 py-2 font-semibold">Gravidade</th>
              <th className="px-4 py-2 font-semibold">Responsável</th>
              <th className="px-4 py-2 font-semibold">Prazo</th>
              <th className="px-4 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borda">
            {pagina.itens.map((nc) => {
              const terminada =
                nc.status === "encerrada" || nc.status === "cancelada";
              return (
                <tr key={nc.id} className="hover:bg-superficie-2">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Link
                      href={`/qualidade/nao-conformidades/${nc.id}`}
                      className="font-mono text-sm font-medium text-info hover:underline"
                    >
                      {nc.numero}
                    </Link>
                  </td>
                  <td className="max-w-md px-4 py-2">
                    <span className="line-clamp-2">{nc.titulo}</span>
                    {nc.ciclos >= 2 && (
                      <span className="text-xs text-atencao">
                        Reincidente: {nc.ciclos}º ciclo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-texto-2">
                    {ORIGENS_NC[nc.origem]}
                  </td>
                  <td className="px-4 py-2">
                    <GravidadeDaNc gravidade={nc.gravidade} />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-texto-2">
                    {nc.responsavel}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {formatarData(nc.prazo)}
                    {!terminada && (
                      <span
                        className={`block text-xs ${nc.vencida ? "text-nao-conforme" : "text-texto-3"}`}
                      >
                        {prazoRelativo(nc.prazo)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <StatusDaNc status={nc.status} vencida={nc.vencida} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <nav
        aria-label="Páginas"
        className="flex items-center justify-between border-t border-borda px-4 py-2.5 text-sm text-texto-2"
      >
        <span>
          {pagina.total.toLocaleString("pt-BR")}{" "}
          {pagina.total === 1 ? "NC" : "NCs"}
        </span>
        {paginas > 1 && (
          <span className="flex items-center gap-4">
            {pagina.pagina > 1 && (
              <Link href={link(pagina.pagina - 1)} className="hover:underline">
                Anterior
              </Link>
            )}
            <span>
              Página {pagina.pagina} de {paginas}
            </span>
            {pagina.pagina < paginas && (
              <Link href={link(pagina.pagina + 1)} className="hover:underline">
                Próxima
              </Link>
            )}
          </span>
        )}
      </nav>
    </>
  );
}
