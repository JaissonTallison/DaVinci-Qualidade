import Link from "next/link";
import {
  NORMAS,
  TIPOS_AUDITORIA,
  type Auditoria,
  type EtapaDaAuditoria,
} from "@davinci/types";
import { StatusDaAuditoria } from "@/components/marcadores";
import { tituloDaPagina } from "@/lib/estilos";
import { EtapasDaAuditoria } from "./etapas";

/** Cabeçalho comum das telas da jornada: número, status, título e a barra das etapas. */
export function CabecalhoDaAuditoria({
  auditoria: a,
  etapa,
}: {
  auditoria: Auditoria;
  etapa: "resumo" | EtapaDaAuditoria;
}) {
  return (
    <>
      <Link href="/auditorias" className="text-sm text-texto-2 hover:underline">
        Auditorias
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-lg text-texto-2">{a.numero}</span>
        <StatusDaAuditoria status={a.status} />
        {a.plano.empresaAuditada && (
          <span className="text-texto-2">{a.plano.empresaAuditada}</span>
        )}
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>
        Auditoria {TIPOS_AUDITORIA[a.tipo].toLowerCase()} ·{" "}
        {a.normas.map((n) => NORMAS[n]).join(", ")}
      </h1>
      <EtapasDaAuditoria id={a.id} atual={etapa} />
    </>
  );
}
