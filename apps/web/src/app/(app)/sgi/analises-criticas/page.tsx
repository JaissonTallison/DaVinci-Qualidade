import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import type { AnaliseCritica, DadosDoUsuario, ResumoSgi } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { botaoPrimario, painel, tituloDaPagina } from "@/lib/estilos";

export const metadata: Metadata = { title: "Análises críticas" };

export default async function Analises() {
  const [lista, resumo, eu] = await Promise.all([
    chamarApi<AnaliseCritica[]>("/analises-criticas"),
    chamarApi<ResumoSgi>("/sgi/resumo"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("sgi.editar");
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Análises críticas pela direção</h1>
          {resumo.ok && (
            <p
              className={`mt-1 text-base ${resumo.dados.analiseCriticaAtrasada ? "text-nao-conforme" : "text-texto-2"}`}
            >
              {resumo.dados.proximaAnaliseCritica
                ? `Próxima prevista para ${formatarData(resumo.dados.proximaAnaliseCritica)}${resumo.dados.analiseCriticaAtrasada ? " · atrasada" : ""}`
                : "Nenhuma análise crítica registrada."}
            </p>
          )}
        </div>
        {podeCriar && (
          <Link href="/sgi/analises-criticas/nova" className={botaoPrimario}>
            <IconeDaTela href={"/sgi/analises-criticas/nova"} />
            Registrar análise
          </Link>
        )}
      </header>
      <section className={`${painel} mt-6`}>
        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : lista.dados.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            Nenhuma análise registrada.
          </p>
        ) : (
          <ul className="divide-y divide-borda">
            {lista.dados.map((a) => (
              <li key={a.id} className="px-4 py-3">
                <Link
                  href={`/sgi/analises-criticas/${a.id}`}
                  className="font-medium text-info hover:underline"
                >
                  Reunião de {formatarData(a.data)}
                </Link>
                <p className="text-sm text-texto-2">{a.participantes}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
