import { ListFilter } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import {
  formatarDocumento,
  SITUACOES_TERCEIRO,
  type DadosDoUsuario,
  type ResumoTerceiros,
  type TerceiroResumo,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { chamarApi } from "@/lib/api";
import {
  botaoPrimario,
  botaoSecundario,
  campoCompacto,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";
import { SituacaoDoTerceiro } from "./situacao";

export const metadata: Metadata = { title: "Terceiros" };

export default async function Terceiros({
  searchParams,
}: PageProps<"/seguranca/terceiros">) {
  const params = (await searchParams) as { situacao?: string; busca?: string };
  const consulta = new URLSearchParams();
  if (params.situacao) consulta.set("situacao", params.situacao);
  if (params.busca) consulta.set("busca", params.busca);
  const [lista, resumo, eu] = await Promise.all([
    chamarApi<TerceiroResumo[]>(`/terceiros?${consulta}`),
    chamarApi<ResumoTerceiros>("/terceiros/resumo"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("seguranca.editar");
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Terceiros</h1>
          {resumo.ok && (
            <p className="mt-1 text-base text-texto-2">
              {resumo.dados.liberadas}{" "}
              {resumo.dados.liberadas === 1 ? "liberada" : "liberadas"} ·{" "}
              <span
                className={
                  resumo.dados.comPendencia > 0 ? "text-nao-conforme" : ""
                }
              >
                {resumo.dados.comPendencia} com pendência
              </span>{" "}
              · {resumo.dados.documentosVencendo}{" "}
              {resumo.dados.documentosVencendo === 1
                ? "documento vence"
                : "documentos vencem"}{" "}
              em até 30 dias
            </p>
          )}
        </div>
        {podeCriar && (
          <Link href="/seguranca/terceiros/novo" className={botaoPrimario}>
            <IconeDaTela href={"/seguranca/terceiros/novo"} />
            Cadastrar terceiro
          </Link>
        )}
      </header>
      <section className={`${painel} mt-6`}>
        <form
          className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3"
          role="search"
        >
          <input
            name="busca"
            defaultValue={params.busca}
            placeholder="Razão social, serviço ou CNPJ"
            aria-label="Buscar"
            className={`${campoCompacto} w-64`}
          />
          <SelecaoDeFiltro
            nome="situacao"
            rotulo="Situação"
            opcoes={SITUACOES_TERCEIRO}
            valor={params.situacao}
          />
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
        </form>
        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : lista.dados.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            Nenhuma empresa terceirizada
            {consulta.size ? " com esses filtros" : " cadastrada"}.
          </p>
        ) : (
          <ul className="divide-y divide-borda">
            {lista.dados.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/seguranca/terceiros/${t.id}`}
                    className="font-medium text-info hover:underline"
                  >
                    {t.razaoSocial}
                  </Link>
                  <p className="text-sm text-texto-2">
                    <span className="font-mono">
                      {formatarDocumento(t.cnpj)}
                    </span>{" "}
                    · {t.servico}
                  </p>
                  {t.pendencias.length > 0 && (
                    <p className="mt-1 text-sm text-nao-conforme">
                      {t.pendencias.join(" · ")}
                    </p>
                  )}
                </div>
                <SituacaoDoTerceiro situacao={t.situacao} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
