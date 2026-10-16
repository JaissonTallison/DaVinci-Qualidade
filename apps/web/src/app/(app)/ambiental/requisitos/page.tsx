import type { Metadata } from "next";
import Link from "next/link";
import { ListFilter } from "lucide-react";
import {
  ATENDIMENTOS,
  ESFERAS,
  type DadosDoUsuario,
  type RequisitoLegal,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { IconeDaTela } from "@/components/icones-do-menu";
import { AtendimentoDoRequisito } from "@/components/marcadores-ambientais";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Requisitos legais" };

export default async function Requisitos({
  searchParams,
}: PageProps<"/ambiental/requisitos">) {
  const { atendimento } = (await searchParams) as { atendimento?: string };
  const [r, eu] = await Promise.all([
    chamarApi<RequisitoLegal[]>(
      `/requisitos-legais${atendimento ? `?atendimento=${encodeURIComponent(atendimento)}` : ""}`,
    ),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("ambiental.editar");
  const vencidas = r.ok ? r.dados.filter((x) => x.avaliacaoVencida).length : 0;
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Requisitos legais</h1>
          <p className="mt-1 max-w-2xl text-base text-texto-2">
            Legislação aplicável e a avaliação de atendimento, refeita ao menos
            uma vez por ano.
            {r.ok && vencidas > 0 && (
              <span className="text-nao-conforme">
                {" "}
                {vencidas} com avaliação vencida.
              </span>
            )}
          </p>
        </div>
        {podeCriar && (
          <Link href="/ambiental/requisitos/novo" className={botaoPrimario}>
            <IconeDaTela href="/ambiental/requisitos/novo" />
            Novo requisito
          </Link>
        )}
      </header>
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3">
          <SelecaoDeFiltro
            nome="atendimento"
            rotulo="Atendimento"
            opcoes={ATENDIMENTOS}
            valor={atendimento}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
        </form>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : r.dados.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            Nenhum requisito{atendimento ? " com este atendimento" : ""}.
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-sm text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Legislação</th>
                  <th className="px-4 py-2 font-semibold">Esfera</th>
                  <th className="px-4 py-2 font-semibold">Tema</th>
                  <th className="px-4 py-2 font-semibold">Atendimento</th>
                  <th className="px-4 py-2 font-semibold">Próxima avaliação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {r.dados.map((q) => (
                  <tr key={q.id} className="">
                    <td className="max-w-md px-4 py-2">
                      <Link
                        href={`/ambiental/requisitos/${q.id}`}
                        className="text-info hover:underline"
                      >
                        {q.norma}
                      </Link>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {ESFERAS[q.esfera]}
                    </td>
                    <td className="px-4 py-2 text-texto-2">{q.tema}</td>
                    <td className="px-4 py-2">
                      <AtendimentoDoRequisito atendimento={q.atendimento} />
                    </td>
                    <td
                      className={`px-4 py-2 whitespace-nowrap ${q.avaliacaoVencida ? "text-nao-conforme" : ""}`}
                    >
                      {q.proximaAvaliacao
                        ? formatarData(q.proximaAvaliacao)
                        : "Avaliar"}
                      {q.avaliacaoVencida && q.proximaAvaliacao && " · vencida"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
