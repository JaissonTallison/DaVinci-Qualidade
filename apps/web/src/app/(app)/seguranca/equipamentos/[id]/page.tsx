import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  NOMES_DAS_CATEGORIAS,
  RESULTADOS_DA_INSPECAO,
  type DadosDoUsuario,
  type Equipamento,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import {
  EditarEquipamento,
  InspecionarEquipamento,
  SituacaoDoEquipamento,
} from "../formularios";

export const metadata: Metadata = { title: "Equipamento" };

export default async function DetalheDoEquipamento({
  params,
  searchParams,
}: PageProps<"/seguranca/equipamentos/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Equipamento>(`/equipamentos/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const e = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const podeEditar = permissoes.includes("seguranca.editar");
  const hoje = hojeEmBrasilia();
  return (
    <article>
      <Link
        href="/seguranca/equipamentos"
        className="dv-voltar"
      >
        Equipamentos de emergência
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4">
        <span className="font-mono text-lg text-texto-2">
          {e.identificacao}
        </span>
        <span
          className={
            e.vencido && e.ativo
              ? "font-semibold text-nao-conforme"
              : e.pendencia
                ? "text-atencao"
                : ""
          }
        >
          {!e.ativo
            ? "Fora de uso"
            : e.vencido
              ? "Vencido"
              : e.pendencia
                ? "Com pendência"
                : "Em condição"}
        </span>
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>
        {NOMES_DAS_CATEGORIAS[e.categoria]} · {e.local}
      </h1>
      <Aviso
        avisos={{
          criado: "Equipamento cadastrado.",
          salvo: "Equipamento salvo.",
          inspecionado: "Inspeção registrada.",
        }}
        chave={aviso}
      />
      <section
        className={`${painel} mt-6 grid gap-x-8 gap-y-4 p-5 sm:grid-cols-4`}
      >
        {e.detalhes && <Dado rotulo="Detalhes">{e.detalhes}</Dado>}
        <Dado rotulo="Próxima inspeção">
          {e.proximaInspecao ? formatarData(e.proximaInspecao) : "Devida"}
        </Dado>
        {e.proximaRecarga && (
          <Dado rotulo="Próxima recarga">{formatarData(e.proximaRecarga)}</Dado>
        )}
        {e.proximoTeste && (
          <Dado rotulo="Próximo teste hidrostático">
            {formatarData(e.proximoTeste)}
          </Dado>
        )}
        {e.pendencia && <Dado rotulo="Pendência">{e.pendencia}</Dado>}
      </section>
      {podeEditar && e.ativo && (
        <InspecionarEquipamento
          e={e}
          hoje={hoje}
          inspetor={eu.ok ? eu.dados.usuario.nome : ""}
        />
      )}
      <section className={`${painel} mt-6`}>
        <h2 className={`${tituloDaSecao} px-5 pt-5`}>Inspeções</h2>
        {e.inspecoes.length === 0 ? (
          <p className="px-5 py-5 text-base text-texto-2">
            Nenhuma inspeção registrada.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-borda border-t border-borda text-sm">
            {e.inspecoes.map((i, n) => (
              <li
                key={n}
                className="flex flex-wrap justify-between gap-2 px-5 py-2"
              >
                <span>
                  {formatarData(i.data)} · {i.responsavel}
                  {i.observacao && (
                    <span className="text-texto-2"> · {i.observacao}</span>
                  )}
                </span>
                <span
                  className={
                    i.resultado === "nao_conforme"
                      ? "font-semibold text-nao-conforme"
                      : "text-conforme"
                  }
                >
                  {RESULTADOS_DA_INSPECAO[i.resultado]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {podeEditar && e.ativo && (
        <Recolhido titulo="Corrigir cadastro">
          <EditarEquipamento e={e} hoje={hoje} />
        </Recolhido>
      )}
      {permissoes.includes("seguranca.excluir") && (
        <p className="mt-4">
          <SituacaoDoEquipamento e={e} />
        </p>
      )}
    </article>
  );
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd className="mt-0.5 text-base">{children}</dd>
    </div>
  );
}
