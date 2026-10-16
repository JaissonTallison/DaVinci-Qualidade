import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import {
  METODOLOGIA_PADRAO,
  criteriosSugeridos,
  type Auditoria,
  type DadosDoUsuario,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { botaoSecundario, painel } from "@/lib/estilos";
import { CabecalhoDaAuditoria } from "../cabecalho";
import { AbasDoPlanejar } from "../planejar-abas";
import { FormularioDoPlano } from "./formulario";

export const metadata: Metadata = { title: "Plano de auditoria" };

/** Etapa Planejar: o plano que vai ao auditado (ISO 19011, 6.3.2), com versão para imprimir e assinar. */
export default async function Plano({
  params,
  searchParams,
}: PageProps<"/auditorias/[id]/plano">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [a, eu] = await Promise.all([
    chamarApi<Auditoria>(`/auditorias/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!a.ok && a.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!a.ok) return <AvisoDeErro erro={a.erro} />;
  const aud = a.dados;
  const aberta = aud.status === "planejada" || aud.status === "em_andamento";
  const podeEditar =
    eu.ok && eu.dados.permissoes.includes("auditorias.editar") && aberta;
  return (
    <article className="max-w-6xl">
      <CabecalhoDaAuditoria auditoria={aud} etapa="planejar" />
      <AbasDoPlanejar id={id} atual="plano" />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[72ch] text-base text-texto-2">
          Envie ao auditado com antecedência: o que será auditado, quando, com
          quem e o que preparar.
        </p>
        <Link
          href={`/auditorias/${id}/plano/imprimir`}
          className={botaoSecundario}
        >
          <Printer aria-hidden size={16} strokeWidth={2} />
          Plano para imprimir
        </Link>
      </div>
      {aviso === "salvo" && (
        <p
          role="status"
          className="mt-4 rounded-sm border border-borda bg-superficie px-4 py-2.5 text-base"
        >
          Plano salvo.
        </p>
      )}
      {podeEditar ? (
        <section className={`${painel} mt-4 p-5`}>
          <FormularioDoPlano
            auditoria={aud}
            criteriosPadrao={criteriosSugeridos(aud.normas)}
            metodologiaPadrao={METODOLOGIA_PADRAO}
          />
        </section>
      ) : (
        <p className={`${painel} mt-4 px-5 py-4 text-base text-texto-2`}>
          {aberta
            ? "Você pode consultar o plano na versão para imprimir."
            : "Auditoria encerrada: o plano não muda mais. Consulte a versão para imprimir."}
        </p>
      )}
    </article>
  );
}
