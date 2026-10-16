import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type {
  DadosDoUsuario,
  Funcionario,
  OrdemDeServicoSst,
  RequisitoDaFuncao,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { BotaoImprimir } from "@/components/botao-imprimir";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";

export const metadata: Metadata = { title: "Ordem de serviço de segurança" };

/** Ordem de serviço de segurança (NR-1, 1.4.1 c) do funcionário, com os riscos, EPIs e treinamentos da função. */
export default async function OrdemDeServico({
  params,
}: PageProps<"/cadastros/funcionarios/[id]/ordem-de-servico">) {
  const { id } = await params;
  const [r, eu] = await Promise.all([
    chamarApi<Funcionario>(`/funcionarios/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const f = r.dados;
  const [o, epis, treinos] = await Promise.all([
    chamarApi<OrdemDeServicoSst | null>(`/ordens-sst/${f.funcaoId}`),
    chamarApi<RequisitoDaFuncao[]>(`/competencias/funcoes/${f.funcaoId}/epis`),
    chamarApi<RequisitoDaFuncao[]>(
      `/competencias/funcoes/${f.funcaoId}/treinamentos`,
    ),
  ]);
  const ordem = o.ok ? o.dados : null;
  const empresa = eu.ok ? eu.dados.empresa.nome : "";
  return (
    <article className="mx-auto max-w-4xl bg-superficie print:max-w-none">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/cadastros/funcionarios/${id}`}
          className="text-sm text-texto-2 hover:underline"
        >
          Voltar ao funcionário
        </Link>
        <BotaoImprimir />
      </div>
      <header className="border-b-2 border-texto pb-3">
        <p className="text-sm text-texto-2">
          Ordem de serviço de segurança e saúde no trabalho · NR-1, item 1.4.1,
          alínea c
        </p>
        <h1 className="font-bold text-2xl">{f.nome}</h1>
        <p className="text-sm">
          {empresa} · Matrícula {f.matricula} · {f.funcaoNome} · {f.setorNome}
        </p>
      </header>
      {!ordem ? (
        <p className="mt-6 text-base">
          A ordem de serviço desta função ainda não foi preenchida (Cadastros ›
          Setores e funções › Competências).
        </p>
      ) : (
        <>
          <Secao titulo="Atividades">{ordem.atividades}</Secao>
          <section className="mt-5 break-inside-avoid">
            <h2 className="border-b border-borda-forte pb-1 text-lg font-semibold">
              Riscos da função e medidas de prevenção
            </h2>
            {ordem.riscos.length === 0 ? (
              <p className="mt-2 text-sm">
                Nenhum risco do PGR ligado à função.
              </p>
            ) : (
              <ul className="mt-2 text-sm">
                {ordem.riscos.map((x) => (
                  <li key={x.id} className="border-b border-borda py-1">
                    <span className="font-semibold">{x.perigo}</span> ·{" "}
                    {x.danos}
                    {x.controles && (
                      <span className="block text-texto-2">
                        Controles: {x.controles}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
          {epis.ok && epis.dados.length > 0 && (
            <Secao titulo="EPIs de uso obrigatório">
              {epis.dados.map((e) => `${e.nome} (${e.referencia})`).join("; ")}
            </Secao>
          )}
          {treinos.ok && treinos.dados.length > 0 && (
            <Secao titulo="Treinamentos e exames obrigatórios">
              {treinos.dados.map((t) => t.nome).join("; ")}
            </Secao>
          )}
          <Secao titulo="Procedimentos seguros">{ordem.procedimentos}</Secao>
          <Secao titulo="Proibições">{ordem.proibicoes}</Secao>
          {ordem.emergencia && (
            <Secao titulo="Em caso de emergência">{ordem.emergencia}</Secao>
          )}
          <p className="mt-6 text-sm">
            Declaro que recebi esta ordem de serviço, fui informado dos riscos
            da minha função e das medidas de prevenção, e me comprometo a
            cumpri-la. O descumprimento injustificado constitui ato faltoso
            (CLT, art. 158).
          </p>
          <section className="mt-14 grid grid-cols-2 gap-10 text-sm break-inside-avoid">
            <div className="border-t border-texto pt-1 text-center">
              {f.nome}
            </div>
            <div className="border-t border-texto pt-1 text-center">
              Responsável pela empresa
            </div>
          </section>
          <p className="mt-4 text-xs text-texto-2">
            Emitida em {formatarData(hojeEmBrasilia())} · revisada em{" "}
            {formatarData(ordem.revisadaEm.slice(0, 10))}
          </p>
        </>
      )}
    </article>
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
