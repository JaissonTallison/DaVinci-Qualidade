import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import type { DadosDoUsuario, Treinamento } from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { botaoPrimario, painel, tituloDaPagina } from "@/lib/estilos";
import { FormularioDeTreinamento, SituacaoDoTreinamento } from "./formulario";

export const metadata: Metadata = { title: "Treinamentos" };

const AVISOS: Record<string, string> = {
  criado: "Treinamento cadastrado.",
  salvo: "Treinamento salvo. A nova validade vale para as próximas turmas.",
  inativado: "Treinamento inativado: ele sai da escolha nas turmas.",
  ativado: "Treinamento reativado.",
  turma:
    "Turma registrada: o treinamento entrou na ficha de cada participante.",
};

export default async function Treinamentos({
  searchParams,
}: PageProps<"/cadastros/treinamentos">) {
  const { aviso } = (await searchParams) as { aviso?: string };
  const [lista, eu] = await Promise.all([
    chamarApi<Treinamento[]>("/treinamentos?situacao=todos"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar =
    eu.ok && eu.dados.permissoes.includes("funcionarios.editar");
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Treinamentos</h1>
          <p className="mt-1 max-w-2xl text-base text-texto-2">
            Catálogo com carga horária e validade. A turma registra o
            treinamento na ficha de cada participante e calcula quando vence.
          </p>
        </div>
        {podeEditar && (
          <Link href="/cadastros/treinamentos/turma" className={botaoPrimario}>
            <IconeDaTela href={"/cadastros/treinamentos/turma"} />
            Registrar turma
          </Link>
        )}
      </header>
      <Aviso avisos={AVISOS} chave={aviso} />
      {podeEditar && (
        <Recolhido titulo="Cadastrar treinamento">
          <FormularioDeTreinamento />
        </Recolhido>
      )}
      <section className={`${painel} mt-6`}>
        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : lista.dados.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            Nenhum treinamento cadastrado. Comece pelos exigidos nas NRs da sua
            atividade (NR-35, NR-10, NR-33...).
          </p>
        ) : (
          <ul className="divide-y divide-borda">
            {lista.dados.map((t) => (
              <li
                key={t.id}
                className={`flex flex-wrap items-start justify-between gap-3 px-4 py-3 ${t.ativo ? "" : "text-texto-3"}`}
              >
                <div>
                  <p className="text-base font-medium">
                    {t.nome}
                    {t.norma && (
                      <span className="ml-2 text-sm font-normal text-texto-2">
                        {t.norma}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-texto-2">
                    {t.cargaHoraria} h ·{" "}
                    {t.validadeMeses
                      ? `vale ${t.validadeMeses} ${t.validadeMeses === 1 ? "mês" : "meses"}`
                      : "não vence"}
                    {t.ativo ? "" : " · Inativo"}
                  </p>
                </div>
                {podeEditar && (
                  <details className="w-full sm:w-auto">
                    <summary className="cursor-pointer text-sm text-texto-2 hover:text-texto hover:underline sm:text-right">
                      Editar
                    </summary>
                    <div className="mt-3 rounded-md border border-borda p-4 sm:w-[36rem]">
                      {t.ativo && <FormularioDeTreinamento treinamento={t} />}
                      <SituacaoDoTreinamento treinamento={t} />
                    </div>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
