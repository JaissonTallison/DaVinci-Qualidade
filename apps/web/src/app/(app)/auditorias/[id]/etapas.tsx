import Link from "next/link";
import { ETAPAS_DA_AUDITORIA, type EtapaDaAuditoria } from "@davinci/types";

type Atual = "resumo" | EtapaDaAuditoria;

/**
 * Jornada da auditoria em 5 etapas (Planejar, Auditar, Registrar, Tratar, Entregar), com o resumo antes.
 * Cada etapa leva à tela onde aquele trabalho é feito.
 */
export function EtapasDaAuditoria({ id, atual }: { id: string; atual: Atual }) {
  const destino: Record<Atual, string> = {
    resumo: `/auditorias/${id}`,
    planejar: `/auditorias/${id}/kit`,
    auditar: `/auditorias/${id}/execucao`,
    registrar: `/auditorias/${id}/achados`,
    tratar: `/auditorias/${id}/tratar`,
    entregar: `/auditorias/${id}/relatorio`,
  };
  const item = (chave: Atual, rotulo: string, numero?: number) => {
    const marcado = chave === atual;
    return (
      <Link
        key={chave}
        href={destino[chave]}
        aria-current={marcado ? "page" : undefined}
        className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-sm border px-2.5 text-sm ${marcado ? "border-menu bg-menu font-semibold text-primaria-texto" : "border-borda bg-superficie text-texto-2 hover:border-borda-forte hover:text-texto"}`}
      >
        {numero !== undefined && (
          <span
            aria-hidden
            className={`inline-flex size-5 items-center justify-center rounded-xs text-xs font-semibold tabular-nums ${marcado ? "bg-primaria-texto/20" : "bg-superficie-2"}`}
          >
            {numero}
          </span>
        )}
        {rotulo}
      </Link>
    );
  };
  return (
    <nav
      aria-label="Etapas da auditoria"
      className="mt-4 flex flex-wrap gap-1.5"
    >
      {item("resumo", "Resumo")}
      {(Object.keys(ETAPAS_DA_AUDITORIA) as EtapaDaAuditoria[]).map((e, i) =>
        item(e, ETAPAS_DA_AUDITORIA[e], i + 1),
      )}
    </nav>
  );
}
