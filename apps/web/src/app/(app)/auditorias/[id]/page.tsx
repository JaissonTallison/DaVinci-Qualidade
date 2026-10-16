import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  NORMAS,
  TIPOS_CONSTATACAO,
  indiceDeConformidade,
  proximoPasso,
  type Auditoria,
  type DadosDoUsuario,
  type KitPreAuditoria,
  type RoteiroDaAuditoria,
  type TipoConstatacao,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { TipoDaConstatacao } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento, hojeEmBrasilia } from "@/lib/datas";
import { botaoPrimario, painel, tituloDaSecao } from "@/lib/estilos";
import { FormularioDeAuditoria } from "../formulario";
import {
  CancelarAuditoria,
  ConcluirAuditoria,
  FormalizarNc,
  IniciarAuditoria,
  RegistrarConstatacao,
} from "./acoes";
import { Anexos } from "@/components/anexos";
import { CabecalhoDaAuditoria } from "./cabecalho";

export const metadata: Metadata = { title: "Auditoria" };

const AVISOS: Record<string, string> = {
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
  planejada:
    "Auditoria planejada. Inicie-a no dia para registrar as constatações.",
  salva: "Planejamento salvo.",
  iniciada: "Auditoria iniciada: registre as constatações.",
  constatacao: "Constatação registrada.",
  concluida: "Auditoria concluída.",
  cancelada: "Auditoria cancelada.",
};

export default async function DetalheDaAuditoria({
  params,
  searchParams,
}: PageProps<"/auditorias/[id]">) {
  const { id } = await params;
  const { aviso, nc } = (await searchParams) as { aviso?: string; nc?: string };
  const [r, eu, rot, k] = await Promise.all([
    chamarApi<Auditoria>(`/auditorias/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
    chamarApi<RoteiroDaAuditoria>(`/auditorias/${id}/roteiro`),
    chamarApi<KitPreAuditoria>(`/auditorias/${id}/kit`),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const a = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const podeEditar = permissoes.includes("auditorias.editar");
  const emAndamento = a.status === "em_andamento";
  const aberta = a.status === "planejada" || emAndamento;
  const textoDoAviso =
    aviso === "nc"
      ? `Constatação formalizada: ${nc} aberta na Qualidade.`
      : aviso
        ? AVISOS[aviso]
        : undefined;
  const contagem = (Object.keys(TIPOS_CONSTATACAO) as TipoConstatacao[]).filter(
    (t) => a.contagem[t] > 0,
  );
  const roteiro = rot.ok
    ? rot.dados
    : {
        perguntas: [],
        contagem: { pendente: 0, conforme: 0, parcial: 0, nao_conforme: 0 },
      };
  const kit = k.ok ? k.dados : null;
  const passo = proximoPasso(a, roteiro, kit);
  const destinoDoPasso =
    passo.destino === "resumo"
      ? `/auditorias/${id}#iniciar`
      : `/auditorias/${id}/${passo.destino}`;
  const respondidas = roteiro.perguntas.length - roteiro.contagem.pendente;
  const indice = indiceDeConformidade(roteiro.contagem);
  const ncs = a.contagem.nc_maior + a.contagem.nc_menor;
  const trilha: [string, string, string][] = [
    [
      "Planejar",
      `Kit ${kit ? `${kit.prontidao}%` : "—"} · ${roteiro.perguntas.length} pergunta(s) no roteiro`,
      `/auditorias/${id}/kit`,
    ],
    [
      "Auditar",
      `${respondidas} de ${roteiro.perguntas.length} respondida(s)${indice === null ? "" : ` · ${indice}% conforme`}`,
      `/auditorias/${id}/execucao`,
    ],
    [
      "Registrar",
      `${a.constatacoes.length} constatação(ões) · ${a.ncsPendentes} NC a formalizar`,
      `/auditorias/${id}/achados`,
    ],
    [
      "Tratar",
      `${ncs - a.ncsPendentes} de ${ncs} NC aberta(s) na Qualidade`,
      `/auditorias/${id}/tratar`,
    ],
    [
      "Entregar",
      a.status === "concluida" ? "Concluída" : "Relatório em aberto",
      `/auditorias/${id}/relatorio`,
    ],
  ];

  return (
    <article>
      <CabecalhoDaAuditoria auditoria={a} etapa="resumo" />
      {textoDoAviso && (
        <p
          role="status"
          className="mt-4 rounded-sm border border-borda bg-superficie px-4 py-2.5 text-base text-texto"
        >
          {textoDoAviso}
        </p>
      )}

      <section
        className={`${painel} mt-6 grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center`}
        aria-label="Próximo passo"
      >
        <div>
          <p className="text-xs font-semibold tracking-[0.06em] text-texto-2 uppercase">
            Próximo passo
          </p>
          <p className="mt-1 text-lg font-semibold">{passo.titulo}</p>
          <p className="text-base text-texto-2">{passo.descricao}</p>
        </div>
        {a.status !== "cancelada" && (
          <Link
            href={destinoDoPasso}
            className={`${botaoPrimario} justify-self-start lg:justify-self-end`}
          >
            {passo.titulo}
          </Link>
        )}
      </section>

      <ol
        aria-label="Trilha da auditoria"
        className="mt-4 grid gap-px overflow-hidden rounded-md border border-borda bg-borda sm:grid-cols-5"
      >
        {trilha.map(([etapa, resumo, href], i) => (
          <li key={etapa} className="bg-superficie">
            <Link
              href={href}
              className="block h-full px-4 py-3 hover:bg-superficie-2"
            >
              <span className="text-sm text-texto-2 tabular-nums">{i + 1}</span>{" "}
              <span className="font-semibold">{etapa}</span>
              <span className="mt-1 block text-sm text-texto-2">{resumo}</span>
            </Link>
          </li>
        ))}
      </ol>

      <section className={`${painel} mt-6 p-5`}>
        <p className="max-w-[72ch] text-md whitespace-pre-line">{a.escopo}</p>
        <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
          <Dado rotulo="Período">
            {a.dataInicio === a.dataFim
              ? formatarData(a.dataInicio)
              : `${formatarData(a.dataInicio)} a ${formatarData(a.dataFim)}`}
          </Dado>
          <Dado rotulo="Auditor líder">{a.auditorLider}</Dado>
          {a.equipe && <Dado rotulo="Equipe">{a.equipe}</Dado>}
          {a.areas && <Dado rotulo="Áreas">{a.areas}</Dado>}
          {a.representante && (
            <Dado rotulo="Representante">{a.representante}</Dado>
          )}
        </dl>
      </section>

      {a.status === "planejada" && podeEditar && (
        <div id="iniciar">
          <IniciarAuditoria auditoria={a} />
        </div>
      )}

      {(a.status !== "planejada" || a.constatacoes.length > 0) && (
        <section id="constatacoes" className={`${painel} mt-6`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5">
            <h2 className={tituloDaSecao}>Constatações</h2>
            <p className="text-sm text-texto-2">
              {contagem.length
                ? contagem
                    .map(
                      (t) =>
                        `${a.contagem[t]} ${TIPOS_CONSTATACAO[t].replace(/^(?!NC)./, (c) => c.toLowerCase())}`,
                    )
                    .join(" · ")
                : "Nenhuma ainda"}
              {a.ncsPendentes > 0 && (
                <span className="text-atencao">
                  {" "}
                  · {a.ncsPendentes} NC a formalizar
                </span>
              )}
            </p>
          </div>
          {a.constatacoes.length > 0 && (
            <ol className="mt-3 divide-y divide-borda border-t border-borda">
              {a.constatacoes.map((c) => (
                <li
                  key={c.id}
                  className="grid gap-3 px-5 py-3 lg:grid-cols-[12rem_minmax(0,1fr)_auto]"
                >
                  <div className="flex flex-col gap-1">
                    <TipoDaConstatacao tipo={c.tipo} />
                    <span className="text-sm text-texto-2">
                      {NORMAS[c.norma]}
                      {c.clausula && ` · ${c.clausula}`}
                    </span>
                    {c.area && (
                      <span className="text-sm text-texto-3">{c.area}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-base whitespace-pre-line">
                      {c.descricao}
                    </p>
                    {c.evidencia && (
                      <p className="mt-1 text-sm whitespace-pre-line text-texto-2">
                        Evidência: {c.evidencia}
                      </p>
                    )}
                  </div>
                  <div className="lg:text-right">
                    {c.ncId ? (
                      <Link
                        href={`/qualidade/nao-conformidades/${c.ncId}`}
                        className="font-mono text-sm font-medium text-info hover:underline"
                      >
                        {c.ncNumero}
                      </Link>
                    ) : (c.tipo === "nc_maior" || c.tipo === "nc_menor") &&
                      emAndamento &&
                      podeEditar ? (
                      <FormalizarNc auditoria={a} constatacaoId={c.id} />
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {emAndamento && podeEditar && <RegistrarConstatacao auditoria={a} />}
      {emAndamento && podeEditar && (
        <div id="conclusao">
          <ConcluirAuditoria auditoria={a} />
        </div>
      )}

      {a.status === "concluida" && a.conclusao && (
        <section id="conclusao" className={`${painel} mt-6 p-5`}>
          <h2 className={tituloDaSecao}>Conclusão</h2>
          {a.concluidaEm && (
            <p className="mt-1 text-sm text-texto-2">
              {formatarMomento(a.concluidaEm)}
            </p>
          )}
          <p className="mt-3 max-w-[72ch] text-base whitespace-pre-line">
            {a.conclusao}
          </p>
        </section>
      )}
      {a.status === "cancelada" && a.motivoCancelamento && (
        <section className={`${painel} mt-6 p-5`}>
          <h2 className={tituloDaSecao}>Cancelamento</h2>
          <p className="mt-2 text-base">{a.motivoCancelamento}</p>
        </section>
      )}

      {aberta && podeEditar && (
        <Recolhido titulo="Alterar planejamento">
          <FormularioDeAuditoria
            auditoria={a}
            hoje={hojeEmBrasilia()}
            embutido
          />
        </Recolhido>
      )}
      {aberta && permissoes.includes("auditorias.excluir") && (
        <CancelarAuditoria auditoria={a} />
      )}
      <Anexos
        registro="auditoria"
        registroId={a.id}
        voltar={`/auditorias/${a.id}`}
        podeEditar={permissoes.includes("auditorias.editar")}
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
