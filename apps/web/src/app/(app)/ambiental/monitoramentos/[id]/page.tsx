import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import {
  TIPOS_MONITORAMENTO,
  type DadosDoUsuario,
  type Monitoramento,
} from "@davinci/types";
import { Anexos } from "@/components/anexos";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { Linha } from "@/components/graficos";
import { atualizarMonitoramento } from "@/lib/acoes-ambiental";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import { FormularioDeMonitoramento } from "../formulario";
import { textoDoLimite } from "../limites";
import { RegistrarResultado, SituacaoDoMonitoramento } from "./acoes";

export const metadata: Metadata = { title: "Monitoramento" };
const AVISOS: Record<string, string> = {
  criado: "Monitoramento cadastrado. Registre a primeira coleta.",
  salvo: "Alterações salvas.",
  resultado: "Resultado registrado.",
  inativado: "Monitoramento inativado: sai dos prazos de coleta.",
  reativado: "Monitoramento reativado.",
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
};

export default async function DetalheDoMonitoramento({
  params,
  searchParams,
}: PageProps<"/ambiental/monitoramentos/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Monitoramento>(`/monitoramentos/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const m = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const podeEditar = permissoes.includes("ambiental.editar");
  const resultados = m.resultados ?? [];
  const serie = [...resultados].reverse().slice(-12);
  return (
    <article className="max-w-5xl">
      <Link
        href="/ambiental/monitoramentos"
        className="text-sm text-texto-2 hover:underline"
      >
        Monitoramentos
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4">
        <span className="text-texto-2">{TIPOS_MONITORAMENTO[m.tipo]}</span>
        {!m.ativo && <span className="text-texto-2">Inativo</span>}
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>
        {m.parametro} · {m.ponto}
      </h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <Dado rotulo="Limite">{textoDoLimite(m)}</Dado>
          <Dado rotulo="Periodicidade">
            A cada {m.periodicidadeMeses}{" "}
            {m.periodicidadeMeses === 1 ? "mês" : "meses"}
          </Dado>
          <Dado rotulo="Próxima coleta">
            <span className={m.coletaVencida ? "text-nao-conforme" : ""}>
              {formatarData(m.proximaColeta)}
              {m.coletaVencida && " · atrasada"}
            </span>
          </Dado>
          {m.referencia && (
            <Dado rotulo="Referência do limite">{m.referencia}</Dado>
          )}
        </dl>
      </section>
      {podeEditar && m.ativo && <RegistrarResultado monitoramento={m} />}
      <section className={`${painel} mt-6`}>
        <h2 className={`${tituloDaSecao} px-5 pt-5`}>Resultados</h2>
        {resultados.length === 0 ? (
          <p className="px-5 pt-2 pb-5 text-base text-texto-2">
            Nenhuma coleta registrada.
          </p>
        ) : (
          <>
            {serie.length > 1 && (
              <div className="px-5 pt-3">
                <Linha
                  pontos={serie.map((x) => ({
                    rotulo: formatarData(x.data).slice(0, 5),
                    detalhe: formatarData(x.data),
                    valor: x.valor,
                  }))}
                  cor="var(--color-serie-6)"
                  formato={(v) =>
                    `${v.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${m.unidade}`
                  }
                />
              </div>
            )}
            <div className="relative mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-superficie-2 text-xs text-texto-2">
                  <tr>
                    <th className="px-5 py-2 font-semibold">Data</th>
                    <th className="px-4 py-2 text-right font-semibold">
                      Resultado
                    </th>
                    <th className="px-4 py-2 font-semibold">Situação</th>
                    <th className="px-4 py-2 font-semibold">Laudo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {resultados.map((x) => (
                    <tr key={x.id}>
                      <td className="px-5 py-2.5 whitespace-nowrap">
                        {formatarData(x.data)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                        {x.valor.toLocaleString("pt-BR")} {m.unidade}
                      </td>
                      <td className="px-4 py-2.5">
                        {x.conforme ? (
                          <span className="inline-flex items-center gap-1.5 text-texto">
                            <span
                              aria-hidden
                              className="size-2 rounded-full bg-conforme"
                            />
                            Dentro do limite
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-xs bg-nao-conforme/10 px-1.5 text-nao-conforme">
                            <CircleAlert
                              aria-hidden
                              size={14}
                              strokeWidth={2}
                            />
                            Fora do limite
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-texto-2">
                        {x.laudo ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
      <Anexos
        registro="monitoramento"
        registroId={m.id}
        voltar={`/ambiental/monitoramentos/${m.id}`}
        podeEditar={podeEditar}
      />
      {podeEditar && m.ativo && (
        <Recolhido titulo="Editar o monitoramento">
          <FormularioDeMonitoramento
            acao={atualizarMonitoramento.bind(null, m.id)}
            monitoramento={m}
          />
        </Recolhido>
      )}
      {permissoes.includes("ambiental.excluir") && (
        <SituacaoDoMonitoramento monitoramento={m} />
      )}
    </article>
  );
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd className="mt-0.5 text-base whitespace-pre-line">{children}</dd>
    </div>
  );
}
