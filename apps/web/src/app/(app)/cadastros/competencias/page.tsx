import type { Metadata } from "next";
import Link from "next/link";
import {
  pendente,
  type DadosDoUsuario,
  type Funcao,
  type MatrizDaFuncao,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { painel, tituloDaPagina } from "@/lib/estilos";

export const metadata: Metadata = { title: "Competências por função" };

/** Visão geral: cada função, quantas pessoas, quantos requisitos e quantas estão em dia com tudo. */
export default async function Competencias() {
  const [funcoes, eu] = await Promise.all([
    chamarApi<Funcao[]>("/funcoes"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!funcoes.ok) return <AvisoDeErro erro={funcoes.erro} />;
  const veSeguranca =
    eu.ok &&
    eu.dados.recursos.includes("seguranca") &&
    eu.dados.permissoes.includes("seguranca.ver");
  const resumo = await Promise.all(
    funcoes.dados.map(async (f) => {
      const [t, e] = await Promise.all([
        chamarApi<MatrizDaFuncao>(
          `/competencias/funcoes/${f.id}/matriz-treinamentos`,
        ),
        veSeguranca
          ? chamarApi<MatrizDaFuncao>(
              `/competencias/funcoes/${f.id}/matriz-epis`,
            )
          : null,
      ]);
      const epiPor = new Map(
        (e?.ok ? e.dados.linhas : []).map((l) => [
          l.funcionarioId,
          l.situacoes,
        ]),
      );
      const linhas = t.ok ? t.dados.linhas : [];
      const comPendencia = linhas.filter((l) =>
        Object.values({ ...l.situacoes, ...epiPor.get(l.funcionarioId) }).some(
          pendente,
        ),
      ).length;
      return {
        f,
        requisitos:
          (t.ok ? t.dados.requisitos.length : 0) +
          (e?.ok ? e.dados.requisitos.length : 0),
        pessoas: linhas.length,
        comPendencia,
        ok: t.ok,
      };
    }),
  );
  const totalPessoas = resumo.reduce((s, r) => s + r.pessoas, 0);
  const totalPendentes = resumo.reduce((s, r) => s + r.comPendencia, 0);
  return (
    <>
      <h1 className={tituloDaPagina}>Competências por função</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        Cada função define os treinamentos e os EPIs que exige; o ASO em dia
        vale para todas. Aqui está quem atende. Abra a função para definir os
        requisitos e ver a matriz por pessoa.
      </p>
      <section
        className={`${painel} mt-6 flex flex-wrap gap-x-8 gap-y-2 px-5 py-3 text-base`}
        aria-label="Resumo"
      >
        <span>
          <span className="font-semibold tabular-nums">{totalPessoas}</span>{" "}
          funcionários ativos
        </span>
        <span>
          <span
            className={`font-semibold tabular-nums ${totalPendentes ? "text-nao-conforme" : ""}`}
          >
            {totalPendentes}
          </span>{" "}
          com pendência
        </span>
      </section>
      <section className={`${painel} mt-6`}>
        {resumo.length === 0 ? (
          <p className="px-5 py-6 text-base text-texto-2">
            Nenhuma função ativa.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borda text-left text-texto-2">
                <th className="px-4 py-2 font-semibold">Função</th>
                <th className="px-4 py-2 text-right font-semibold">
                  Requisitos
                </th>
                <th className="px-4 py-2 text-right font-semibold">Pessoas</th>
                <th className="px-4 py-2 text-right font-semibold">
                  Com pendência
                </th>
              </tr>
            </thead>
            <tbody>
              {resumo.map((r) => (
                <tr
                  key={r.f.id}
                  className="border-b border-borda last:border-0"
                >
                  <td data-rotulo="Função" className="px-4 py-2.5">
                    <Link
                      href={`/cadastros/setores-e-funcoes/${r.f.id}`}
                      className="text-base text-info hover:underline"
                    >
                      {r.f.nome}
                    </Link>
                  </td>
                  <td
                    data-rotulo="Requisitos"
                    className="px-4 py-2.5 text-right tabular-nums"
                  >
                    {r.requisitos}
                  </td>
                  <td
                    data-rotulo="Pessoas"
                    className="px-4 py-2.5 text-right tabular-nums"
                  >
                    {r.pessoas}
                  </td>
                  <td
                    data-rotulo="Com pendência"
                    className={`px-4 py-2.5 text-right tabular-nums ${r.comPendencia ? "font-semibold text-nao-conforme" : "text-texto-2"}`}
                  >
                    {r.ok ? r.comPendencia : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
