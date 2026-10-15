import type { Metadata } from "next";
import Link from "next/link";
import {
  TIPOS_LICENCA,
  type DadosDoUsuario,
  type Licenca,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { IconeDaTela } from "@/components/icones-do-menu";
import { SituacaoDaLicenca } from "@/components/marcadores-ambientais";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { botaoPrimario, painel, tituloDaPagina } from "@/lib/estilos";

export const metadata: Metadata = { title: "Licenças" };

export default async function Licencas() {
  const [r, eu] = await Promise.all([
    chamarApi<Licenca[]>("/licencas"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("ambiental.editar");
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Licenças</h1>
          <p className="mt-1 max-w-2xl text-base text-texto-2">
            Licenças ambientais, outorgas e autorizações. O alerta de renovação
            abre na data limite para protocolar; depois do protocolo, acompanha
            só a validade.
          </p>
        </div>
        {podeCriar && (
          <Link href="/ambiental/licencas/nova" className={botaoPrimario}>
            <IconeDaTela href="/ambiental/licencas/nova" />
            Nova licença
          </Link>
        )}
      </header>
      <section className={`${painel} mt-6`}>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : r.dados.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            Nenhuma licença cadastrada.
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-xs text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Licença</th>
                  <th className="px-4 py-2 font-semibold">Órgão</th>
                  <th className="px-4 py-2 font-semibold">Validade</th>
                  <th className="px-4 py-2 font-semibold">Renovar até</th>
                  <th className="px-4 py-2 font-semibold">Situação</th>
                  <th className="px-4 py-2 font-semibold">Condicionantes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {r.dados.map((l) => {
                  const pendentes = l.condicionantes.filter(
                    (c) => !c.cumpridaEm,
                  );
                  const vencidas = pendentes.filter((c) => c.vencida).length;
                  return (
                    <tr key={l.id} className="hover:bg-superficie-2">
                      <td className="px-4 py-2">
                        <Link
                          href={`/ambiental/licencas/${l.id}`}
                          className="text-info hover:underline"
                        >
                          {TIPOS_LICENCA[l.tipo]} nº {l.numero}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-texto-2">{l.orgao}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatarData(l.validade)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-texto-2">
                        {l.renovacaoProtocolo
                          ? `Protocolo ${l.renovacaoProtocolo}`
                          : formatarData(l.renovarAte)}
                      </td>
                      <td className="px-4 py-2">
                        <SituacaoDaLicenca situacao={l.situacao} />
                      </td>
                      <td
                        className={`px-4 py-2 tabular-nums ${vencidas ? "text-nao-conforme" : ""}`}
                      >
                        {pendentes.length
                          ? `${pendentes.length} pendentes${vencidas ? ` · ${vencidas} vencidas` : ""}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
