import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  LATERALIDADES,
  LOCAIS_DO_ACIDENTE,
  TIPOS_ACIDENTE,
  TIPOS_DE_ACIDENTE_ESOCIAL,
  type Acidente,
  type DadosDoUsuario,
  type Funcionario,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { FolhaDeDocumento } from "@/components/folha-de-documento";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";

export const metadata: Metadata = { title: "CAT" };

const h = (x: string) => `${x.slice(0, 2)}:${x.slice(2)}`;

/** Comunicação de acidente de trabalho em folha, com os dados do eSocial (S-2210), para arquivo e assinatura. */
export default async function CatImpressa({
  params,
}: PageProps<"/seguranca/acidentes/[id]/cat">) {
  const { id } = await params;
  const [r, eu] = await Promise.all([
    chamarApi<Acidente>(`/acidentes/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const a = r.dados;
  const empresa = eu.ok ? eu.dados.empresa.nome : undefined;
  const c = a.dadosCat;
  const f = c
    ? await chamarApi<Funcionario>(`/funcionarios/${c.acidentadoId}`)
    : null;
  const p = f?.ok ? f.dados : null;
  return (
    <FolhaDeDocumento
      tipo="Comunicação de acidente de trabalho"
      numero={`${a.numero}${a.catNumero ? ` · CAT ${a.catNumero}` : ""}`}
      titulo={p?.nome ?? a.acidentado ?? "Acidentado"}
      subtitulo={`${TIPOS_ACIDENTE[a.tipo]}${c ? ` · ${TIPOS_DE_ACIDENTE_ESOCIAL[c.tpAcid as 1 | 2 | 3]}` : ""} · ${formatarData(a.data)}${c ? ` às ${h(c.hrAcid)}` : ""}`}
      empresa={empresa}
      emitidoEm={formatarData(hojeEmBrasilia())}
      voltarHref={`/seguranca/acidentes/${id}`}
      voltarRotulo="Voltar ao acidente"
      assinaturas={
        c
          ? [
              { papel: "Emitente pela empresa" },
              { papel: "Acidentado ou representante" },
            ]
          : undefined
      }
    >
      {!c && (
        <p className="mt-6 text-base">
          Complete os dados da CAT para o eSocial no registro do acidente.
        </p>
      )}
      {c && (
        <>
          <Secao titulo="Acidentado">
            <Dado rotulo="CPF">{p?.cpf}</Dado>
            <Dado rotulo="Matrícula">{p?.matricula}</Dado>
            <Dado rotulo="Função">{p?.funcaoNome ?? a.funcao}</Dado>
            <Dado rotulo="Setor">{p?.setorNome ?? a.setor}</Dado>
          </Secao>
          <Secao titulo="Acidente">
            <Dado rotulo="Horas trabalhadas antes">{h(c.hrsTrab)}</Dado>
            <Dado rotulo="Local">
              {LOCAIS_DO_ACIDENTE[c.tpLocal as keyof typeof LOCAIS_DO_ACIDENTE]}
            </Dado>
            <Dado rotulo="Endereço">
              {c.dscLograd}, {c.nrLograd}
              {c.uf && ` · ${c.uf}`}
            </Dado>
            <Dado rotulo="Situação geradora">{c.codSitGeradora}</Dado>
            <Dado rotulo="Parte atingida">
              {c.codParteAting} ·{" "}
              {LATERALIDADES[c.lateralidade as keyof typeof LATERALIDADES]}
            </Dado>
            <Dado rotulo="Agente causador">{c.codAgntCausador}</Dado>
            <Dado rotulo="Óbito">
              {c.indCatObito === "S"
                ? `Sim, ${c.dtObito ? formatarData(c.dtObito) : ""}`
                : "Não"}
            </Dado>
            <Dado rotulo="Comunicado à polícia">
              {c.indComunPolicia === "S" ? "Sim" : "Não"}
            </Dado>
          </Secao>
          <section className="mt-4 text-sm">
            <p className="font-semibold">Descrição</p>
            <p className="mt-1 whitespace-pre-line">{a.descricao}</p>
          </section>
          <Secao titulo="Atestado médico">
            <Dado rotulo="Atendimento">
              {formatarData(c.dtAtendimento)} às {h(c.hrAtendimento)}
            </Dado>
            <Dado rotulo="Internação">
              {c.indInternacao === "S" ? "Sim" : "Não"}
            </Dado>
            <Dado rotulo="Duração do tratamento">{c.durTrat} dia(s)</Dado>
            <Dado rotulo="Natureza da lesão">{c.dscLesao}</Dado>
            <Dado rotulo="CID">{c.codCID}</Dado>
            <Dado rotulo="Médico">
              {c.nmEmit} · {c.nrOC}
              {c.ufOC && `/${c.ufOC}`}
            </Dado>
          </Secao>
        </>
      )}
    </FolhaDeDocumento>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h2 className="border-b border-borda-forte pb-1 text-lg font-semibold">
        {titulo}
      </h2>
      <dl className="mt-2 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
        {children}
      </dl>
    </section>
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
