import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type {
  DadosDoUsuario,
  Funcionario,
  OrdemDeServicoSst,
  RequisitoDaFuncao,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { FolhaDeDocumento } from "@/components/folha-de-documento";
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
    <FolhaDeDocumento
      tipo="Ordem de serviço de SST · NR-1, 1.4.1 c"
      titulo={f.nome}
      subtitulo={`Matrícula ${f.matricula} · ${f.funcaoNome} · ${f.setorNome}`}
      empresa={empresa}
      emitidoEm={formatarData(hojeEmBrasilia())}
      voltarHref={`/cadastros/funcionarios/${id}`}
      voltarRotulo="Voltar ao funcionário"
      assinaturas={
        ordem
          ? [
              { papel: "Funcionário", nome: f.nome },
              { papel: "Responsável pela empresa" },
            ]
          : undefined
      }
    >
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
          <p className="mt-4 text-xs text-texto-2">
            Ordem revisada em {formatarData(ordem.revisadaEm.slice(0, 10))}.
          </p>
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
      <p className="mt-2 text-sm whitespace-pre-line">{children}</p>
    </section>
  );
}
