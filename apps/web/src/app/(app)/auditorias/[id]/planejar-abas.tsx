import Link from "next/link";
import { aba as estiloDaAba, trilho } from "@/lib/estilos";

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
      className={estiloDaAba(atual === chave)}
    >
      {rotulo}
    </Link>
  );
  return (
    <nav aria-label="Planejar" className={`mt-6 ${trilho}`}>
      {aba("kit", "Kit pré-auditoria", `/auditorias/${id}/kit`)}
      {aba("plano", "Plano de auditoria", `/auditorias/${id}/plano`)}
      {aba("roteiro", "Roteiro de entrevista", `/auditorias/${id}/roteiro`)}
    </nav>
  );
}
