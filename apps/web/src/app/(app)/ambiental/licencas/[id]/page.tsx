import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  TIPOS_LICENCA,
  type DadosDoUsuario,
  type Licenca,
} from "@davinci/types";
import { Anexos } from "@/components/anexos";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SituacaoDaLicenca } from "@/components/marcadores-ambientais";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import {
  CumprirCondicionante,
  NovaCondicionante,
  SolicitarRenovacao,
} from "./acoes";

export const metadata: Metadata = { title: "Licença" };
const AVISOS: Record<string, string> = {
  criada: "Licença cadastrada. Adicione as condicionantes que constam nela.",
  renovacao: "Protocolo de renovação registrado.",
  condicionante: "Condicionante adicionada.",
  cumprida:
    "Condicionante cumprida. Se for periódica, a próxima já está na lista.",
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
};

export default async function DetalheDaLicenca({
  params,
  searchParams,
}: PageProps<"/ambiental/licencas/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Licenca>(`/licencas/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const l = r.dados;
  const podeEditar = eu.ok && eu.dados.permissoes.includes("ambiental.editar");
  const pendentes = l.condicionantes.filter((c) => !c.cumpridaEm);
  const cumpridas = l.condicionantes.filter((c) => c.cumpridaEm);
  return (
    <article>
      <Link
        href="/ambiental/licencas"
        className="text-sm text-texto-2 hover:underline"
      >
        Licenças
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4">
        <span className="text-texto-2">{l.orgao}</span>
        <SituacaoDaLicenca situacao={l.situacao} />
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>
        {TIPOS_LICENCA[l.tipo]} nº {l.numero}
      </h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          {l.descricao && (
            <Dado rotulo="O que autoriza" largo>
              {l.descricao}
            </Dado>
          )}
          <Dado rotulo="Emissão">{formatarData(l.emissao)}</Dado>
          <Dado rotulo="Validade">
            <span
              className={l.situacao === "vencida" ? "text-nao-conforme" : ""}
            >
              {formatarData(l.validade)}
            </span>
          </Dado>
          <Dado rotulo="Pedir renovação até">
            <span className={l.situacao === "renovar" ? "text-atencao" : ""}>
              {formatarData(l.renovarAte)} ({l.diasParaRenovar} dias antes)
            </span>
          </Dado>
          {l.renovacaoProtocolo && l.renovacaoData && (
            <Dado rotulo="Renovação protocolada">
              {l.renovacaoProtocolo} em {formatarData(l.renovacaoData)}
            </Dado>
          )}
        </dl>
      </section>
      {podeEditar &&
        !l.renovacaoProtocolo &&
        (l.situacao === "renovar" || l.situacao === "vencida") && (
          <SolicitarRenovacao licenca={l} />
        )}
      <section className={`${painel} mt-6`}>
        <h2 className={`${tituloDaSecao} px-5 pt-5`}>Condicionantes</h2>
        {pendentes.length === 0 ? (
          <p className="px-5 pt-2 pb-5 text-base text-texto-2">
            {l.condicionantes.length
              ? "Todas cumpridas."
              : "Nenhuma condicionante cadastrada."}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-borda border-t border-borda">
            {pendentes.map((c) => (
              <li key={c.id} className="px-5 py-3">
                <p className="text-base">{c.descricao}</p>
                <p
                  className={`text-sm ${c.vencida ? "text-nao-conforme" : "text-texto-2"}`}
                >
                  {c.prazo
                    ? `Prazo ${formatarData(c.prazo)}${c.vencida ? " · vencida" : ""}`
                    : "Sem prazo"}
                  {c.periodicidadeMeses &&
                    ` · a cada ${c.periodicidadeMeses} ${c.periodicidadeMeses === 1 ? "mês" : "meses"}`}
                </p>
                {podeEditar && (
                  <CumprirCondicionante licencaId={l.id} condicionante={c} />
                )}
              </li>
            ))}
          </ul>
        )}
        {cumpridas.length > 0 && (
          <details className="border-t border-borda px-5 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-texto-2">
              Cumpridas ({cumpridas.length})
            </summary>
            <ul className="mt-2 divide-y divide-borda text-sm">
              {cumpridas.map((c) => (
                <li key={c.id} className="py-1.5 text-texto-2">
                  {formatarData(c.cumpridaEm!)} · {c.descricao} · {c.evidencia}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
      {podeEditar && <NovaCondicionante licencaId={l.id} />}
      <Anexos
        registro="licenca"
        registroId={l.id}
        voltar={`/ambiental/licencas/${l.id}`}
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
    <div className={largo ? "sm:col-span-3" : ""}>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd className="mt-0.5 text-base whitespace-pre-line">{children}</dd>
    </div>
  );
}
