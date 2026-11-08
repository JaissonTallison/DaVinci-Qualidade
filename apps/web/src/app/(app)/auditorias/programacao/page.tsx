import { CalendarClock } from "@/components/icones";
import type { Metadata } from "next";
import Link from "next/link";
import {
  FREQUENCIAS_DE_AUDITORIA,
  MESES_ABREVIADOS,
  NORMAS,
  type DadosDoUsuario,
  type ItemDaProgramacao,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { EstadoVazio } from "@/components/estado-vazio";
import { IconeDaTela } from "@/components/icones-do-menu";
import { chamarApi } from "@/lib/api";
import {
  botaoPrimario,
  botaoSecundario,
  painel,
  subtituloDaPagina,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Programação de auditorias" };

const BASE = "/auditorias/programacao";
const AVISOS: Record<string, string> = {
  criado: "Item adicionado à programação.",
  salvo: "Item da programação salvo.",
  excluido: "Item removido da programação.",
};

export default async function ProgramacaoDeAuditorias({
  searchParams,
}: PageProps<"/auditorias/programacao">) {
  const { ano: anoParam, aviso } = (await searchParams) as {
    ano?: string;
    aviso?: string;
  };
  const anoAtual = new Date().getFullYear();
  const ano = Number(anoParam) || anoAtual;
  const anos = [anoAtual - 1, anoAtual, anoAtual + 1];

  const [lista, eu] = await Promise.all([
    chamarApi<ItemDaProgramacao[]>(`/programacao-de-auditorias?ano=${ano}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("auditorias.editar");

  return (
    <>
      <CabecalhoComVoltar
        voltar={{ href: "/auditorias", rotulo: "Auditorias" }}
      >
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className={tituloDaPagina}>Programação de auditorias</h1>
            <p className={subtituloDaPagina}>
              Plano anual por setor: normas, frequência e meses planejados. As
              auditorias realizadas se vinculam a cada item.
            </p>
          </div>
          {podeEditar && (
            <Link href={`${BASE}/nova?ano=${ano}`} className={botaoPrimario}>
              <IconeDaTela href={BASE} />
              Adicionar item
            </Link>
          )}
        </header>
      </CabecalhoComVoltar>

      <nav aria-label="Ano" className="mt-6 flex flex-wrap gap-2">
        {anos.map((a) => (
          <Link
            key={a}
            href={`${BASE}?ano=${a}`}
            aria-current={a === ano ? "page" : undefined}
            className={a === ano ? botaoPrimario : botaoSecundario}
          >
            {a}
          </Link>
        ))}
      </nav>

      {aviso && AVISOS[aviso] && (
        <CaixaDeAlerta tom="sucesso" className="mt-4">
          {AVISOS[aviso]}
        </CaixaDeAlerta>
      )}

      <section className={`${painel} mt-4`}>
        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : lista.dados.length === 0 ? (
          <EstadoVazio
            icone={<CalendarClock aria-hidden size={40} strokeWidth={1.5} />}
            titulo={`Nenhum item planejado para ${ano}.`}
            descricao="Adicione os setores a auditar no ano, com as normas, a frequência e os meses."
            acao={
              podeEditar ? (
                <Link
                  href={`${BASE}/nova?ano=${ano}`}
                  className={botaoPrimario}
                >
                  <IconeDaTela href={BASE} />
                  Adicionar o primeiro item
                </Link>
              ) : undefined
            }
          />
        ) : (
          <table className="w-full text-left">
            <thead className="bg-superficie-2 text-xs uppercase tracking-[0.04em] text-texto-2">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Setor</th>
                <th className="hidden px-4 py-2 font-semibold lg:table-cell">
                  Normas
                </th>
                <th className="px-4 py-2.5 font-semibold">Frequência</th>
                <th className="px-4 py-2.5 font-semibold">Meses</th>
                <th className="hidden px-4 py-2 font-semibold sm:table-cell">
                  Responsável
                </th>
                <th className="px-4 py-2.5 font-semibold">Acompanhamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {lista.dados.map((i) => {
                const realizados = new Set(
                  i.realizadas
                    .map((r) => r.mes)
                    .filter((m): m is number => !!m),
                );
                return (
                  <tr key={i.id} className="hover:bg-superficie-2">
                    <td className="px-4 py-3">
                      <Link
                        href={`${BASE}/${i.id}`}
                        className="font-semibold text-info hover:underline"
                      >
                        {i.setor}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-texto-2 lg:table-cell">
                      {i.normas.map((n) => NORMAS[n]).join(", ")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-texto-2">
                      {FREQUENCIAS_DE_AUDITORIA[i.frequencia]}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {MESES_ABREVIADOS.map((rotulo, idx) => {
                          const mes = idx + 1;
                          const planejado = i.meses.includes(mes);
                          const feito = realizados.has(mes);
                          return (
                            <span
                              key={mes}
                              title={
                                feito
                                  ? "Realizada"
                                  : planejado
                                    ? "Planejada"
                                    : undefined
                              }
                              className={`inline-flex h-6 w-7 items-center justify-center rounded-sm text-xs ${
                                feito
                                  ? "bg-conforme-suave font-semibold text-conforme-texto"
                                  : planejado
                                    ? "border border-marinho/40 text-marinho"
                                    : "text-texto-3"
                              }`}
                            >
                              {rotulo}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 whitespace-nowrap text-texto-2 sm:table-cell">
                      {i.responsavel}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {i.realizadas.length > 0 ? (
                        <span className="text-texto">
                          {i.realizadas.length}{" "}
                          {i.realizadas.length === 1
                            ? "auditoria"
                            : "auditorias"}
                        </span>
                      ) : (
                        <span className="text-texto-3">Nenhuma ainda</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
import { CabecalhoComVoltar } from "@/components/pagina-de-cadastro";
import { CaixaDeAlerta } from "@/components/caixa-de-alerta";
