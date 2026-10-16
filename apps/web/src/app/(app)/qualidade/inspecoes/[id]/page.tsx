import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  NQAS,
  RESPOSTAS_ITEM,
  TIPOS_INSPECAO,
  type DadosDoUsuario,
  type Inspecao,
  type NaoConformidadeResumo,
  type Pagina,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { StatusDaInspecao, StatusDaNc } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento } from "@/lib/datas";
import {
  botaoPrimario,
  painel,
  tituloDaPagina,
  tituloDaSecao,
} from "@/lib/estilos";
import { CancelarInspecao } from "./cancelar";
import { AnexosDoItem } from "@/components/anexos-do-item";
import { RespostasDaInspecao } from "./respostas";
import { Anexos } from "@/components/anexos";

export const metadata: Metadata = { title: "Inspeção" };

const AVISOS: Record<string, string> = {
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
  salva: "Respostas salvas.",
  aprovada: "Inspeção concluída: aprovada.",
  reprovada:
    "Inspeção concluída: reprovada. Abra a NC para tratar o que foi encontrado.",
  cancelada: "Inspeção cancelada.",
};

const COR_DA_RESPOSTA = {
  ok: "text-conforme",
  nok: "text-nao-conforme",
  na: "text-texto-2",
} as const;

export default async function DetalheDaInspecao({
  params,
  searchParams,
}: PageProps<"/qualidade/inspecoes/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Inspecao>(`/inspecoes/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const i = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const emAndamento = i.status === "em_andamento";
  const ncs =
    i.status === "reprovada"
      ? await chamarApi<Pagina<NaoConformidadeResumo>>(
          `/nao-conformidades?origemRef=${encodeURIComponent(i.numero)}&porPagina=100`,
        )
      : null;

  return (
    <article>
      <Link
        href="/qualidade/inspecoes"
        className="text-sm text-texto-2 hover:underline"
      >
        Inspeções
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-lg text-texto-2">{i.numero}</span>
        <StatusDaInspecao status={i.status} />
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>{i.objeto}</h1>
      {aviso && AVISOS[aviso] && (
        <p
          role="status"
          className="mt-4 rounded-sm border border-borda bg-superficie px-4 py-2.5 text-base text-texto"
        >
          {AVISOS[aviso]}
        </p>
      )}

      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
          <Dado rotulo="Tipo">{TIPOS_INSPECAO[i.tipo]}</Dado>
          <Dado rotulo="Data">{formatarData(i.data)}</Dado>
          <Dado rotulo="Inspetor">{i.inspetor}</Dado>
          {i.lote && (
            <Dado rotulo="Lote">
              <span className="font-mono">{i.lote}</span>
            </Dado>
          )}
          {i.quantidade !== null && (
            <Dado rotulo="Quantidade">
              {i.quantidade.toLocaleString("pt-BR")}
            </Dado>
          )}
          {i.local && <Dado rotulo="Local">{i.local}</Dado>}
          {i.modeloNome && <Dado rotulo="Modelo">{i.modeloNome}</Dado>}
          {i.fornecedorNome && i.fornecedorId && (
            <Dado rotulo="Fornecedor">
              <Link
                href={`/cadastros/clientes-e-fornecedores/${i.fornecedorId}`}
                className="text-info hover:underline"
              >
                {i.fornecedorNome}
              </Link>
            </Dado>
          )}
          {i.plano && (
            <Dado rotulo="Amostragem">
              NQA {NQAS[i.plano.nqa]} · nível {i.plano.nivel} · amostra{" "}
              {i.plano.amostra} · Ac {i.plano.aceita} / Re {i.plano.rejeita}
              {i.defeituosos !== null && (
                <span className="block text-sm text-texto-2">
                  {i.defeituosos} defeituoso{i.defeituosos === 1 ? "" : "s"} na
                  amostra
                </span>
              )}
            </Dado>
          )}
          {i.concluidaEm && (
            <Dado rotulo="Concluída em">{formatarMomento(i.concluidaEm)}</Dado>
          )}
        </dl>
      </section>

      {emAndamento && permissoes.includes("qualidade.editar") ? (
        <RespostasDaInspecao inspecao={i} />
      ) : (
        <section className={`${painel} mt-6`}>
          <h2 className={`${tituloDaSecao} px-5 pt-5`}>Itens</h2>
          <table className="mt-3 w-full text-left">
            <thead className="bg-superficie-2 text-sm text-texto-2">
              <tr>
                <th className="px-5 py-2 font-semibold">Item</th>
                <th className="px-4 py-2 font-semibold">Resposta</th>
                <th className="px-4 py-2 font-semibold">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {i.itens.map((item) => (
                <tr key={item.id}>
                  <td className="max-w-xl px-5 py-2.5">
                    <span className="mr-2 text-texto-3">{item.ordem + 1}.</span>
                    {item.verificar}
                    {item.criterio && (
                      <span className="block pl-6 text-sm text-texto-2">
                        Critério: {item.criterio}
                      </span>
                    )}
                  </td>
                  <td
                    className={`px-4 py-2.5 font-semibold whitespace-nowrap ${item.resposta ? COR_DA_RESPOSTA[item.resposta] : "text-texto-3"}`}
                  >
                    {item.resposta
                      ? RESPOSTAS_ITEM[item.resposta]
                      : "Sem resposta"}
                  </td>
                  <td className="px-4 py-2.5 text-texto-2">
                    {item.observacao}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {i.observacoes && (
            <p className="border-t border-borda px-5 py-3 text-base whitespace-pre-line">
              {i.observacoes}
            </p>
          )}
        </section>
      )}

      <section className={`${painel} mt-6`}>
        <h2 className={`${tituloDaSecao} px-5 pt-5`}>
          Fotos e evidências por item
        </h2>
        <p className="px-5 text-base text-texto-2">
          Foto do defeito, leitura do instrumento, etiqueta do lote. Item NOK
          com foto vira evidência pronta da NC.
        </p>
        <ol className="mt-3 divide-y divide-borda border-t border-borda">
          {i.itens.map((item) => (
            <li
              key={item.id}
              className="grid gap-2 px-5 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
            >
              <p className="text-base">
                <span className="mr-2 text-texto-3 tabular-nums">
                  {item.ordem + 1}.
                </span>
                {item.verificar}
                {item.resposta && (
                  <span
                    className={`ml-2 text-sm font-semibold ${COR_DA_RESPOSTA[item.resposta]}`}
                  >
                    {RESPOSTAS_ITEM[item.resposta]}
                  </span>
                )}
              </p>
              <AnexosDoItem
                registro="item_da_inspecao"
                registroId={item.id}
                voltar={`/qualidade/inspecoes/${i.id}`}
                podeEditar={
                  permissoes.includes("qualidade.editar") &&
                  i.status !== "cancelada"
                }
              />
            </li>
          ))}
        </ol>
      </section>

      {i.status === "reprovada" && (
        <section className={`${painel} mt-6 p-5`}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className={tituloDaSecao}>Não conformidades</h2>
            {permissoes.includes("qualidade.editar") && (
              <Link
                href={`/qualidade/nao-conformidades/nova?inspecao=${i.id}`}
                className={botaoPrimario}
              >
                Abrir NC
              </Link>
            )}
          </div>
          {ncs?.ok && ncs.dados.itens.length > 0 ? (
            <ul className="mt-3 divide-y divide-borda">
              {ncs.dados.itens.map((nc) => (
                <li
                  key={nc.id}
                  className="flex flex-wrap items-center gap-x-6 gap-y-1 py-2.5"
                >
                  <Link
                    href={`/qualidade/nao-conformidades/${nc.id}`}
                    className="font-mono text-sm font-medium text-info hover:underline"
                  >
                    {nc.numero}
                  </Link>
                  <span className="min-w-48 flex-1">{nc.titulo}</span>
                  <StatusDaNc
                    status={nc.status}
                    vencida={nc.vencida}
                    prazo={nc.prazo}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-base text-texto-2">
              Nenhuma NC aberta a partir desta inspeção. A NC já vem com os
              itens NOK e as observações.
            </p>
          )}
        </section>
      )}

      {i.status === "cancelada" && i.motivoCancelamento && (
        <section className={`${painel} mt-6 p-5`}>
          <h2 className={tituloDaSecao}>Cancelamento</h2>
          <p className="mt-2 text-base">{i.motivoCancelamento}</p>
        </section>
      )}

      {emAndamento && permissoes.includes("qualidade.excluir") && (
        <CancelarInspecao inspecao={i} />
      )}
      <Anexos
        registro="inspecao"
        registroId={i.id}
        voltar={`/qualidade/inspecoes/${i.id}`}
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
