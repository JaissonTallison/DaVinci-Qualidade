import type { Metadata } from "next";
import type { DadosDoUsuario, ServicoDoCatalogo } from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { EditarServico, NovoServico, SituacaoDoServico } from "./formularios";

export const metadata: Metadata = { title: "Catálogo de serviços" };

/** O padrão de cada serviço: checklist de execução e horas, copiados para a OS. */
export default async function Catalogo({
  searchParams,
}: PageProps<"/servicos/catalogo">) {
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<ServicoDoCatalogo[]>("/catalogo-de-servicos"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("servicos.editar");
  return (
    <>
      <h1 className={tituloDaPagina}>Catálogo de serviços</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        Os serviços que a empresa presta, cada um com o checklist de execução e
        as horas padrão. Ao abrir a OS com um serviço do catálogo, os passos vêm
        junto e a OS só conclui com todos marcados.
      </p>
      <Aviso
        avisos={{
          criado: "Serviço incluído no catálogo.",
          salvo: "Serviço salvo.",
        }}
        chave={aviso}
      />
      {podeEditar && (
        <Recolhido titulo="Novo serviço">
          <NovoServico />
        </Recolhido>
      )}
      <section className={`${painel} mt-6`}>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : r.dados.length === 0 ? (
          <p className="px-5 py-6 text-base text-texto-2">
            Nenhum serviço no catálogo.
          </p>
        ) : (
          <ul className="divide-y divide-borda">
            {r.dados.map((s) => (
              <li
                key={s.id}
                className={`px-5 py-3 ${s.ativo ? "" : "text-texto-3"}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-base font-semibold">
                    {s.nome}
                    <span className="ml-2 text-sm font-normal text-texto-2">
                      {s.checklist.length} passo(s)
                      {s.horasPadrao &&
                        ` · ${s.horasPadrao.toLocaleString("pt-BR")} h`}
                      {!s.ativo && " · inativo"}
                    </span>
                  </p>
                  {podeEditar && <SituacaoDoServico s={s} />}
                </div>
                {s.descricao && (
                  <p className="text-sm text-texto-2">{s.descricao}</p>
                )}
                {podeEditar && s.ativo && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-sm text-info">
                      Editar
                    </summary>
                    <div className="mt-2">
                      <EditarServico s={s} />
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
