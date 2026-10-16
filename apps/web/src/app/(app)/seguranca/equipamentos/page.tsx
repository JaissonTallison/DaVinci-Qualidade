import type { Metadata } from "next";
import Link from "next/link";
import {
  NOMES_DAS_CATEGORIAS,
  type DadosDoUsuario,
  type Equipamento,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";
import { botaoSecundario, painel, tituloDaPagina } from "@/lib/estilos";
import { NovoEquipamento } from "./formularios";

export const metadata: Metadata = { title: "Equipamentos de emergência" };

/** Extintores, hidrantes, mangueiras, alarmes e máquinas: inspeção, recarga e teste hidrostático com vencimento. */
export default async function Equipamentos({
  searchParams,
}: PageProps<"/seguranca/equipamentos">) {
  const { categoria } = (await searchParams) as { categoria?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Equipamento[]>("/equipamentos"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("seguranca.editar");
  const lista = r.ok
    ? r.dados.filter((e) => !categoria || e.categoria === categoria)
    : [];
  const vencidos = lista.filter((e) => e.ativo && e.vencido).length;
  const pendentes = lista.filter((e) => e.ativo && e.pendencia).length;
  return (
    <>
      <h1 className={tituloDaPagina}>Equipamentos de emergência</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        Cada equipamento com a periodicidade da categoria: extintor com inspeção
        mensal, recarga anual e teste hidrostático a cada 5 anos (NBR 12962);
        mangueira com inspeção semestral e teste anual (NBR 12779). Os
        vencimentos entram no painel.
      </p>
      <p className="mt-3 text-base">
        <span className={vencidos ? "font-semibold text-nao-conforme" : ""}>
          {vencidos} vencido(s)
        </span>{" "}
        ·{" "}
        <span className={pendentes ? "font-semibold text-atencao" : ""}>
          {pendentes} com pendência
        </span>
      </p>
      {podeEditar && (
        <Recolhido titulo="Cadastrar equipamento">
          <NovoEquipamento hoje={hojeEmBrasilia()} />
        </Recolhido>
      )}
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-2 border-b border-borda px-4 py-3">
          <SelecaoDeFiltro
            nome="categoria"
            rotulo="Categoria"
            opcoes={NOMES_DAS_CATEGORIAS}
            valor={categoria}
          />
          <button type="submit" className={botaoSecundario}>
            Filtrar
          </button>
        </form>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : lista.length === 0 ? (
          <p className="px-5 py-6 text-base text-texto-2">
            Nenhum equipamento.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borda text-left text-texto-2">
                <th className="px-4 py-2 font-semibold">Equipamento</th>
                <th className="px-4 py-2 font-semibold">Local</th>
                <th className="px-4 py-2 font-semibold">Próximo vencimento</th>
                <th className="px-4 py-2 font-semibold">Situação</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((e) => (
                <tr
                  key={e.id}
                  className={`border-b border-borda last:border-0 ${e.ativo ? "" : "text-texto-3"}`}
                >
                  <td data-rotulo="Equipamento" className="px-4 py-2.5">
                    <Link
                      href={`/seguranca/equipamentos/${e.id}`}
                      className="text-info hover:underline"
                    >
                      {NOMES_DAS_CATEGORIAS[e.categoria]}{" "}
                      <span className="font-mono">{e.identificacao}</span>
                    </Link>
                    {e.detalhes && (
                      <span className="block text-texto-2">{e.detalhes}</span>
                    )}
                  </td>
                  <td data-rotulo="Local" className="px-4 py-2.5">
                    {e.local}
                  </td>
                  <td
                    data-rotulo="Próximo vencimento"
                    className={`px-4 py-2.5 ${e.vencido && e.ativo ? "font-semibold text-nao-conforme" : ""}`}
                  >
                    {e.proximoVencimento
                      ? `${e.proximoVencimento.o} · ${formatarData(e.proximoVencimento.data)}`
                      : "—"}
                  </td>
                  <td data-rotulo="Situação" className="px-4 py-2.5">
                    {!e.ativo ? (
                      "Fora de uso"
                    ) : e.pendencia ? (
                      <span className="text-atencao">
                        Pendência: {e.pendencia}
                      </span>
                    ) : (
                      "Em condição"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
