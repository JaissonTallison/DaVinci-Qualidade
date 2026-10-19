import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  PAPEIS_NA_BRIGADA,
  type Brigadista,
  type DadosDoUsuario,
  type PlanoDeEmergencia,
} from "@davinci/types";
import { FolhaDeDocumento } from "@/components/folha-de-documento";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";

export const metadata: Metadata = { title: "Plano de emergência" };

/** Plano de emergência em folha, com a brigada e os contatos, para afixar e distribuir. */
export default async function PlanoImpresso() {
  const [plano, brigada, eu] = await Promise.all([
    chamarApi<PlanoDeEmergencia | null>("/plano-de-emergencia"),
    chamarApi<Brigadista[]>("/brigada"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const p = plano.ok ? plano.dados : null;
  return (
    <FolhaDeDocumento
      tipo="Plano de emergência"
      titulo={eu.ok ? eu.dados.empresa.nome : "Plano de emergência"}
      subtitulo={
        p ? `Revisado em ${formatarData(p.revisadoEm.slice(0, 10))}` : undefined
      }
      emitidoEm={formatarData(hojeEmBrasilia())}
      voltarHref="/seguranca/emergencia"
    >
      {!p ? (
        <p className="mt-6 text-base">Plano ainda não preenchido.</p>
      ) : (
        <>
          <Secao titulo="Cenários">{p.cenarios}</Secao>
          {p.alarme && <Secao titulo="Alarme e comunicação">{p.alarme}</Secao>}
          <Secao titulo="Rotas de fuga">{p.rotasDeFuga}</Secao>
          <Secao titulo="Ponto de encontro">{p.pontoDeEncontro}</Secao>
          <Secao titulo="Procedimentos">{p.procedimentos}</Secao>
          <section className="mt-5 break-inside-avoid">
            <h2 className="border-b border-borda-forte pb-1 text-lg font-semibold">
              Contatos de emergência
            </h2>
            <ul className="mt-2 grid grid-cols-2 gap-x-8 text-base">
              {p.contatos.map((c, i) => (
                <li key={i} className="border-b border-borda py-1">
                  {c.nome}:{" "}
                  <span className="font-semibold tabular-nums">
                    {c.telefone}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      {brigada.ok && brigada.dados.length > 0 && (
        <section className="mt-5 break-inside-avoid">
          <h2 className="border-b border-borda-forte pb-1 text-lg font-semibold">
            Brigada de emergência
          </h2>
          <ul className="mt-2 text-sm">
            {brigada.dados.map((b) => (
              <li key={b.id} className="border-b border-borda py-1">
                {b.nome} · {PAPEIS_NA_BRIGADA[b.papel]} · {b.setor}
                {b.turno && ` · ${b.turno}`}
              </li>
            ))}
          </ul>
        </section>
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
      <p className="mt-2 text-sm whitespace-pre-line">{children}</p>
    </section>
  );
}
