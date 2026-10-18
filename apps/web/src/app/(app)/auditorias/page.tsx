import { ListFilter } from "lucide-react";
import { Pendencias } from "@/components/pendencias";
import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import {
  NORMAS,
  STATUS_AUDITORIA,
  TIPOS_AUDITORIA,
  type AuditoriaResumo,
  type DadosDoUsuario,
  type Pagina,
  type ResumoAuditorias,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { StatusDaAuditoria } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  campoCompacto,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Auditorias" };

const FILTROS = ["busca", "status", "tipo", "pagina"] as const;

export default async function ListaDeAuditorias({
  searchParams,
}: PageProps<"/auditorias">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number], string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const [lista, resumo, eu] = await Promise.all([
    chamarApi<Pagina<AuditoriaResumo>>(`/auditorias?${consulta}`),
    chamarApi<ResumoAuditorias>("/auditorias/resumo"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("auditorias.editar");
  const filtrando = FILTROS.some((f) => f !== "pagina" && params[f]);

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Auditorias</h1>
          {resumo.ok && (
            <Pendencias
              itens={[
                { valor: resumo.dados.planejadas, rotulo: "planejadas" },
                { valor: resumo.dados.emAndamento, rotulo: "em andamento" },
                {
                  valor: resumo.dados.ncsUltimos12Meses,
                  rotulo: "NCs em auditorias (12 meses)",
                },
              ]}
            />
          )}
        </div>
        {podeCriar && (
          <Link href="/auditorias/nova" className={botaoPrimario}>
            <IconeDaTela href={"/auditorias/nova"} />
            Planejar auditoria
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
            placeholder="Número, escopo ou auditor"
            aria-label="Buscar"
            className={`${campoCompacto} w-56`}
          />
          <SelecaoDeFiltro
            nome="status"
            rotulo="Status"
            opcoes={STATUS_AUDITORIA}
            valor={params.status}
          />
          <SelecaoDeFiltro
            nome="tipo"
            rotulo="Tipo"
            opcoes={TIPOS_AUDITORIA}
            valor={params.tipo}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          {filtrando && (
            <Link
              href="/auditorias"
              className="h-9 content-center dv-voltar"
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
              ? "Nenhuma auditoria com esses filtros."
              : "Nenhuma auditoria registrada. Planeje a primeira com escopo, normas e equipe."}
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-sm text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Número</th>
                  <th className="px-4 py-2 font-semibold">Escopo</th>
                  <th className="px-4 py-2 font-semibold">Normas</th>
                  <th className="px-4 py-2 font-semibold">Auditor líder</th>
                  <th className="px-4 py-2 font-semibold">Período</th>
                  <th className="px-4 py-2 font-semibold">NCs</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.itens.map((a) => (
                  <tr key={a.id} className="">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Link
                        href={`/auditorias/${a.id}`}
                        className="font-mono text-sm font-medium text-info hover:underline"
                      >
                        {a.numero}
                      </Link>
                    </td>
                    <td className="max-w-md px-4 py-2">
                      <span className="line-clamp-2">{a.escopo}</span>
                      <span className="text-xs text-texto-3">
                        {TIPOS_AUDITORIA[a.tipo]}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-texto-2">
                      {a.normas.map((n) => NORMAS[n]).join(", ")}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-texto-2">
                      {a.auditorLider}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {a.dataInicio === a.dataFim
                        ? formatarData(a.dataInicio)
                        : `${formatarData(a.dataInicio)} a ${formatarData(a.dataFim)}`}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {a.constatacoesDeNc}
                      {a.ncsPendentes > 0 && (
                        <span className="block text-xs text-atencao">
                          {a.ncsPendentes} a formalizar
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <StatusDaAuditoria status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-borda px-4 py-2.5 text-sm text-texto-2">
              {lista.dados.total.toLocaleString("pt-BR")}{" "}
              {lista.dados.total === 1 ? "auditoria" : "auditorias"}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
