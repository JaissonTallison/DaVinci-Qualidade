import type { Metadata } from "next";
import Link from "next/link";
import type { ItemDaProgramacao } from "@davinci/types";
import { chamarApi } from "@/lib/api";
import { hojeEmBrasilia } from "@/lib/datas";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeAuditoria } from "../formulario";

export const metadata: Metadata = { title: "Planejar auditoria" };

export default async function NovaAuditoria() {
  const ano = new Date().getFullYear();
  const prog = await chamarApi<ItemDaProgramacao[]>(
    `/programacao-de-auditorias?ano=${ano}`,
  );
  const programacao = prog.ok
    ? prog.dados.map((p) => ({ id: p.id, setor: p.setor }))
    : [];
  return (
    <>
      <Link href="/auditorias" className="dv-voltar">
        Auditorias
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Planejar auditoria</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Defina escopo, normas e equipe. As constatações são registradas depois
        de iniciar a auditoria.
      </p>
      <FormularioDeAuditoria hoje={hojeEmBrasilia()} programacao={programacao} />
    </>
  );
}
