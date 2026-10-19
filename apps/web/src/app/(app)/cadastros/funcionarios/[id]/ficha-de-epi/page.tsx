import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  MOTIVOS_ENTREGA,
  type DadosDoUsuario,
  type EntregaEpi,
  type Funcionario,
  type Pagina,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { FolhaDeDocumento } from "@/components/folha-de-documento";
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
  const empresa = eu.ok ? eu.dados.empresa.nome : undefined;
  return (
    <FolhaDeDocumento
      tipo="Ficha de entrega de EPI · NR-6"
      titulo={f.nome}
      subtitulo={`Matrícula ${f.matricula} · ${f.funcaoNome} · ${f.setorNome}`}
      empresa={empresa}
      emitidoEm={formatarData(hojeEmBrasilia())}
      voltarHref={`/cadastros/funcionarios/${id}`}
      voltarRotulo="Voltar ao funcionário"
      assinaturas={[
        { papel: "Funcionário", nome: f.nome },
        {
          papel: `Responsável pela entrega · ${formatarData(hojeEmBrasilia())}`,
        },
      ]}
    >
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
    </FolhaDeDocumento>
  );
}
