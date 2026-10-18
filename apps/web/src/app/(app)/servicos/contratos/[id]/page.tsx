import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  SITUACOES_DO_CONTRATO,
  STATUS_OS,
  type Contrato,
  type DadosDoUsuario,
  type OrdemDeServico,
  type Pagina,
} from "@davinci/types";
import { Anexos } from "@/components/anexos";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import { COR_DA_SITUACAO } from "../situacao";
import { EditarContrato } from "../formularios";

export const metadata: Metadata = { title: "Contrato" };
const AVISOS = {
  criado: "Contrato cadastrado.",
  salvo: "Contrato salvo.",
  encerrado: "Contrato encerrado.",
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
};

export default async function DetalheDoContrato({
  params,
  searchParams,
}: PageProps<"/servicos/contratos/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Contrato>(`/contratos/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const c = r.dados;
  const ordens = await chamarApi<Pagina<OrdemDeServico>>(
    `/ordens-de-servico?clienteId=${c.clienteId}&porPagina=100`,
  );
  const doContrato = ordens.ok
    ? ordens.dados.itens.filter((o) => o.contratoId === c.id)
    : [];
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const podeEditar = permissoes.includes("servicos.editar");
  return (
    <article>
      <Link
        href="/servicos/contratos"
        className="dv-voltar"
      >
        Contratos e SLA
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4">
        <span className="font-mono text-lg text-texto-2">{c.numero}</span>
        <span className={COR_DA_SITUACAO[c.situacao]}>
          {SITUACOES_DO_CONTRATO[c.situacao]}
        </span>
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>{c.clienteNome}</h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      <section
        className={`${painel} mt-6 grid gap-x-8 gap-y-4 p-5 sm:grid-cols-4`}
      >
        <Dado rotulo="Objeto" largo>
          {c.objeto}
        </Dado>
        <Dado rotulo="Vigência">
          {formatarData(c.inicio)} a {formatarData(c.fim)}
        </Dado>
        <Dado rotulo="SLA">{c.prazoAtendimentoDias} dia(s) por OS</Dado>
        <Dado rotulo="Cumprimento (12 meses)">
          <span
            className={
              c.sla.atendeMeta === false
                ? "font-semibold text-nao-conforme"
                : c.sla.atendeMeta
                  ? "text-conforme"
                  : ""
            }
          >
            {c.sla.percentual === null
              ? "Sem OS concluída"
              : `${c.sla.percentual}% (${c.sla.noPrazo} de ${c.sla.concluidas})`}
          </span>{" "}
          · meta {c.metaNoPrazo}%
        </Dado>
        {c.valorMensal && (
          <Dado rotulo="Valor mensal">
            R${" "}
            {Number(c.valorMensal).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </Dado>
        )}
        {c.observacoes && (
          <Dado rotulo="Observações" largo>
            {c.observacoes}
          </Dado>
        )}
        {c.motivoEncerramento && (
          <Dado rotulo="Motivo do encerramento" largo>
            {c.motivoEncerramento}
          </Dado>
        )}
      </section>
      <section className={`${painel} mt-6`}>
        <h2 className={`${tituloDaSecao} px-5 pt-5`}>
          Ordens de serviço do contrato
        </h2>
        {doContrato.length === 0 ? (
          <p className="px-5 py-4 text-base text-texto-2">
            Nenhuma OS aberta neste contrato.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-borda border-t border-borda">
            {doContrato.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-2.5 text-sm"
              >
                <span>
                  <Link
                    href={`/servicos/ordens/${o.id}`}
                    className="font-mono text-info hover:underline"
                  >
                    {o.numero}
                  </Link>{" "}
                  {o.titulo}
                </span>
                <span className="text-texto-2">
                  {STATUS_OS[o.status]} · prazo {formatarData(o.prazo)}
                  {o.noPrazo !== null && (
                    <span
                      className={
                        o.noPrazo ? "text-conforme" : "text-nao-conforme"
                      }
                    >
                      {" "}
                      · {o.noPrazo ? "no prazo" : "fora do prazo"}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {podeEditar && c.situacao !== "encerrado" && <EditarContrato c={c} />}
      <Anexos
        registro="contrato"
        registroId={c.id}
        voltar={`/servicos/contratos/${c.id}`}
        podeEditar={podeEditar}
      />
    </article>
  );
}

function Dado({
  rotulo,
  children,
  largo = false,
}: {
  rotulo: string;
  children: ReactNode;
  largo?: boolean;
}) {
  return (
    <div className={largo ? "sm:col-span-4" : ""}>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd className="mt-0.5 text-base whitespace-pre-line">{children}</dd>
    </div>
  );
}
