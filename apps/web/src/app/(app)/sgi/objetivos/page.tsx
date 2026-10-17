import type { Metadata } from "next";
import {
  SENTIDOS_META,
  type DadosDoUsuario,
  type Objetivo,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { hojeEmBrasilia } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { LancarMedicao, NovoObjetivo, SituacaoDoObjetivo } from "./acoes";

export const metadata: Metadata = { title: "Objetivos da qualidade" };

const AVISOS: Record<string, string> = {
  criado: "Objetivo cadastrado.",
  medicao: "Medição lançada.",
  inativado: "Objetivo inativado.",
  reativado: "Objetivo reativado.",
};
const num = (v: number) =>
  v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const mesBr = (c: string) => `${c.slice(5, 7)}/${c.slice(0, 4)}`;

export default async function Objetivos({
  searchParams,
}: PageProps<"/sgi/objetivos">) {
  const { aviso } = (await searchParams) as { aviso?: string };
  const [lista, eu] = await Promise.all([
    chamarApi<Objetivo[]>("/objetivos"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const podeEditar = permissoes.includes("sgi.editar");
  const mes = hojeEmBrasilia().slice(0, 7);
  return (
    <>
      <h1 className={tituloDaPagina}>Objetivos da qualidade</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Cada objetivo com indicador e meta, medido mês a mês (ISO 9001, 6.2).
      </p>
      <Aviso avisos={AVISOS} chave={aviso} />
      {podeEditar && (
        <Recolhido titulo="Cadastrar objetivo">
          <NovoObjetivo />
        </Recolhido>
      )}
      {!lista.ok ? (
        <div className="mt-6">
          <AvisoDeErro erro={lista.erro} />
        </div>
      ) : lista.dados.length === 0 ? (
        <p className="mt-6 text-base text-texto-2">
          Nenhum objetivo cadastrado.
        </p>
      ) : (
        lista.dados.map((o) => {
          const ultima = o.medicoes[0];
          return (
            <section
              key={o.id}
              className={`${painel} mt-6 p-5 ${o.ativo ? "" : "text-texto-3"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg text-texto">{o.nome}</h2>
                  <p className="text-sm text-texto-2">
                    {o.indicador} · meta {num(o.meta)} {o.unidade} (
                    {SENTIDOS_META[o.sentido].toLowerCase()}) · {o.responsavel}
                    {o.ativo ? "" : " · Inativo"}
                  </p>
                </div>
                <p
                  className={`text-base ${!ultima ? "text-atencao" : ultima.atingiu ? "text-conforme" : "text-nao-conforme"}`}
                >
                  {!ultima
                    ? "Sem medição"
                    : `${mesBr(ultima.competencia)}: ${num(ultima.valor)} ${o.unidade} · ${ultima.atingiu ? "atingiu" : "fora da meta"}`}
                </p>
              </div>
              {o.medicoes.length > 0 && (
                <div className="relative mt-3 overflow-x-auto">
                  <table className="text-left text-sm">
                    <tbody>
                      <tr>
                        {o.medicoes
                          .slice(0, 12)
                          .reverse()
                          .map((m) => (
                            <td
                              key={m.competencia}
                              className="border border-borda px-3 py-1.5 text-center whitespace-nowrap"
                            >
                              <span className="block text-xs text-texto-3">
                                {mesBr(m.competencia)}
                              </span>
                              <span
                                className={
                                  m.atingiu
                                    ? "text-texto"
                                    : "font-semibold text-nao-conforme"
                                }
                              >
                                {num(m.valor)}
                              </span>
                            </td>
                          ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              {ultima?.analise && (
                <p className="mt-2 text-sm text-texto-2">
                  Análise de {mesBr(ultima.competencia)}: {ultima.analise}
                </p>
              )}
              {podeEditar && o.ativo && (
                <div className="mt-4">
                  <LancarMedicao objetivo={o} mes={mes} />
                </div>
              )}
              {permissoes.includes("sgi.excluir") && (
                <details className="mt-3">
                  <summary className="cursor-pointer dv-voltar">
                    {o.ativo ? "Inativar" : "Reativar"}
                  </summary>
                  <SituacaoDoObjetivo objetivo={o} />
                </details>
              )}
            </section>
          );
        })
      )}
    </>
  );
}
