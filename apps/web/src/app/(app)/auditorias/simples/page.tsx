import type { Metadata } from "next";
import Link from "next/link";
import type { AuditoriaSimplesResumo, DadosDoUsuario } from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { botaoPrimario, painel, tituloDaPagina } from "@/lib/estilos";

export const metadata: Metadata = { title: "Auditorias internas simples" };

const AVISOS: Record<string, string> = {
  salvo: "Auditoria salva.",
  excluida: "Auditoria excluída.",
};

export default async function AuditoriasSimples({
  searchParams,
}: PageProps<"/auditorias/simples">) {
  const { aviso } = (await searchParams) as { aviso?: string };
  const [lista, eu] = await Promise.all([
    chamarApi<AuditoriaSimplesResumo[]>("/auditorias-simples"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar =
    eu.ok && eu.dados.permissoes.includes("auditorias.editar");

  return (
    <>
      <Link href="/auditorias" className="dv-voltar">
        Auditorias
      </Link>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={tituloDaPagina}>Auditorias internas simples</h1>
          <p className="mt-1 max-w-2xl text-base text-texto-2">
            Modelo em uma página: cabeçalho e uma linha por setor com
            comentários, pontos positivos, observações e não conformidades.
          </p>
        </div>
        {podeEditar && (
          <Link href="/auditorias/simples/nova" className={botaoPrimario}>
            Nova auditoria simples
          </Link>
        )}
      </div>
      <Aviso avisos={AVISOS} chave={aviso} />

      {!lista.ok ? (
        <div className="mt-6">
          <AvisoDeErro erro={lista.erro} />
        </div>
      ) : (
        <section className={`${painel} mt-6`}>
          {lista.dados.length === 0 ? (
            <p className="px-4 py-8 text-base text-texto-2">
              Nenhuma auditoria interna simples ainda.
            </p>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-superficie-2 text-sm text-texto-2">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Número</th>
                    <th className="px-4 py-2 font-semibold">Data</th>
                    <th className="px-4 py-2 font-semibold">
                      Unidade de Negócios
                    </th>
                    <th className="px-4 py-2 text-right font-semibold">
                      Setores
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {lista.dados.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-2 font-mono whitespace-nowrap">
                        <Link
                          href={`/auditorias/simples/${a.id}`}
                          className="text-info hover:underline"
                        >
                          {a.numero}
                        </Link>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatarData(a.data)}
                      </td>
                      <td className="px-4 py-2">{a.unidade ?? "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {a.setores}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
