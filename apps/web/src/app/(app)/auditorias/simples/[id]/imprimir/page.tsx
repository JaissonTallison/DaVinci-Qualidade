import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { AuditoriaSimples, DadosDoUsuario } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { FolhaDeDocumento } from "@/components/folha-de-documento";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";

export const metadata: Metadata = { title: "Relatório de auditoria interna" };

/** Documento "Relatório de Auditoria Interna": cabeçalho + tabela por setor, para imprimir ou PDF. */
export default async function AuditoriaSimplesImpressao({
  params,
}: PageProps<"/auditorias/simples/[id]/imprimir">) {
  const { id } = await params;
  const [a, eu] = await Promise.all([
    chamarApi<AuditoriaSimples>(`/auditorias-simples/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!a.ok && a.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!a.ok) return <AvisoDeErro erro={a.erro} />;
  const d = a.dados;
  const empresa = eu.ok ? eu.dados.empresa.nome : undefined;

  return (
    <FolhaDeDocumento
      tipo="Relatório de auditoria interna"
      numero={d.numero}
      titulo={d.unidade ?? "Auditoria interna"}
      subtitulo={formatarData(d.data)}
      empresa={empresa}
      emitidoEm={formatarData(hojeEmBrasilia())}
      voltarHref={`/auditorias/simples/${id}`}
      paisagem
      assinaturas={[
        { papel: "Auditores", nome: d.auditores },
        { papel: "Representante da área auditada" },
      ]}
    >
      <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 border-b border-borda pb-4 text-sm sm:grid-cols-3">
        <Dado rotulo="Data">{formatarData(d.data)}</Dado>
        <Dado rotulo="Horário">{d.horario || "—"}</Dado>
        <Dado rotulo="Unidade de Negócios">{d.unidade || "—"}</Dado>
        <Dado rotulo="Setores Envolvidos">{d.setoresEnvolvidos || "—"}</Dado>
        <Dado rotulo="Auditores">{d.auditores || "—"}</Dado>
        <Dado rotulo="Área Foco">{d.areaFoco || "—"}</Dado>
      </dl>

      {d.linhas.length === 0 ? (
        <p className="mt-6 text-sm">Nenhum setor registrado.</p>
      ) : (
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-superficie-2 text-left">
              <Th>Setor</Th>
              <Th>Comentários</Th>
              <Th>Pontos Positivos</Th>
              <Th>Observações</Th>
              <Th>Não Conformidade</Th>
            </tr>
          </thead>
          <tbody>
            {d.linhas.map((l, i) => (
              <tr key={i} className="break-inside-avoid align-top">
                <Td>
                  <span className="font-semibold">{l.setor}</span>
                </Td>
                <Td>{l.comentarios || "—"}</Td>
                <Td>{l.pontosPositivos || "—"}</Td>
                <Td>{l.observacoes || "—"}</Td>
                <Td>{l.naoConformidade || "—"}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </FolhaDeDocumento>
  );
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="border border-borda px-3 py-2 text-left font-semibold">
      {children}
    </th>
  );
}

function Td({ children }: { children: ReactNode }) {
  return (
    <td className="border border-borda px-3 py-2 align-top whitespace-pre-line">
      {children}
    </td>
  );
}
