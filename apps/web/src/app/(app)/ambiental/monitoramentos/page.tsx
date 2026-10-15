import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import {
  TIPOS_MONITORAMENTO,
  type DadosDoUsuario,
  type Monitoramento,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { IconeDaTela } from "@/components/icones-do-menu";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { botaoPrimario, painel, tituloDaPagina } from "@/lib/estilos";
import { textoDoLimite } from "./limites";

export const metadata: Metadata = { title: "Monitoramentos" };

export default async function Monitoramentos() {
  const [r, eu] = await Promise.all([
    chamarApi<Monitoramento[]>("/monitoramentos"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("ambiental.editar");
  const fora = r.ok
    ? r.dados.filter((m) => m.ultimo && !m.ultimo.conforme).length
    : 0;
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Monitoramentos</h1>
          <p className="mt-1 max-w-2xl text-base text-texto-2">
            Efluentes, emissões, ruído e outros parâmetros com limite e
            periodicidade de coleta. Cada resultado é comparado com o limite.
            {fora > 0 && (
              <span className="text-nao-conforme">
                {" "}
                {fora === 1 ? "1 fora do limite." : `${fora} fora do limite.`}
              </span>
            )}
          </p>
        </div>
        {podeCriar && (
          <Link href="/ambiental/monitoramentos/novo" className={botaoPrimario}>
            <IconeDaTela href="/ambiental/monitoramentos" />
            Novo monitoramento
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
            Nenhum monitoramento cadastrado.
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-xs text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Parâmetro</th>
                  <th className="px-4 py-2 font-semibold">Ponto</th>
                  <th className="px-4 py-2 font-semibold">Tipo</th>
                  <th className="px-4 py-2 font-semibold">Limite</th>
                  <th className="px-4 py-2 font-semibold">Último resultado</th>
                  <th className="px-4 py-2 font-semibold">Próxima coleta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {r.dados.map((m) => (
                  <tr key={m.id} className="hover:bg-superficie-2">
                    <td className="px-4 py-2">
                      <Link
                        href={`/ambiental/monitoramentos/${m.id}`}
                        className="text-info hover:underline"
                      >
                        {m.parametro}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{m.ponto}</td>
                    <td className="px-4 py-2 text-texto-2">
                      {TIPOS_MONITORAMENTO[m.tipo]}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {textoDoLimite(m)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {m.ultimo ? (
                        m.ultimo.conforme ? (
                          <span className="tabular-nums">
                            {m.ultimo.valor.toLocaleString("pt-BR")} {m.unidade}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-xs bg-nao-conforme/10 px-1.5 text-nao-conforme tabular-nums">
                            <CircleAlert
                              aria-hidden
                              size={14}
                              strokeWidth={2}
                            />
                            {m.ultimo.valor.toLocaleString("pt-BR")} {m.unidade}{" "}
                            · fora do limite
                          </span>
                        )
                      ) : (
                        <span className="text-texto-3">Sem coleta</span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-2 whitespace-nowrap ${m.coletaVencida ? "text-nao-conforme" : ""}`}
                    >
                      {formatarData(m.proximaColeta)}
                      {m.coletaVencida && " · atrasada"}
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
