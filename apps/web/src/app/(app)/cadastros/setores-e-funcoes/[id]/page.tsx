import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  chaveDoRequisito,
  pendente,
  type DadosDoUsuario,
  type Epi,
  type Funcao,
  type MatrizDaFuncao,
  type OrdemDeServicoSst,
  type Risco,
  type SituacaoDoRequisito,
  type Treinamento,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { SituacaoDoRequisitoMarcador } from "@/components/situacao-do-requisito";
import { chamarApi } from "@/lib/api";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import {
  EpisDaFuncao,
  OrdemDeServicoDaFuncao,
  RiscosDaFuncao,
  TreinamentosDaFuncao,
} from "./formularios";

export const metadata: Metadata = { title: "Competências da função" };

const AVISOS = {
  treinamentos: "Treinamentos exigidos salvos.",
  epis: "EPIs exigidos salvos.",
  riscos: "Riscos da função salvos.",
  ordem: "Ordem de serviço de segurança salva.",
};

/** O que a função exige (ASO, treinamentos, EPIs) e a matriz de quem atende. */
export default async function CompetenciasDaFuncao({
  params,
  searchParams,
}: PageProps<"/cadastros/setores-e-funcoes/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [funcoes, eu, matrizT] = await Promise.all([
    chamarApi<Funcao[]>("/funcoes?situacao=todos"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
    chamarApi<MatrizDaFuncao>(
      `/competencias/funcoes/${id}/matriz-treinamentos`,
    ),
  ]);
  if (!funcoes.ok) return <AvisoDeErro erro={funcoes.erro} />;
  const funcao = funcoes.dados.find((f) => f.id === id);
  if (!funcao) notFound();
  if (!matrizT.ok) return <AvisoDeErro erro={matrizT.erro} />;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const veSeguranca =
    eu.ok &&
    eu.dados.recursos.includes("seguranca") &&
    permissoes.includes("seguranca.ver");
  const editaTreinos = permissoes.includes("funcionarios.editar");
  const editaEpis = veSeguranca && permissoes.includes("seguranca.editar");
  const [matrizE, treinos, epis, riscos, riscosDaFuncao, ordem] =
    await Promise.all([
      veSeguranca
        ? chamarApi<MatrizDaFuncao>(`/competencias/funcoes/${id}/matriz-epis`)
        : null,
      editaTreinos ? chamarApi<Treinamento[]>("/treinamentos") : null,
      editaEpis ? chamarApi<Epi[]>("/epis") : null,
      editaEpis ? chamarApi<Risco[]>("/riscos") : null,
      veSeguranca
        ? chamarApi<{ id: string }[]>(`/competencias/funcoes/${id}/riscos`)
        : null,
      veSeguranca
        ? chamarApi<OrdemDeServicoSst | null>(`/ordens-sst/${id}`)
        : null,
    ]);
  const requisitos = [
    ...matrizT.dados.requisitos,
    ...(matrizE?.ok ? matrizE.dados.requisitos : []),
  ];
  const situacoesEpi = new Map(
    (matrizE?.ok ? matrizE.dados.linhas : []).map((l) => [
      l.funcionarioId,
      l.situacoes,
    ]),
  );
  const linhas = matrizT.dados.linhas.map((l) => {
    const situacoes: Record<string, SituacaoDoRequisito> = {
      ...l.situacoes,
      ...situacoesEpi.get(l.funcionarioId),
    };
    return {
      ...l,
      situacoes,
      pendentes: Object.values(situacoes).filter(pendente).length,
    };
  });
  const conformes = linhas.filter((l) => l.pendentes === 0).length;
  const marcadosT = matrizT.dados.requisitos
    .filter((r) => r.tipo === "treinamento")
    .map((r) => r.id);
  const marcadosE = Object.fromEntries(
    (matrizE?.ok ? matrizE.dados.requisitos : []).map((r) => [
      r.id,
      r.riscoId ?? "",
    ]),
  );

  return (
    <article className="max-w-6xl">
      <Link
        href="/cadastros/competencias"
        className="text-sm text-texto-2 hover:underline"
      >
        Competências por função
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>{funcao.nome}</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        O que esta função exige de quem a ocupa e quem está em dia. O ASO vale
        para todas as funções (NR-7); os EPIs podem citar o risco do PGR que os
        justifica.
      </p>
      <Aviso avisos={AVISOS} chave={aviso} />
      {matrizE && !matrizE.ok && <AvisoDeErro erro={matrizE.erro} />}

      <section className={`${painel} mt-6`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5">
          <h2 className={tituloDaSecao}>Matriz de competências</h2>
          <p className="text-base text-texto-2">
            <span className="font-semibold text-texto tabular-nums">
              {conformes}
            </span>{" "}
            de {linhas.length} em dia com tudo
          </p>
        </div>
        {linhas.length === 0 ? (
          <p className="px-5 py-5 text-base text-texto-2">
            Nenhum funcionário ativo nesta função.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto border-t border-borda">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-borda text-left text-texto-2">
                  <th className="sticky left-0 bg-superficie px-4 py-2 font-semibold">
                    Funcionário
                  </th>
                  {requisitos.map((r) => (
                    <th
                      key={chaveDoRequisito(r)}
                      className="px-2 py-2 text-center font-semibold"
                      title={r.motivo ?? r.referencia ?? undefined}
                    >
                      <span className="block max-w-28 truncate">{r.nome}</span>
                    </th>
                  ))}
                  <th className="px-4 py-2 text-right font-semibold">
                    Pendências
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr
                    key={l.funcionarioId}
                    className="border-b border-borda last:border-0"
                  >
                    <td className="sticky left-0 bg-superficie px-4 py-2">
                      <Link
                        href={`/cadastros/funcionarios/${l.funcionarioId}`}
                        className="text-info hover:underline"
                      >
                        {l.nome}
                      </Link>{" "}
                      <span className="font-mono text-xs text-texto-3">
                        {l.matricula}
                      </span>
                    </td>
                    {requisitos.map((r) => {
                      const s = l.situacoes[chaveDoRequisito(r)];
                      return (
                        <td
                          key={chaveDoRequisito(r)}
                          className="px-2 py-2 text-center"
                        >
                          {s && (
                            <SituacaoDoRequisitoMarcador situacao={s} curto />
                          )}
                        </td>
                      );
                    })}
                    <td
                      className={`px-4 py-2 text-right tabular-nums ${l.pendentes ? "font-semibold text-nao-conforme" : "text-texto-2"}`}
                    >
                      {l.pendentes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="flex flex-wrap gap-4 border-t border-borda px-5 py-2.5 text-xs text-texto-2">
          {(["em_dia", "vence_em_breve", "vencido", "ausente"] as const).map(
            (s) => (
              <SituacaoDoRequisitoMarcador key={s} situacao={s} />
            ),
          )}
        </p>
      </section>

      {treinos?.ok && (
        <Recolhido titulo="Treinamentos exigidos">
          <TreinamentosDaFuncao
            funcaoId={id}
            catalogo={treinos.dados}
            marcados={marcadosT}
          />
        </Recolhido>
      )}
      {editaEpis && riscos?.ok && riscosDaFuncao?.ok && (
        <Recolhido
          titulo={`Riscos do PGR da função (${riscosDaFuncao.dados.length})`}
        >
          <RiscosDaFuncao
            funcaoId={id}
            riscos={riscos.dados.map((r) => ({
              id: r.id,
              perigo: r.perigo,
              local: r.local,
              nivel: r.nivel,
            }))}
            marcados={riscosDaFuncao.dados.map((r) => r.id)}
          />
        </Recolhido>
      )}
      {editaEpis && ordem?.ok && (
        <Recolhido
          titulo={
            ordem.dados
              ? "Ordem de serviço de segurança (NR-1)"
              : "Ordem de serviço de segurança (NR-1): não preenchida"
          }
        >
          <OrdemDeServicoDaFuncao funcaoId={id} ordem={ordem.dados} />
        </Recolhido>
      )}
      {epis?.ok && riscos?.ok && (
        <Recolhido titulo="EPIs exigidos (ligados ao PGR)">
          <EpisDaFuncao
            funcaoId={id}
            catalogo={epis.dados}
            riscos={riscos.dados}
            marcados={marcadosE}
          />
        </Recolhido>
      )}
    </article>
  );
}
