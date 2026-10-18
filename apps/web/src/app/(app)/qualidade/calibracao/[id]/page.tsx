import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { DadosDoUsuario, Instrumento } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { SituacaoDoInstrumento } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, prazoRelativo } from "@/lib/datas";
import {
  botaoPrimario,
  painel,
  tituloDaPagina,
  tituloDaSecao,
} from "@/lib/estilos";
import { formatarReais } from "@/lib/valores";
import { FormularioDeInstrumento } from "../formulario";
import {
  AnularCalibracao,
  RegistrarCalibracao,
  UsoDoInstrumento,
} from "./acoes";
import { Anexos } from "@/components/anexos";

export const metadata: Metadata = { title: "Instrumento" };

const AVISOS: Record<string, string> = {
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
  criado:
    "Instrumento cadastrado. Registre a última calibração para calcular a próxima.",
  salvo: "Instrumento salvo.",
  registrada: "Calibração registrada.",
  reprovado:
    "Calibração reprovada: o instrumento está bloqueado até uma nova calibração aprovada. Avalie as medições feitas com ele.",
  anulada: "Calibração anulada.",
  "fora-de-uso": "Instrumento fora de uso: ele sai dos alertas de vencimento.",
  "em-uso": "Instrumento de volta ao uso.",
};

export default async function DetalheDoInstrumento({
  params,
  searchParams,
}: PageProps<"/qualidade/calibracao/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Instrumento>(`/instrumentos/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const i = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const podeEditar = permissoes.includes("qualidade.editar");
  const gestor = permissoes.includes("qualidade.excluir");

  return (
    <article>
      <Link
        href="/qualidade/calibracao"
        className="dv-voltar"
      >
        Calibração
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-lg text-texto-2">{i.tag}</span>
        <SituacaoDoInstrumento
          situacao={i.situacao}
          desde={i.proximaCalibracao}
        />
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>{i.descricao}</h1>
      {aviso && AVISOS[aviso] && (
        <p
          role="status"
          className="mt-4 rounded-sm border border-borda bg-superficie px-4 py-2.5 text-base text-texto"
        >
          {AVISOS[aviso]}
        </p>
      )}

      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
          <Dado rotulo="Última calibração">
            {i.ultimaCalibracao ? formatarData(i.ultimaCalibracao) : "Nenhuma"}
          </Dado>
          <Dado rotulo="Próxima calibração">
            {i.proximaCalibracao ? formatarData(i.proximaCalibracao) : "—"}
            {i.proximaCalibracao && i.emUso && i.situacao !== "reprovado" && (
              <span
                className={`ml-1 text-sm ${i.situacao === "vencido" ? "text-nao-conforme" : "text-texto-2"}`}
              >
                · {prazoRelativo(i.proximaCalibracao)}
              </span>
            )}
          </Dado>
          <Dado rotulo="Frequência">
            a cada {i.frequenciaMeses}{" "}
            {i.frequenciaMeses === 1 ? "mês" : "meses"}
          </Dado>
          {i.criterioAceitacao && (
            <Dado rotulo="Critério de aceitação">{i.criterioAceitacao}</Dado>
          )}
          {i.faixa && <Dado rotulo="Faixa">{i.faixa}</Dado>}
          {(i.fabricante || i.modelo) && (
            <Dado rotulo="Fabricante e modelo">
              {[i.fabricante, i.modelo].filter(Boolean).join(" · ")}
            </Dado>
          )}
          {i.numeroSerie && (
            <Dado rotulo="Número de série">
              <span className="font-mono">{i.numeroSerie}</span>
            </Dado>
          )}
          {i.local && <Dado rotulo="Local">{i.local}</Dado>}
          {i.responsavel && <Dado rotulo="Responsável">{i.responsavel}</Dado>}
        </dl>
      </section>

      {i.situacao === "reprovado" && podeEditar && (
        <section
          className={`${painel} mt-6 flex flex-wrap items-center justify-between gap-3 p-5`}
        >
          <p className="max-w-2xl text-base text-texto">
            Medições feitas com este instrumento desde a última calibração
            aprovada podem estar erradas. Registre a avaliação numa NC.
          </p>
          <Link
            href={`/qualidade/nao-conformidades/nova?instrumento=${i.id}`}
            className={botaoPrimario}
          >
            Abrir NC
          </Link>
        </section>
      )}

      {i.emUso && podeEditar && <RegistrarCalibracao instrumento={i} />}

      <section className={`${painel} mt-6`}>
        <h2 className={`${tituloDaSecao} px-5 pt-5`}>
          Histórico de calibrações
        </h2>
        {i.calibracoes.length === 0 ? (
          <p className="px-5 pt-2 pb-5 text-base text-texto-2">
            Nenhuma calibração registrada.
          </p>
        ) : (
          <div className="relative mt-3 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-sm text-texto-2">
                <tr>
                  <th className="px-5 py-2 font-semibold">Data</th>
                  <th className="px-4 py-2 font-semibold">Laboratório</th>
                  <th className="px-4 py-2 font-semibold">Certificado</th>
                  <th className="px-4 py-2 font-semibold">Resultado</th>
                  <th className="px-4 py-2 font-semibold">Erro encontrado</th>
                  <th className="px-4 py-2 font-semibold">Custo</th>
                  {gestor && (
                    <th className="px-4 py-2">
                      <span className="sr-only">Ações</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {i.calibracoes.map((c) => (
                  <tr key={c.id} className={c.anulada ? "text-texto-3" : ""}>
                    <td className="px-5 py-2.5 whitespace-nowrap">
                      <span className={c.anulada ? "line-through" : ""}>
                        {formatarData(c.data)}
                      </span>
                      {c.anulada && (
                        <span className="block text-xs">
                          Anulada: {c.motivoAnulacao}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">{c.laboratorio}</td>
                    <td className="px-4 py-2.5 font-mono text-sm">
                      {c.certificado}
                    </td>
                    <td
                      className={`px-4 py-2.5 font-semibold whitespace-nowrap ${c.anulada ? "" : c.aprovada ? "text-conforme" : "text-nao-conforme"}`}
                    >
                      {c.aprovada ? "Aprovada" : "Reprovada"}
                    </td>
                    <td className="px-4 py-2.5 text-texto-2">
                      {c.erroEncontrado}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-texto-2">
                      {formatarReais(c.custo)}
                    </td>
                    {gestor && (
                      <td className="px-4 py-2.5 text-right">
                        {!c.anulada && (
                          <AnularCalibracao
                            instrumento={i}
                            calibracaoId={c.id}
                          />
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {podeEditar && (
        <Recolhido titulo="Editar dados do instrumento">
          <FormularioDeInstrumento instrumento={i} embutido />
        </Recolhido>
      )}
      {gestor && <UsoDoInstrumento instrumento={i} />}
      <Anexos
        registro="instrumento"
        registroId={i.id}
        voltar={`/qualidade/calibracao/${i.id}`}
        podeEditar={permissoes.includes("qualidade.editar")}
      />
    </article>
  );
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd className="mt-0.5 text-base">{children}</dd>
    </div>
  );
}
