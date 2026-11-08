import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { DadosDoUsuario, Funcao } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { FolhaDeDocumento } from "@/components/folha-de-documento";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";

export const metadata: Metadata = { title: "Descrição de cargo" };

/** Descrição de cargo (ISO 9001 7.1.2 e 7.2) para imprimir e assinar. */
export default async function DescricaoDeCargoImpressao({
  params,
}: PageProps<"/cadastros/setores-e-funcoes/[id]/descricao">) {
  const { id } = await params;
  const [funcoes, eu] = await Promise.all([
    chamarApi<Funcao[]>("/funcoes?situacao=todos"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!funcoes.ok) return <AvisoDeErro erro={funcoes.erro} />;
  const f = funcoes.dados.find((x) => x.id === id);
  if (!f) notFound();
  const empresa = eu.ok ? eu.dados.empresa.nome : undefined;
  return (
    <FolhaDeDocumento
      tipo="Descrição de cargo"
      titulo={f.nome}
      subtitulo={f.cbo ? `CBO ${f.cbo}` : undefined}
      empresa={empresa}
      emitidoEm={formatarData(hojeEmBrasilia())}
      voltarHref={`/cadastros/setores-e-funcoes/${id}`}
      assinaturas={[
        { papel: "Elaboração (RH / Qualidade)" },
        { papel: "Aprovação (Gestão)" },
      ]}
    >
      <div className="flex flex-col gap-6">
        <Secao titulo="Formação desejada">
          <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-3">
            <Dado rotulo="Escolaridade" valor={f.escolaridade} />
            <Dado rotulo="Experiência" valor={f.experiencia} />
            <Dado rotulo="Outros requisitos" valor={f.outrosRequisitos} />
          </dl>
        </Secao>
        <Secao titulo="Conhecimentos e competências necessárias">
          <Lista itens={f.competencias} />
        </Secao>
        <Secao titulo="Relação de atribuições">
          <Lista itens={f.atribuicoes} />
        </Secao>
        <Secao titulo="Educação e treinamentos continuados">
          <Lista itens={f.treinamentosContinuados} />
        </Secao>
      </div>
    </FolhaDeDocumento>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 border-b border-borda pb-1 text-sm font-semibold tracking-[0.04em] text-texto-2 uppercase">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd className="text-base">{valor || "—"}</dd>
    </div>
  );
}

function Lista({ itens }: { itens: string[] }) {
  if (itens.length === 0)
    return <p className="text-base text-texto-2">Não informado.</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-base">
      {itens.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
