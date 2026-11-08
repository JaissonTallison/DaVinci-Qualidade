import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import type { ItemDaProgramacao } from "@davinci/types";
import { chamarApi } from "@/lib/api";
import { hojeEmBrasilia } from "@/lib/datas";
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
      <CabecalhoDeCadastro
        voltar={{ href: "/auditorias", rotulo: "Auditorias" }}
        titulo="Planejar auditoria"
        descricao="Defina escopo, normas e equipe. As constatações são registradas depois de iniciar a auditoria."
      />
      <FormularioDeAuditoria
        hoje={hojeEmBrasilia()}
        programacao={programacao}
      />
    </>
  );
}
