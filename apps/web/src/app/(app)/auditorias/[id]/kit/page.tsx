import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleAlert, CircleCheck, Circle, CircleDashed } from "lucide-react";
import {
  MOMENTOS_DO_KIT,
  NORMAS,
  TIPOS_AUDITORIA,
  type Auditoria,
  type DadosDoUsuario,
  type KitPreAuditoria,
  type MomentoDoKit,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { StatusDaAuditoria } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { EtapasDaAuditoria } from "../etapas";
import { AbasDoPlanejar } from "../planejar-abas";
import { StatusDoItem } from "./status";

export const metadata: Metadata = { title: "Kit pré-auditoria" };

/** Etapa Planejar: o que precisa estar pronto a 90, 30, 15 e 7 dias da auditoria e no dia dela. */
export default async function KitDaAuditoria({
  params,
}: PageProps<"/auditorias/[id]/kit">) {
  const { id } = await params;
  const [a, kit, eu] = await Promise.all([
    chamarApi<Auditoria>(`/auditorias/${id}`),
    chamarApi<KitPreAuditoria>(`/auditorias/${id}/kit`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!a.ok && a.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!a.ok) return <AvisoDeErro erro={a.erro} />;
  if (!kit.ok) return <AvisoDeErro erro={kit.erro} />;
  const k = kit.dados;
  const podeEditar =
    eu.ok &&
    eu.dados.permissoes.includes("auditorias.editar") &&
    !k.somenteLeitura;
  const atrasados = k.itens.filter((i) => i.atrasado).length;
  return (
    <article>
      <Link href="/auditorias" className="text-sm text-texto-2 hover:underline">
        Auditorias
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-lg text-texto-2">{a.dados.numero}</span>
        <StatusDaAuditoria status={a.dados.status} />
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>
        Auditoria {TIPOS_AUDITORIA[a.dados.tipo].toLowerCase()} ·{" "}
        {a.dados.normas.map((n) => NORMAS[n]).join(", ")}
      </h1>
      <EtapasDaAuditoria id={id} atual="planejar" />
      <AbasDoPlanejar id={id} atual="kit" />

      <section className={`${painel} mt-6 p-5`} aria-label="Prontidão">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-texto-2">
              Kit pré-auditoria · início em {formatarData(a.dados.dataInicio)}
            </p>
            <p className="mt-1 text-base">
              A empresa está{" "}
              <span className="text-3xl font-semibold tabular-nums">
                {k.prontidao}%
              </span>{" "}
              pronta para a auditoria
            </p>
          </div>
          <p className="text-sm text-texto-2">
            {k.concluidos} de {k.total} itens concluídos
            {atrasados > 0 && (
              <span className="text-nao-conforme">
                {" "}
                · {atrasados} {atrasados === 1 ? "atrasado" : "atrasados"}
              </span>
            )}
          </p>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-xs bg-superficie-2"
          role="img"
          aria-label={`${k.prontidao}% de prontidão`}
        >
          <div
            className="h-full bg-conforme"
            style={{ width: `${k.prontidao}%` }}
          />
        </div>
        {k.somenteLeitura && (
          <p className="mt-3 text-sm text-texto-2">
            Auditoria encerrada: o kit fica como registro e não muda mais.
          </p>
        )}
      </section>

      <ol className="mt-6 border-l-2 border-borda-forte pl-5">
        {(Object.keys(MOMENTOS_DO_KIT) as MomentoDoKit[]).map((m) => {
          const itens = k.itens.filter((i) => i.momento === m);
          const prazo = itens[0]?.prazo;
          return (
            <li key={m} className="relative pb-8 last:pb-0">
              <span
                aria-hidden
                className="absolute top-1 -left-[1.6rem] size-3 rounded-full bg-menu"
              />
              <h2 className="flex flex-wrap items-baseline gap-x-3 text-sm font-semibold tracking-[0.06em] text-texto uppercase">
                {MOMENTOS_DO_KIT[m].rotulo}
                {prazo && (
                  <span className="font-normal tracking-normal text-texto-2 normal-case">
                    até {formatarData(prazo)}
                  </span>
                )}
              </h2>
              <ul className={`${painel} mt-3 divide-y divide-borda`}>
                {itens.map((i) => (
                  <li
                    key={i.codigo}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
                  >
                    <span className="shrink-0" aria-hidden>
                      {i.status === "concluido" ? (
                        <CircleCheck
                          size={20}
                          strokeWidth={1.75}
                          className="text-conforme"
                        />
                      ) : i.atrasado ? (
                        <CircleAlert
                          size={20}
                          strokeWidth={1.75}
                          className="text-nao-conforme"
                        />
                      ) : i.status === "em_andamento" ? (
                        <CircleDashed
                          size={20}
                          strokeWidth={1.75}
                          className="text-info"
                        />
                      ) : (
                        <Circle
                          size={20}
                          strokeWidth={1.75}
                          className="text-texto-3"
                        />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-base ${i.status === "concluido" ? "text-texto-2" : ""}`}
                      >
                        {i.descricao}
                      </p>
                      <p className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-texto-2">
                        <span>{i.responsavel}</span>
                        {i.atrasado && (
                          <span className="text-nao-conforme">
                            Atrasado desde {formatarData(i.prazo)}
                          </span>
                        )}
                        {i.atalho && (
                          <Link
                            href={i.atalho.href}
                            className="text-info hover:underline"
                          >
                            Ir para {i.atalho.rotulo}
                          </Link>
                        )}
                      </p>
                    </div>
                    <StatusDoItem
                      auditoriaId={id}
                      codigo={i.codigo}
                      status={i.status}
                      descricao={i.descricao}
                      desabilitado={!podeEditar}
                    />
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
