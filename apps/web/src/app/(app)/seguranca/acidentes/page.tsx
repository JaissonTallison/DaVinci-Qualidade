import { ListFilter } from "lucide-react";
import { Pendencias } from "@/components/pendencias";
import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import {
  STATUS_ACIDENTE,
  TIPOS_ACIDENTE,
  type AcidenteResumo,
  type DadosDoUsuario,
  type Pagina,
  type ResumoAcidentes,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { StatusDoAcidente, TipoDoAcidente } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  campoCompacto,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Acidentes" };

const FILTROS = ["busca", "tipo", "status", "pagina"] as const;

export default async function ListaDeAcidentes({
  searchParams,
}: PageProps<"/seguranca/acidentes">) {
  const params = (await searchParams) as Partial<
    Record<(typeof FILTROS)[number], string>
  >;
  const consulta = new URLSearchParams();
  for (const f of FILTROS) if (params[f]) consulta.set(f, params[f]!);
  const [lista, resumo, eu] = await Promise.all([
    chamarApi<Pagina<AcidenteResumo>>(`/acidentes?${consulta}`),
    chamarApi<ResumoAcidentes>("/acidentes/resumo"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeRegistrar =
    eu.ok && eu.dados.permissoes.includes("seguranca.editar");
  const filtrando = FILTROS.some((f) => f !== "pagina" && params[f]);

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Acidentes</h1>
          {resumo.ok && (
            <Pendencias
              itens={[
                {
                  valor: resumo.dados.diasSemAcidente ?? "—",
                  rotulo: "dias sem acidente com afastamento",
                },
                { valor: resumo.dados.emAberto, rotulo: "em aberto" },
                {
                  valor: resumo.dados.catsAtrasadas,
                  rotulo: "CATs atrasadas",
                  singular: "CAT atrasada",
                  alerta: true,
                },
              ]}
            />
          )}
        </div>
        {podeRegistrar && (
          <Link href="/seguranca/acidentes/novo" className={botaoPrimario}>
            <IconeDaTela href={"/seguranca/acidentes/novo"} />
            Registrar acidente
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
            placeholder="Número, pessoa, local ou descrição"
            aria-label="Buscar"
            className={`${campoCompacto} w-64`}
          />
          <SelecaoDeFiltro
            nome="tipo"
            rotulo="Tipo"
            opcoes={TIPOS_ACIDENTE}
            valor={params.tipo}
          />
          <SelecaoDeFiltro
            nome="status"
            rotulo="Status"
            opcoes={STATUS_ACIDENTE}
            valor={params.status}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          {filtrando && (
            <Link
              href="/seguranca/acidentes"
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
              ? "Nenhum registro com esses filtros."
              : "Nenhum acidente registrado. Registre também incidentes e quase-acidentes: eles mostram onde o próximo acidente pode acontecer."}
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-sm text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Número</th>
                  <th className="px-4 py-2 font-semibold">Data</th>
                  <th className="px-4 py-2 font-semibold">Tipo</th>
                  <th className="px-4 py-2 font-semibold">Acidentado</th>
                  <th className="px-4 py-2 font-semibold">Local</th>
                  <th className="px-4 py-2 font-semibold">Dias perdidos</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.itens.map((a) => (
                  <tr key={a.id} className="">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Link
                        href={`/seguranca/acidentes/${a.id}`}
                        className="font-mono text-sm font-medium text-info hover:underline"
                      >
                        {a.numero}
                      </Link>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatarData(a.data)}
                    </td>
                    <td className="px-4 py-2">
                      <TipoDoAcidente tipo={a.tipo} />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {a.acidentado ?? "—"}
                    </td>
                    <td className="max-w-xs px-4 py-2 text-texto-2">
                      {a.local}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {a.diasPerdidos || "—"}
                    </td>
                    <td className="px-4 py-2">
                      <StatusDoAcidente status={a.status} />
                      {a.catAtrasada && (
                        <span className="block text-xs font-semibold text-nao-conforme">
                          CAT atrasada
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-borda px-4 py-2.5 text-sm text-texto-2">
              {lista.dados.total.toLocaleString("pt-BR")}{" "}
              {lista.dados.total === 1 ? "registro" : "registros"}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
