import type { Metadata } from "next";
import Link from "next/link";
import { ListFilter } from "lucide-react";
import {
  SITUACOES_OPERACIONAIS,
  type AspectoAmbiental,
  type DadosDoUsuario,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { IconeDaTela } from "@/components/icones-do-menu";
import { SignificanciaDoAspecto } from "@/components/marcadores-ambientais";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  campoCompacto,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Aspectos e impactos" };

export default async function Aspectos({
  searchParams,
}: PageProps<"/ambiental/aspectos">) {
  const { significativos, situacao } = (await searchParams) as {
    significativos?: string;
    situacao?: string;
  };
  const filtro = new URLSearchParams();
  if (significativos) filtro.set("significativos", significativos);
  if (situacao) filtro.set("situacao", situacao);
  const [r, eu] = await Promise.all([
    chamarApi<AspectoAmbiental[]>(`/aspectos-ambientais?${filtro}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("ambiental.editar");
  const significativosNaLista = r.ok
    ? r.dados.filter((a) => a.significativo).length
    : 0;
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Aspectos e impactos</h1>
          <p className="mt-1 max-w-2xl text-base text-texto-2">
            Levantamento (LAIA) das atividades, do que geram ou consomem e do
            impacto. Significância = severidade × frequência; alta (15 ou mais)
            ou ligada a requisito legal é significativa e pede controle.
          </p>
        </div>
        {podeCriar && (
          <Link href="/ambiental/aspectos/novo" className={botaoPrimario}>
            <IconeDaTela href="/ambiental/aspectos/novo" />
            Novo aspecto
          </Link>
        )}
      </header>
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3">
          <select
            name="significativos"
            defaultValue={significativos ?? ""}
            aria-label="Significância"
            className={campoCompacto}
          >
            <option value="">Significativos e não significativos</option>
            <option value="sim">Só significativos</option>
            <option value="nao">Só não significativos</option>
          </select>
          <select
            name="situacao"
            defaultValue={situacao ?? ""}
            aria-label="Situação"
            className={campoCompacto}
          >
            <option value="">Ativos</option>
            <option value="inativos">Inativos</option>
            <option value="todos">Todos</option>
          </select>
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
          {r.ok && (
            <p className="ml-auto text-sm text-texto-2">
              {r.dados.length === 1
                ? "1 aspecto"
                : `${r.dados.length} aspectos`}{" "}
              ·{" "}
              {significativosNaLista === 1
                ? "1 significativo"
                : `${significativosNaLista} significativos`}
            </p>
          )}
        </form>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : r.dados.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            Nenhum aspecto neste filtro.
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-xs text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Atividade</th>
                  <th className="px-4 py-2 font-semibold">Aspecto</th>
                  <th className="px-4 py-2 font-semibold">Impacto</th>
                  <th className="px-4 py-2 font-semibold">Situação</th>
                  <th className="px-4 py-2 font-semibold">S × F</th>
                  <th className="px-4 py-2 font-semibold">Significância</th>
                  <th className="px-4 py-2 font-semibold">Prazo da ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {r.dados.map((a) => (
                  <tr
                    key={a.id}
                    className={`hover:bg-superficie-2 ${a.ativo ? "" : "text-texto-3"}`}
                  >
                    <td className="px-4 py-2">
                      <Link
                        href={`/ambiental/aspectos/${a.id}`}
                        className="text-info hover:underline"
                      >
                        {a.atividade}
                      </Link>
                    </td>
                    <td className="max-w-xs px-4 py-2">{a.aspecto}</td>
                    <td className="max-w-xs px-4 py-2 text-texto-2">
                      {a.impacto}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {SITUACOES_OPERACIONAIS[a.situacao]}
                    </td>
                    <td className="px-4 py-2 tabular-nums whitespace-nowrap">
                      {a.severidade} × {a.frequencia}
                      {a.requisitoLegal && (
                        <span className="text-texto-2"> · legal</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <SignificanciaDoAspecto
                        significancia={a.significancia}
                        significativo={a.significativo}
                      />
                    </td>
                    <td
                      className={`px-4 py-2 whitespace-nowrap ${a.prazoVencido ? "text-nao-conforme" : ""}`}
                    >
                      {a.prazo ? formatarData(a.prazo) : "—"}
                      {a.prazoVencido && " · vencido"}
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
