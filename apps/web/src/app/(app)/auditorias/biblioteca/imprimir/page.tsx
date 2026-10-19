import type { Metadata } from "next";
import {
  NORMAS,
  type DadosDoUsuario,
  type EvidenciaDaBiblioteca,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { FolhaDeDocumento } from "@/components/folha-de-documento";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";
import { filtrosDaBiblioteca } from "../filtros";
import { ListaDeEvidencias } from "../lista";

export const metadata: Metadata = { title: "Evidências para imprimir" };

/** Lista filtrada da biblioteca, aberta, para levar impressa a campo. */
export default async function ImprimirBiblioteca({
  searchParams,
}: PageProps<"/auditorias/biblioteca/imprimir">) {
  const f = (await searchParams) as Record<string, string | undefined>;
  const filtro = filtrosDaBiblioteca(f);
  const [r, eu] = await Promise.all([
    chamarApi<EvidenciaDaBiblioteca[]>(`/evidencias-de-auditoria?${filtro}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const empresa = eu.ok ? eu.dados.empresa.nome : undefined;
  return (
    <FolhaDeDocumento
      tipo="Biblioteca de evidências"
      titulo="Evidências objetivas por cláusula"
      subtitulo={`${f.norma ? NORMAS[f.norma as keyof typeof NORMAS] : "Todas as normas"}${f.clausula ? ` · cláusula ${f.clausula}` : ""}${f.busca ? ` · "${f.busca}"` : ""} · ${r.dados.length} evidências`}
      empresa={empresa}
      emitidoEm={formatarData(hojeEmBrasilia())}
      voltarHref={`/auditorias/biblioteca?${filtro}`}
      voltarRotulo="Voltar à biblioteca"
    >
      <ListaDeEvidencias evidencias={r.dados} impressao />
    </FolhaDeDocumento>
  );
}
