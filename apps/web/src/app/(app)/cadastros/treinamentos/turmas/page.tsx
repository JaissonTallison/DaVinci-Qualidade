import type { Metadata } from "next";
import Link from "next/link";
import type { ResumoDaTurma } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";

export const metadata: Metadata = { title: "Turmas de treinamento" };

/** Turmas recentes: lista de presença e certificados para imprimir. */
export default async function Turmas() {
  const r = await chamarApi<ResumoDaTurma[]>("/turmas-de-treinamento");
  return (
    <>
      <Link
        href="/cadastros/treinamentos"
        className="dv-voltar"
      >
        Treinamentos
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Turmas de treinamento</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        Cada turma tem a lista de presença para assinar e os certificados dos
        participantes.
      </p>
      <section className={`${painel} mt-6`}>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : r.dados.length === 0 ? (
          <p className="px-5 py-6 text-base text-texto-2">
            Nenhuma turma registrada.
          </p>
        ) : (
          <ul className="divide-y divide-borda">
            {r.dados.map((t) => (
              <li
                key={`${t.treinamentoId}-${t.data}`}
                className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-2.5"
              >
                <span className="text-base">
                  {t.treinamentoNome}{" "}
                  <span className="text-sm text-texto-2">
                    · {formatarData(t.data)} · {t.participantes} participante(s)
                  </span>
                </span>
                <span className="flex gap-4 text-sm">
                  <Link
                    href={`/cadastros/treinamentos/turmas/${t.treinamentoId}/${t.data}`}
                    className="text-info hover:underline"
                  >
                    Lista de presença
                  </Link>
                  <Link
                    href={`/cadastros/treinamentos/turmas/${t.treinamentoId}/${t.data}?certificados=1`}
                    className="text-info hover:underline"
                  >
                    Certificados
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
