import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import {
  EVENTOS_SST,
  type DadosDoUsuario,
  type EventoSst,
  type PainelEsocial,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento } from "@/lib/datas";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import {
  ConfiguracaoDoEsocial,
  GerarEvento,
  MarcarEnviado,
} from "./formularios";

export const metadata: Metadata = { title: "eSocial SST" };

const ONDE: Record<EventoSst, (id: string) => string> = {
  "S-2210": (id) => `/seguranca/acidentes/${id}#cat-esocial`,
  "S-2220": () => "/cadastros/funcionarios",
  "S-2240": (id) => `/cadastros/funcionarios/${id}`,
};

/** Os três eventos de SST: o que está pronto, o que falta e o que já foi gerado e enviado. */
export default async function Esocial({
  searchParams,
}: PageProps<"/seguranca/esocial">) {
  const { aviso, evento } = (await searchParams) as {
    aviso?: string;
    evento?: string;
  };
  const [r, eu] = await Promise.all([
    chamarApi<PainelEsocial>("/esocial"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const p = r.dados;
  const podeEditar = eu.ok && eu.dados.permissoes.includes("seguranca.editar");
  const filtro = (
    evento && evento in EVENTOS_SST ? evento : "S-2210"
  ) as EventoSst;
  const candidatos = p.candidatos.filter((c) => c.evento === filtro);
  const prontos = (e: EventoSst) =>
    p.candidatos.filter(
      (c) => c.evento === e && !c.pendencias.length && !c.geradoId,
    ).length;
  return (
    <>
      <h1 className={tituloDaPagina}>eSocial SST</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        Os eventos S-2210, S-2220 e S-2240 montados no leiaute oficial a partir
        dos acidentes, ASOs, riscos do PGR e EPIs da função. O sistema gera o
        XML e aponta o que falta; a assinatura com o certificado digital e o
        envio são feitos pelo transmissor da empresa, e o recibo volta para cá.
      </p>
      <Aviso avisos={{ configurado: "Configuração salva." }} chave={aviso} />
      {podeEditar && (
        <Recolhido
          titulo={
            p.configurado
              ? "Configuração do eSocial"
              : "Configurar o eSocial (obrigatório antes de gerar)"
          }
        >
          <ConfiguracaoDoEsocial c={p.configuracao} />
        </Recolhido>
      )}
      {p.configurado && (
        <>
          <nav
            aria-label="Eventos"
            className="mt-6 flex flex-wrap gap-2 border-b border-borda"
          >
            {(Object.keys(EVENTOS_SST) as EventoSst[]).map((e) => (
              <Link
                key={e}
                href={`?evento=${e}`}
                aria-current={filtro === e ? "page" : undefined}
                className={`-mb-px border-b-2 px-3 pb-2.5 text-base ${filtro === e ? "border-menu font-semibold text-texto" : "border-transparent text-texto-2 hover:text-texto"}`}
              >
                {EVENTOS_SST[e]}
                {prontos(e) > 0 && (
                  <span className="ml-1.5 text-sm text-info tabular-nums">
                    {prontos(e)} pronto(s)
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <section className={`${painel} mt-4`}>
            {candidatos.length === 0 ? (
              <p className="px-5 py-6 text-base text-texto-2">
                Nada a informar neste evento.
              </p>
            ) : (
              <ul className="divide-y divide-borda">
                {candidatos.map((c) => (
                  <li
                    key={c.referenciaId}
                    className="grid gap-2 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div>
                      <p className="text-base">
                        {c.funcionarioNome ?? "—"}{" "}
                        <span className="text-sm text-texto-2">
                          · {c.descricao} · {formatarData(c.data)}
                        </span>
                      </p>
                      {c.pendencias.length > 0 ? (
                        <ul className="mt-1 text-sm text-nao-conforme">
                          {c.pendencias.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                          <li>
                            <Link
                              href={ONDE[c.evento](c.referenciaId)}
                              className="text-info hover:underline"
                            >
                              Completar
                            </Link>
                          </li>
                        </ul>
                      ) : (
                        <p className="text-sm text-conforme">
                          {c.geradoId
                            ? "Gerado (pode gerar de novo se mudou)"
                            : "Pronto para gerar"}
                        </p>
                      )}
                    </div>
                    {podeEditar && c.pendencias.length === 0 && (
                      <GerarEvento
                        evento={c.evento}
                        referenciaId={c.referenciaId}
                        rotulo={c.geradoId ? "Gerar de novo" : "Gerar XML"}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      <section className={`${painel} mt-6`}>
        <h2 className={`${tituloDaSecao} px-5 pt-5`}>Eventos gerados</h2>
        {p.eventos.length === 0 ? (
          <p className="px-5 py-5 text-base text-texto-2">
            Nenhum evento gerado.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-borda border-t border-borda">
            {p.eventos.map((e) => (
              <li
                key={e.id}
                className="grid gap-2 px-5 py-2.5 text-sm sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center"
              >
                <span className="font-mono">{e.evento}</span>
                <span>
                  {e.funcionarioNome} · {e.descricao}
                  <span className="block text-texto-2">
                    Gerado em {formatarMomento(e.geradoEm)}
                    {e.recibo && ` · enviado, recibo ${e.recibo}`}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-3">
                  <a
                    href={`/esocial/${e.id}`}
                    className="inline-flex items-center gap-1 text-info hover:underline"
                  >
                    <Download aria-hidden size={14} />
                    XML
                  </a>
                  {podeEditar && !e.recibo && <MarcarEnviado id={e.id} />}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
