import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MESES_ABREVIADOS,
  type DadosDoUsuario,
  type ItemDaProgramacao,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/recolhido";
import { StatusDaAuditoria } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { excluirItemProgramacao } from "@/lib/acoes-programacao";
import {
  cabecalhoDoPainel,
  painel,
  tituloDaPagina,
  tituloDoPainel,
} from "@/lib/estilos";
import { FormularioDaProgramacao } from "../formulario";

import { CabecalhoComVoltar } from "@/components/pagina-de-cadastro";
import { CaixaDeAlerta } from "@/components/caixa-de-alerta";
import { Trash2 } from "@/components/icones";
import { Botao } from "@/components/botao";
export const metadata: Metadata = { title: "Item da programação" };

export default async function EditarItemDaProgramacao({
  params,
  searchParams,
}: PageProps<"/auditorias/programacao/[id]">) {
  const { id } = await params;
  const { erro } = (await searchParams) as { erro?: string };
  const [r, eu] = await Promise.all([
    chamarApi<ItemDaProgramacao>(`/programacao-de-auditorias/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const item = r.dados;
  const podeExcluir =
    eu.ok && eu.dados.permissoes.includes("auditorias.editar");

  return (
    <>
      <CabecalhoComVoltar
        voltar={{
          href: "/auditorias/programacao",
          rotulo: "Programação de auditorias",
        }}
      >
        <h1 className={tituloDaPagina}>
          {item.setor} · {item.ano}
        </h1>
        {erro && (
          <CaixaDeAlerta tom="perigo" className="mt-4">
            {erro}
          </CaixaDeAlerta>
        )}
      </CabecalhoComVoltar>

      <FormularioDaProgramacao item={item} ano={item.ano} />

      <section className={`${painel} mt-6`}>
        <header className={cabecalhoDoPainel}>
          <h2 className={tituloDoPainel}>Auditorias vinculadas</h2>
        </header>
        <div className="p-5">
          {item.realizadas.length === 0 ? (
            <p className="mt-2 text-base text-texto-2">
              Nenhuma auditoria vinculada a este item ainda. Ao planejar uma
              auditoria, escolha este item da programação para vinculá-la.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-borda">
              {item.realizadas.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-x-6 gap-y-1 py-2.5"
                >
                  <Link
                    href={`/auditorias/${a.id}`}
                    className="font-mono text-sm font-medium text-info hover:underline"
                  >
                    {a.numero}
                  </Link>
                  {a.mes && (
                    <span className="text-sm text-texto-2">
                      {MESES_ABREVIADOS[a.mes - 1]}
                    </span>
                  )}
                  <StatusDaAuditoria status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {podeExcluir && (
        <Recolhido titulo="Remover da programação">
          <p className="text-base text-texto-2">
            Remove este item do plano anual. Só é possível quando não há
            auditorias vinculadas; o histórico das auditorias não muda.
          </p>
          <form
            action={excluirItemProgramacao.bind(
              null,
              item.id,
              String(item.ano),
            )}
            className="mt-3"
          >
            <Botao type="submit" variante="perigo" icone={Trash2}>
              Remover item
            </Botao>
          </form>
        </Recolhido>
      )}
    </>
  );
}
