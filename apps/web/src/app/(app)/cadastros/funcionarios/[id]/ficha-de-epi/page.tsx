import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MOTIVOS_ENTREGA,
  type DadosDoUsuario,
  type EntregaEpi,
  type Funcionario,
  type Pagina,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { BotaoImprimir } from "@/components/botao-imprimir";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";

export const metadata: Metadata = { title: "Ficha de EPI" };

/** Ficha de EPI (NR-6, 6.6.1 h): as entregas com o CA e o termo de responsabilidade para assinar. */
export default async function FichaDeEpi({
  params,
}: PageProps<"/cadastros/funcionarios/[id]/ficha-de-epi">) {
  const { id } = await params;
  const [r, entregas, eu] = await Promise.all([
    chamarApi<Funcionario>(`/funcionarios/${id}`),
    chamarApi<Pagina<EntregaEpi>>(
      `/epis/entregas?funcionarioId=${id}&porPagina=100`,
    ),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const f = r.dados;
  const lista = entregas.ok
    ? entregas.dados.itens.filter((e) => !e.motivoAnulacao)
    : [];
  return (
    <article className="mx-auto max-w-4xl bg-superficie print:max-w-none">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/cadastros/funcionarios/${id}`}
          className="text-sm text-texto-2 hover:underline"
        >
          Voltar ao funcionário
        </Link>
        <BotaoImprimir />
      </div>
      <header className="border-b-2 border-texto pb-3">
        <p className="text-sm text-texto-2">
          Ficha de entrega de equipamento de proteção individual · NR-6
        </p>
        <h1 className="font-serif text-2xl">{f.nome}</h1>
        <p className="text-sm">
          {eu.ok ? eu.dados.empresa.nome : ""} · Matrícula {f.matricula} ·{" "}
          {f.funcaoNome} · {f.setorNome}
        </p>
      </header>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-borda-forte text-left">
            <th className="py-1 pr-3">Data</th>
            <th className="py-1 pr-3">EPI</th>
            <th className="py-1 pr-3">CA</th>
            <th className="py-1 pr-3 text-right">Qtd.</th>
            <th className="py-1 pr-3">Motivo</th>
            <th className="py-1 pr-3">Devolução</th>
            <th className="py-1">Assinatura</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((e) => (
            <tr key={e.id} className="border-b border-borda align-bottom">
              <td className="py-2 pr-3 whitespace-nowrap">
                {formatarData(e.data)}
              </td>
              <td className="py-2 pr-3">{e.epiNome}</td>
              <td className="py-2 pr-3 font-mono">{e.ca}</td>
              <td className="py-2 pr-3 text-right tabular-nums">
                {e.quantidade}
              </td>
              <td className="py-2 pr-3">{MOTIVOS_ENTREGA[e.motivo]}</td>
              <td className="py-2 pr-3">
                {e.devolvidoEm ? formatarData(e.devolvidoEm) : ""}
              </td>
              <td className="w-40 py-2">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 text-sm">
        Declaro ter recebido os equipamentos acima, gratuitamente, em perfeito
        estado, com o treinamento sobre o uso correto, a guarda e a conservação.
        Comprometo-me a usá-los apenas para a finalidade a que se destinam, a
        responsabilizar-me pela guarda, a comunicar qualquer alteração que os
        torne impróprios e a devolvê-los quando solicitado ou no desligamento
        (NR-6, item 6.7.1).
      </p>
      <section className="mt-14 grid grid-cols-2 gap-10 text-sm break-inside-avoid">
        <div className="border-t border-texto pt-1 text-center">{f.nome}</div>
        <div className="border-t border-texto pt-1 text-center">
          Responsável pela entrega · {formatarData(hojeEmBrasilia())}
        </div>
      </section>
    </article>
  );
}
