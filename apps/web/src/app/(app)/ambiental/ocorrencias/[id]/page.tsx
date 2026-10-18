import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  MEIOS_AFETADOS,
  SEVERIDADES_AMBIENTAIS,
  TIPOS_DE_OCORRENCIA,
  type DadosDoUsuario,
  type OcorrenciaAmbiental,
} from "@davinci/types";
import { Anexos } from "@/components/anexos";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import {
  ComunicarOcorrencia,
  EncerrarOcorrencia,
  NcDaOcorrencia,
} from "../formularios";

export const metadata: Metadata = { title: "Ocorrência ambiental" };
const AVISOS = {
  registrada: "Ocorrência registrada.",
  comunicada: "Comunicação registrada.",
  nc: "NC aberta na Qualidade.",
  encerrada: "Ocorrência encerrada.",
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
};

export default async function DetalheDaOcorrencia({
  params,
  searchParams,
}: PageProps<"/ambiental/ocorrencias/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<OcorrenciaAmbiental>(`/ocorrencias-ambientais/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const o = r.dados;
  const podeEditar = eu.ok && eu.dados.permissoes.includes("ambiental.editar");
  const aberta = o.status === "aberta";
  return (
    <article>
      <Link
        href="/ambiental/ocorrencias"
        className="dv-voltar"
      >
        Ocorrências ambientais
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4">
        <span className="font-mono text-lg text-texto-2">{o.numero}</span>
        <span>{aberta ? "Aberta" : "Encerrada"}</span>
        {o.comunicacaoAtrasada && (
          <span className="font-semibold text-nao-conforme">
            Comunicação fora do prazo
          </span>
        )}
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>
        {TIPOS_DE_OCORRENCIA[o.tipo]}: {o.substancia}
      </h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      <section
        className={`${painel} mt-6 grid gap-x-8 gap-y-4 p-5 sm:grid-cols-4`}
      >
        <Dado rotulo="Quando">
          {formatarData(o.data)} às {o.hora}
        </Dado>
        <Dado rotulo="Local">{o.local}</Dado>
        <Dado rotulo="Severidade">{SEVERIDADES_AMBIENTAIS[o.severidade]}</Dado>
        <Dado rotulo="Quantidade">
          {o.quantidade !== null
            ? `${o.quantidade.toLocaleString("pt-BR")} ${o.unidade ?? ""}`
            : "—"}
        </Dado>
        <Dado rotulo="Atingido">
          {o.meios.map((m) => MEIOS_AFETADOS[m]).join(", ")}
        </Dado>
        <Dado rotulo="Comunicação">
          {o.comunicacao
            ? `${o.comunicacao.orgao} · ${formatarData(o.comunicacao.data)} · ${o.comunicacao.protocolo}`
            : o.comunicacaoObrigatoria
              ? `Obrigatória até ${formatarData(o.prazoComunicacao!)}`
              : "Não obrigatória"}
        </Dado>
        {o.ncId && (
          <Dado rotulo="Não conformidade">
            <Link
              href={`/qualidade/nao-conformidades/${o.ncId}`}
              className="font-mono text-info hover:underline"
            >
              {o.ncNumero}
            </Link>
          </Dado>
        )}
        <Dado rotulo="O que aconteceu" largo>
          {o.descricao}
        </Dado>
        <Dado rotulo="Contenção" largo>
          {o.contencao}
        </Dado>
        {o.causas && (
          <Dado rotulo="Causas" largo>
            {o.causas}
          </Dado>
        )}
        {o.acoes && (
          <Dado rotulo="Ações" largo>
            {o.acoes}
          </Dado>
        )}
        {o.remediacao && (
          <Dado rotulo="Remediação" largo>
            {o.remediacao}
          </Dado>
        )}
      </section>
      {podeEditar && aberta && !o.comunicacao && (
        <ComunicarOcorrencia o={o} hoje={hojeEmBrasilia()} />
      )}
      {podeEditar && aberta && !o.ncId && <NcDaOcorrencia o={o} />}
      {podeEditar && aberta && <EncerrarOcorrencia o={o} />}
      <Anexos
        registro="ocorrencia_ambiental"
        registroId={o.id}
        voltar={`/ambiental/ocorrencias/${o.id}`}
        podeEditar={podeEditar}
      />
    </article>
  );
}

function Dado({
  rotulo,
  children,
  largo = false,
}: {
  rotulo: string;
  children: ReactNode;
  largo?: boolean;
}) {
  return (
    <div className={largo ? "sm:col-span-4" : ""}>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd className="mt-0.5 text-base whitespace-pre-line">{children}</dd>
    </div>
  );
}
