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
  botaoSecundario,
  cabecalhoDoPainel,
  painel,
  tituloDaPagina,
  tituloDaSecao,
  tituloDoPainel,
} from "@/lib/estilos";
import { CancelarInspecao } from "./cancelar";
import { AnexosDoItem } from "@/components/anexos-do-item";
import { RespostasDaInspecao } from "./respostas";
import { Anexos } from "@/components/anexos";

import { CabecalhoComVoltar } from "@/components/pagina-de-cadastro";
import { CaixaDeAlerta } from "@/components/caixa-de-alerta";
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
  const concluida = i.status === "aprovada" || i.status === "reprovada";
  const conformes = i.itens.filter((x) => x.resposta === "ok").length;
  const naoConformes = i.itens.filter((x) => x.resposta === "nok").length;
  const naoSeAplica = i.itens.filter((x) => x.resposta === "na").length;
  const ncs =
    i.status === "reprovada"
      ? await chamarApi<Pagina<NaoConformidadeResumo>>(
          `/nao-conformidades?origemRef=${encodeURIComponent(i.numero)}&porPagina=100`,
        )
      : null;

  return (
    <article>
      <CabecalhoComVoltar
        voltar={{ href: "/qualidade/inspecoes", rotulo: "Inspeções" }}
      >
        <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-mono text-lg text-texto-2">{i.numero}</span>
          <StatusDaInspecao status={i.status} />
        </header>
        <h1 className={`${tituloDaPagina} mt-1`}>{i.objeto}</h1>
        {aviso && AVISOS[aviso] && (
          <CaixaDeAlerta tom="sucesso" className="mt-4">
            {AVISOS[aviso]}
          </CaixaDeAlerta>
        )}
      </CabecalhoComVoltar>

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

      {concluida && (
        <section className={`${painel} mt-6 p-5`}>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className={tituloDaSecao}>Resultado</h2>
            <StatusDaInspecao status={i.status} />
            {i.concluidaEm && (
              <span className="text-sm text-texto-2">
                Concluída em {formatarMomento(i.concluidaEm)}
              </span>
            )}
          </div>
          <p className="mt-3 max-w-[72ch] text-base">
            {i.plano ? (
              <>
                Lote{" "}
                <span className="font-semibold">
                  {i.status === "aprovada" ? "aceito" : "rejeitado"} pela
                  amostragem
                </span>
                : {i.defeituosos}{" "}
                {i.defeituosos === 1 ? "defeituoso" : "defeituosos"} na amostra
                de {i.plano.amostra} (aceita com até {i.plano.aceita}; rejeita
                com {i.plano.rejeita} ou mais).
              </>
            ) : (
              <>
                Resultado <span className="font-semibold">pelo checklist</span>:{" "}
                {naoConformes}{" "}
                {naoConformes === 1
                  ? "item não conforme"
                  : "itens não conformes"}{" "}
                de {i.itens.length}.
              </>
            )}
          </p>
          <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
            <Dado rotulo="Conformes (OK)">{conformes}</Dado>
            <Dado rotulo="Não conformes (NOK)">
              <span
                className={
                  naoConformes > 0 ? "font-medium text-nao-conforme" : ""
                }
              >
                {naoConformes}
              </span>
            </Dado>
            {naoSeAplica > 0 && (
              <Dado rotulo="Não se aplica (N/A)">{naoSeAplica}</Dado>
            )}
            {i.plano && (
              <Dado rotulo="Defeituosos na amostra">
                {i.defeituosos} de {i.plano.amostra}
              </Dado>
            )}
          </dl>
          {i.plano && i.status === "reprovada" && naoConformes === 0 && (
            <p className="mt-4 max-w-[72ch] text-sm text-texto-2">
              Os itens do checklist estão todos conformes, mas o lote foi
              reprovado pela amostragem. Com plano de amostragem, o resultado do
              lote vem do número de defeituosos (Ac/Re), não das respostas do
              checklist.
            </p>
          )}
          {i.plano && i.status === "aprovada" && naoConformes > 0 && (
            <p className="mt-4 max-w-[72ch] text-sm text-texto-2">
              Há {naoConformes}{" "}
              {naoConformes === 1 ? "item não conforme" : "itens não conformes"}{" "}
              no checklist, mas o lote foi aprovado pela amostragem (defeituosos
              dentro do aceite). O resultado do lote vem da amostragem.
            </p>
          )}
        </section>
      )}

      {emAndamento && permissoes.includes("qualidade.editar") ? (
        <RespostasDaInspecao inspecao={i} />
      ) : (
        <section className={`${painel} mt-6`}>
          <header className={cabecalhoDoPainel}>
            <h2 className={tituloDoPainel}>Itens</h2>
          </header>
          <table className="mt-3 w-full text-left">
            <thead className="bg-superficie-2 text-xs uppercase tracking-[0.04em] text-texto-2">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Item</th>
                <th className="px-4 py-2.5 font-semibold">Resposta</th>
                <th className="px-4 py-2.5 font-semibold">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {i.itens.map((item) => (
                <tr key={item.id}>
                  <td className="max-w-xl px-5 py-3">
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
                  <td className="px-4 py-3 text-texto-2">{item.observacao}</td>
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
        <header className={cabecalhoDoPainel}>
          <h2 className={tituloDoPainel}>Fotos e evidências por item</h2>
        </header>
        <p className="px-5 text-base text-texto-2">
          Priorize os itens{" "}
          <span className="font-medium text-nao-conforme">
            Não conforme (NOK)
          </span>
          : a foto do defeito vira evidência pronta da NC. Nos conformes, a
          evidência (leitura do instrumento, etiqueta do lote) é opcional.
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
        <section className={`${painel} mt-6`}>
          <header className={cabecalhoDoPainel}>
            <h2 className={tituloDoPainel}>Não conformidades</h2>
          </header>
          <div className="p-5">
            {ncs?.ok && ncs.dados.itens.length > 0 ? (
              <>
                <p className="mt-1 text-base text-texto-2">
                  Esta inspeção já gerou{" "}
                  {ncs.dados.itens.length === 1
                    ? "uma NC"
                    : `${ncs.dados.itens.length} NCs`}
                  . Consulte o andamento do tratamento:
                </p>
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
                {permissoes.includes("qualidade.editar") && (
                  <div className="mt-4">
                    <Link
                      href={`/qualidade/nao-conformidades/nova?inspecao=${i.id}`}
                      className={botaoSecundario}
                    >
                      Abrir outra NC
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
                <p className="max-w-[60ch] text-base text-texto-2">
                  Nenhuma NC foi aberta a partir desta inspeção. Abra uma para
                  tratar o que foi encontrado — ela já vem ligada a esta
                  inspeção
                  {naoConformes > 0
                    ? ", com os itens não conformes e as observações"
                    : ""}
                  .
                </p>
                {permissoes.includes("qualidade.editar") && (
                  <Link
                    href={`/qualidade/nao-conformidades/nova?inspecao=${i.id}`}
                    className={botaoPrimario}
                  >
                    Abrir NC
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {i.status === "cancelada" && i.motivoCancelamento && (
        <section className={`${painel} mt-6`}>
          <header className={cabecalhoDoPainel}>
            <h2 className={tituloDoPainel}>Cancelamento</h2>
          </header>
          <div className="p-5">
            <p className="text-base">{i.motivoCancelamento}</p>
          </div>
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
