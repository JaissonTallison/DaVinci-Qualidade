import { ListFilter } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import {
  ROTULOS_REGISTRO_SST,
  type DadosDoUsuario,
  type Pagina,
  type RegistroSst,
  type ResumoRegistrosSst,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Registros de segurança" };

const CURTO: Record<string, string> = {
  dds: "DDS",
  apr: "APR",
  reuniao_cipa: "CIPA",
  simulado: "Simulado",
};

export default async function Registros({
  searchParams,
}: PageProps<"/seguranca/registros">) {
  const { tipo } = (await searchParams) as { tipo?: string };
  const [lista, resumo, eu] = await Promise.all([
    chamarApi<Pagina<RegistroSst>>(
      `/registros-de-seguranca${tipo ? `?tipo=${encodeURIComponent(tipo)}` : ""}`,
    ),
    chamarApi<ResumoRegistrosSst>("/registros-de-seguranca/resumo"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("seguranca.editar");
  const r = resumo.ok ? resumo.dados : null;
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Registros de segurança</h1>
          <p className="mt-1 max-w-2xl text-base text-texto-2">
            DDS, APR, reuniões da CIPA e simulados de emergência.
          </p>
        </div>
        {podeCriar && (
          <Link href="/seguranca/registros/novo" className={botaoPrimario}>
            <IconeDaTela href={"/seguranca/registros/novo"} />
            Novo registro
          </Link>
        )}
      </header>
      {r && (
        <section className={`${painel} mt-6 grid gap-4 p-5 sm:grid-cols-3`}>
          <div>
            <p className="text-xs text-texto-2">DDS neste mês</p>
            <p className="mt-0.5 text-xl tabular-nums">{r.ddsNoMes}</p>
          </div>
          <div>
            <p className="text-xs text-texto-2">Última reunião da CIPA</p>
            <p
              className={`mt-0.5 text-base ${r.cipaEmDia ? "" : "text-nao-conforme"}`}
            >
              {r.ultimaReuniaoCipa
                ? formatarData(r.ultimaReuniaoCipa)
                : "Nenhuma"}
              {!r.cipaEmDia && " · reunião mensal atrasada"}
            </p>
          </div>
          <div>
            <p className="text-xs text-texto-2">
              Último simulado de emergência
            </p>
            <p
              className={`mt-0.5 text-base ${r.simuladoEmDia ? "" : "text-nao-conforme"}`}
            >
              {r.ultimoSimulado ? formatarData(r.ultimoSimulado) : "Nenhum"}
              {!r.simuladoEmDia && " · mais de 12 meses"}
            </p>
          </div>
        </section>
      )}
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3">
          <SelecaoDeFiltro
            nome="tipo"
            rotulo="Tipo"
            opcoes={ROTULOS_REGISTRO_SST}
            valor={tipo}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
        </form>
        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : lista.dados.itens.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            Nenhum registro{tipo ? " deste tipo" : ""}.
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-sm text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Data</th>
                  <th className="px-4 py-2 font-semibold">Tipo</th>
                  <th className="px-4 py-2 font-semibold">Tema</th>
                  <th className="px-4 py-2 font-semibold">Conduziu</th>
                  <th className="px-4 py-2 font-semibold">Participantes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.itens.map((x) => (
                  <tr
                    key={x.id}
                    className={` ${x.motivoAnulacao ? "text-texto-3" : ""}`}
                  >
                    <td
                      className={`px-4 py-2 whitespace-nowrap ${x.motivoAnulacao ? "line-through" : ""}`}
                    >
                      {formatarData(x.data)}
                    </td>
                    <td className="px-4 py-2">{CURTO[x.tipo]}</td>
                    <td className="max-w-md px-4 py-2">
                      <Link
                        href={`/seguranca/registros/${x.id}`}
                        className="text-info hover:underline"
                      >
                        {x.tema}
                      </Link>
                      {x.motivoAnulacao && (
                        <span className="block text-xs">
                          Anulado: {x.motivoAnulacao}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-texto-2">{x.responsavel}</td>
                    <td className="px-4 py-2 tabular-nums">
                      {x.participantes}
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
