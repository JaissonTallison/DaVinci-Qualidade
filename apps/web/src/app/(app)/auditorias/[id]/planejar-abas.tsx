import Link from "next/link";

/** Dentro da etapa Planejar: o kit pré-auditoria, o plano enviado ao auditado e o roteiro de entrevista. */
export function AbasDoPlanejar({
  id,
  atual,
}: {
  id: string;
  atual: "kit" | "plano" | "roteiro";
}) {
  const aba = (
    chave: "kit" | "plano" | "roteiro",
    rotulo: string,
    href: string,
  ) => (
    <Link
      href={href}
      aria-current={atual === chave ? "page" : undefined}
      className={`-mb-px border-b-2 px-3 pb-2.5 text-base ${atual === chave ? "border-menu font-semibold text-texto" : "border-transparent text-texto-2 hover:text-texto"}`}
    >
      {rotulo}
    </Link>
  );
  return (
    <nav
      aria-label="Planejar"
      className="mt-6 flex gap-2 border-b border-borda"
    >
      {aba("kit", "Kit pré-auditoria", `/auditorias/${id}/kit`)}
      {aba("plano", "Plano de auditoria", `/auditorias/${id}/plano`)}
      {aba("roteiro", "Roteiro de entrevista", `/auditorias/${id}/roteiro`)}
    </nav>
  );
}
