import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type DadosDoUsuario, type ProcessoComRevisoes } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { EditorDeDiagrama } from "./editor";

export const metadata: Metadata = { title: "Diagrama do processo" };

export default async function DiagramaDoProcesso({
  params,
}: PageProps<"/qualidade/processos/[id]/diagrama">) {
  const { id } = await params;
  const [r, eu] = await Promise.all([
    chamarApi<ProcessoComRevisoes>(`/processos/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const p = r.dados;
  const editavel = p.status === "em_elaboracao" || p.status === "em_revisao";
  const podeEditar =
    eu.ok && eu.dados.permissoes.includes("qualidade.editar") && editavel;
  return (
    <EditorDeDiagrama
      processoId={p.id}
      codigo={p.codigo}
      nome={p.nome}
      versaoInicial={p.versao}
      conteudoInicial={p.conteudo}
      podeEditar={podeEditar}
      voltarHref={`/qualidade/processos/${p.id}`}
    />
  );
}
