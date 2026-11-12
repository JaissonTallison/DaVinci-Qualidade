import { ListFilter, Plus } from "@/components/icones";
import type { Metadata } from "next";
import Link from "next/link";
import {
  STATUS_DOCUMENTO,
  TIPOS_DOCUMENTO,
  type DadosDoUsuario,
  type Documento,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { StatusDoDocumento } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel } from "@/lib/estilos";
import { Botao } from "@/components/botao";
import { CabecalhoDaPagina } from "@/components/cabecalho-da-pagina";

export const metadata: Metadata = { title: "Normas e procedimentos" };

export default async function Documentos({
  searchParams,
}: PageProps<"/sgi/documentos">) {
  const { tipo, status } = (await searchParams) as {
    tipo?: string;
    status?: string;
  };
  const query = new URLSearchParams();
  if (tipo) query.set("tipo", tipo);
  if (status) query.set("status", status);
  const qs = query.toString();
  const [lista, eu] = await Promise.all([
    chamarApi<Documento[]>(`/documentos${qs ? `?${qs}` : ""}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("sgi.editar");
  return (
    <>
      <CabecalhoDaPagina
        titulo="Normas e procedimentos"
        descricao="Controle de documentos (ISO 9001 7.5): elaboração, revisão, aprovação e obsolescência, com histórico de cada revisão."
        acoes={
          podeCriar && (
            <Botao
              href="/sgi/documentos/nova"
              variante="primario"
              tamanho="grande"
              icone={Plus}
            >
              Novo documento
            </Botao>
          )
        }
      />
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3">
          <SelecaoDeFiltro
            nome="tipo"
            rotulo="Tipo"
            opcoes={TIPOS_DOCUMENTO}
            valor={tipo}
          />
          <SelecaoDeFiltro
            nome="status"
            rotulo="Situação"
            opcoes={STATUS_DOCUMENTO}
            valor={status}
          />
          <Botao type="submit" icone={ListFilter}>
            Filtrar
          </Botao>
        </form>
        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : lista.dados.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            Nenhum documento{tipo || status ? " com este filtro" : " cadastrado"}
            .
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-xs uppercase tracking-[0.04em] text-texto-2">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Código</th>
                  <th className="px-4 py-2.5 font-semibold">Título</th>
                  <th className="px-4 py-2.5 font-semibold">Tipo</th>
                  <th className="px-4 py-2.5 font-semibold">Rev.</th>
                  <th className="px-4 py-2.5 font-semibold">Situação</th>
                  <th className="px-4 py-2.5 font-semibold">Próxima revisão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 font-mono text-sm whitespace-nowrap">
                      <Link
                        href={`/sgi/documentos/${d.id}`}
                        className="text-info hover:underline"
                      >
                        {d.codigo}
                      </Link>
                    </td>
                    <td className="max-w-md px-4 py-3">{d.titulo}</td>
                    <td className="px-4 py-3 text-texto-2">
                      {TIPOS_DOCUMENTO[d.tipo]}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-texto-2">
                      {d.revisaoAtual > 0 ? `Rev. ${d.revisaoAtual}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusDoDocumento
                        status={d.status}
                        vencida={d.revisaoVencida}
                        proximaRevisao={d.proximaRevisao}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-texto-2">
                      {d.proximaRevisao ? formatarData(d.proximaRevisao) : "—"}
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
