import type { Metadata } from "next";
import Link from "next/link";
import {
  SEVERIDADES_AMBIENTAIS,
  TIPOS_DE_OCORRENCIA,
  type DadosDoUsuario,
  type OcorrenciaAmbiental,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { NovaOcorrencia } from "./formularios";

export const metadata: Metadata = { title: "Ocorrências ambientais" };

/** Vazamentos, derrames e emissões: contenção, comunicação ao órgão quando obrigatória, NC e encerramento. */
export default async function Ocorrencias() {
  const [r, eu] = await Promise.all([
    chamarApi<OcorrenciaAmbiental[]>("/ocorrencias-ambientais"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("ambiental.editar");
  const semComunicar = r.ok
    ? r.dados.filter((o) => o.comunicacaoObrigatoria && !o.comunicacao).length
    : 0;
  return (
    <>
      <h1 className={tituloDaPagina}>Ocorrências ambientais</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        Registre logo depois da contenção. Severidade alta ou crítica, ou água
        atingida, exige comunicar o órgão ambiental até o dia seguinte; a
        ocorrência só encerra com a comunicação registrada, as causas e as
        ações.
      </p>
      {semComunicar > 0 && (
        <p className="mt-3 text-base font-semibold text-nao-conforme">
          {semComunicar} ocorrência(s) sem a comunicação obrigatória.
        </p>
      )}
      {podeEditar && (
        <Recolhido titulo="Registrar ocorrência">
          <NovaOcorrencia hoje={hojeEmBrasilia()} />
        </Recolhido>
      )}
      <section className={`${painel} mt-6`}>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : r.dados.length === 0 ? (
          <p className="px-5 py-6 text-base text-texto-2">
            Nenhuma ocorrência registrada.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borda text-left text-texto-2">
                <th className="px-4 py-2 font-semibold">Número</th>
                <th className="px-4 py-2 font-semibold">Ocorrência</th>
                <th className="px-4 py-2 font-semibold">Data</th>
                <th className="px-4 py-2 font-semibold">Severidade</th>
                <th className="px-4 py-2 font-semibold">Comunicação</th>
                <th className="px-4 py-2 font-semibold">Situação</th>
              </tr>
            </thead>
            <tbody>
              {r.dados.map((o) => (
                <tr key={o.id} className="border-b border-borda last:border-0">
                  <td data-rotulo="Número" className="px-4 py-2.5">
                    <Link
                      href={`/ambiental/ocorrencias/${o.id}`}
                      className="font-mono text-info hover:underline"
                    >
                      {o.numero}
                    </Link>
                  </td>
                  <td data-rotulo="Ocorrência" className="px-4 py-2.5">
                    {TIPOS_DE_OCORRENCIA[o.tipo]}: {o.substancia}
                    <span className="block text-texto-2">{o.local}</span>
                  </td>
                  <td data-rotulo="Data" className="px-4 py-2.5">
                    {formatarData(o.data)}
                  </td>
                  <td
                    data-rotulo="Severidade"
                    className={`px-4 py-2.5 ${o.severidade === "alta" || o.severidade === "critica" ? "font-semibold text-nao-conforme" : ""}`}
                  >
                    {SEVERIDADES_AMBIENTAIS[o.severidade]}
                  </td>
                  <td
                    data-rotulo="Comunicação"
                    className={`px-4 py-2.5 ${o.comunicacaoObrigatoria && !o.comunicacao ? "font-semibold text-nao-conforme" : ""}`}
                  >
                    {o.comunicacao
                      ? `${o.comunicacao.orgao} · ${formatarData(o.comunicacao.data)}`
                      : o.comunicacaoObrigatoria
                        ? `Obrigatória até ${formatarData(o.prazoComunicacao!)}`
                        : "Não obrigatória"}
                  </td>
                  <td data-rotulo="Situação" className="px-4 py-2.5">
                    {o.status === "aberta" ? "Aberta" : "Encerrada"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
