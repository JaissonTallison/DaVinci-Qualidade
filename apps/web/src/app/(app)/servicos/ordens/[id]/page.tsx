import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Printer } from "lucide-react";
import {
  STATUS_DO_PASSO,
  type ConviteDePesquisa,
  type DadosDoUsuario,
  type OrdemDeServico,
} from "@davinci/types";
import { Anexos } from "@/components/anexos";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { StatusDaOs } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento } from "@/lib/datas";
import { botaoSecundario, painel, tituloDaPagina } from "@/lib/estilos";
import { LinkDaPesquisa } from "@/components/link-da-pesquisa";
import { AvaliarOs, CancelarOs, ConcluirOs, IniciarOs } from "./acoes";
import { ExecucaoDaOs } from "./execucao";
import { EnviarPesquisa } from "./pesquisa";

export const metadata: Metadata = { title: "Ordem de serviço" };
const AVISOS: Record<string, string> = {
  criada: "Ordem de serviço aberta.",
  iniciada: "Execução iniciada.",
  concluida: "OS concluída. Registre a avaliação do cliente quando receber.",
  cancelada: "OS cancelada.",
  avaliada: "Avaliação registrada.",
  execucao: "Execução salva.",
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
};

export default async function DetalheDaOs({
  params,
  searchParams,
}: PageProps<"/servicos/ordens/[id]">) {
  const { id } = await params;
  const { aviso, convite } = (await searchParams) as {
    aviso?: string;
    convite?: string;
  };
  const [r, eu] = await Promise.all([
    chamarApi<OrdemDeServico>(`/ordens-de-servico/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const o = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const podeEditar = permissoes.includes("servicos.editar");
  const convites = convite
    ? await chamarApi<ConviteDePesquisa[]>("/pesquisas")
    : null;
  const conviteNovo = convites?.ok
    ? convites.dados.find((c) => c.id === convite)
    : undefined;
  return (
    <article>
      <Link
        href="/servicos/ordens"
        className="text-sm text-texto-2 hover:underline"
      >
        Ordens de serviço
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4">
        <span className="font-mono text-lg text-texto-2">{o.numero}</span>
        <StatusDaOs status={o.status} atrasada={o.atrasada} />
      </header>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className={tituloDaPagina}>{o.titulo}</h1>
        <div className="flex flex-wrap gap-2">
          {podeEditar && o.status === "concluida" && o.nota === null && (
            <EnviarPesquisa
              clienteId={o.clienteId}
              osId={o.id}
              voltar={`/servicos/ordens/${o.id}`}
            />
          )}
          <Link
            href={`/servicos/ordens/${o.id}/imprimir`}
            className={botaoSecundario}
          >
            <Printer aria-hidden size={16} strokeWidth={2} />
            Relatório da OS
          </Link>
        </div>
      </div>
      <Aviso avisos={AVISOS} chave={aviso} />
      {conviteNovo && <LinkDaPesquisa convite={conviteNovo} />}
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <Dado rotulo="Cliente">
            <Link
              href={`/cadastros/clientes-e-fornecedores/${o.clienteId}`}
              className="text-info hover:underline"
            >
              {o.clienteNome}
            </Link>
          </Dado>
          <Dado rotulo="Responsável">{o.responsavel}</Dado>
          <Dado rotulo="Prazo">
            <span className={o.atrasada ? "text-nao-conforme" : ""}>
              {formatarData(o.prazo)}
              {o.atrasada && " · atrasada"}
            </span>
          </Dado>
          {o.contratoNumero && o.contratoId && (
            <Dado rotulo="Contrato">
              <Link
                href={`/servicos/contratos/${o.contratoId}`}
                className="text-info hover:underline"
              >
                {o.contratoNumero}
              </Link>
              {o.noPrazo !== null && (
                <span
                  className={o.noPrazo ? "text-conforme" : "text-nao-conforme"}
                >
                  {" "}
                  · {o.noPrazo ? "SLA cumprido" : "fora do SLA"}
                </span>
              )}
            </Dado>
          )}
          {o.servicoNome && (
            <Dado rotulo="Serviço do catálogo">{o.servicoNome}</Dado>
          )}
          {o.horasTotais > 0 && (
            <Dado rotulo="Horas trabalhadas">
              {o.horasTotais.toLocaleString("pt-BR")} h
            </Dado>
          )}
          {o.recebidoPor && <Dado rotulo="Recebido por">{o.recebidoPor}</Dado>}
          <Dado rotulo="O que será feito" largo>
            {o.descricao}
          </Dado>
          {o.iniciadaEm && (
            <Dado rotulo="Iniciada em">{formatarMomento(o.iniciadaEm)}</Dado>
          )}
          {o.concluidaEm && (
            <Dado rotulo="Concluída em">{formatarMomento(o.concluidaEm)}</Dado>
          )}
          {o.nota && (
            <Dado rotulo="Avaliação do cliente">
              {o.nota} de 5{o.comentario ? ` · ${o.comentario}` : ""}
            </Dado>
          )}
          {o.relatorio && (
            <Dado rotulo="Relatório" largo>
              {o.relatorio}
            </Dado>
          )}
          {o.motivoCancelamento && (
            <Dado rotulo="Motivo do cancelamento" largo>
              {o.motivoCancelamento}
            </Dado>
          )}
        </dl>
      </section>
      {podeEditar && o.status === "em_execucao" ? (
        <section id="execucao" className={`${painel} mt-6 p-5`}>
          <ExecucaoDaOs os={o} />
        </section>
      ) : (
        (o.checklist.length > 0 || o.materiais.length > 0) && (
          <section className={`${painel} mt-6 p-5`}>
            {o.checklist.length > 0 && (
              <ul className="flex flex-col gap-1 text-base">
                {o.checklist.map((p, i) => (
                  <li key={i}>
                    <span className="mr-2 text-texto-3 tabular-nums">
                      {i + 1}.
                    </span>
                    {p.item}{" "}
                    <span className="text-sm text-texto-2">
                      · {STATUS_DO_PASSO[p.status]}
                      {p.observacao && ` · ${p.observacao}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {o.materiais.length > 0 && (
              <p className="mt-3 text-sm text-texto-2">
                Materiais:{" "}
                {o.materiais
                  .map(
                    (m) =>
                      `${m.quantidade.toLocaleString("pt-BR")} ${m.unidade} ${m.descricao}`,
                  )
                  .join("; ")}
              </p>
            )}
          </section>
        )
      )}
      {podeEditar && o.status === "aberta" && <IniciarOs os={o} />}
      {podeEditar && o.status === "em_execucao" && <ConcluirOs os={o} />}
      {podeEditar && o.status === "concluida" && o.nota === null && (
        <AvaliarOs os={o} />
      )}
      <Anexos
        registro="ordem_de_servico"
        registroId={o.id}
        voltar={`/servicos/ordens/${o.id}`}
        podeEditar={podeEditar}
      />
      {permissoes.includes("servicos.excluir") &&
        (o.status === "aberta" || o.status === "em_execucao") && (
          <CancelarOs os={o} />
        )}
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
    <div className={largo ? "sm:col-span-3" : ""}>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd className="mt-0.5 text-base whitespace-pre-line">{children}</dd>
    </div>
  );
}
