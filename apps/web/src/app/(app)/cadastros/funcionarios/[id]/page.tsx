import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  formatarDocumento,
  formatarTelefone,
  type DadosDoUsuario,
  type EntregaEpi,
  type Funcao,
  type Funcionario,
  type Pagina,
  type SetorDaEmpresa,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { TabelaDeEntregas } from "@/components/tabela-de-entregas";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import {
  botaoPrimario,
  painel,
  tituloDaPagina,
  tituloDaSecao,
} from "@/lib/estilos";
import { FormularioDeFuncionario } from "../formulario";
import { DesligarFuncionario, ReadmitirFuncionario } from "./acoes";
import { ExamesETreinamentos } from "./exames-e-treinamentos";

export const metadata: Metadata = { title: "Funcionário" };

const AVISOS: Record<string, string> = {
  aso: "Exame registrado.",
  "aso-anulado": "Exame anulado.",
  turma: "Treinamento registrado.",
  "treinamento-anulado": "Treinamento anulado.",
  criado: "Funcionário cadastrado.",
  salvo: "Funcionário salvo.",
  desligado: "Funcionário desligado.",
  readmitido: "Funcionário readmitido.",
  entregue: "Entrega registrada na ficha.",
  devolvido: "Devolução registrada.",
  anulada: "Entrega anulada.",
};

export default async function DetalheDoFuncionario({
  params,
  searchParams,
}: PageProps<"/cadastros/funcionarios/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Funcionario>(`/funcionarios/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const f = r.dados;
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const podeEditar = permissoes.includes("funcionarios.editar");
  const veEpi =
    eu.ok &&
    eu.dados.recursos.includes("seguranca") &&
    permissoes.includes("seguranca.ver");
  const [setores, funcoes, ficha] = await Promise.all([
    podeEditar && f.ativo
      ? chamarApi<SetorDaEmpresa[]>("/setores-da-empresa?situacao=todos")
      : null,
    podeEditar && f.ativo
      ? chamarApi<Funcao[]>("/funcoes?situacao=todos")
      : null,
    veEpi
      ? chamarApi<Pagina<EntregaEpi>>(
          `/epis/entregas?funcionarioId=${f.id}&porPagina=100`,
        )
      : null,
  ]);
  const voltar = `/cadastros/funcionarios/${f.id}`;

  return (
    <article className="max-w-6xl">
      <Link
        href="/cadastros/funcionarios"
        className="text-sm text-texto-2 hover:underline"
      >
        Funcionários
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-lg text-texto-2">{f.matricula}</span>
        <span className={f.ativo ? "text-texto" : "text-texto-2"}>
          {f.ativo
            ? "Ativo"
            : `Desligado em ${f.desligamento ? formatarData(f.desligamento) : "—"}`}
        </span>
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>{f.nome}</h1>
      <Aviso avisos={AVISOS} chave={aviso} />

      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
          <Dado rotulo="CPF">
            <span className="font-mono">{formatarDocumento(f.cpf)}</span>
          </Dado>
          <Dado rotulo="Setor">{f.setorNome}</Dado>
          <Dado rotulo="Função">{f.funcaoNome}</Dado>
          <Dado rotulo="Admissão">{formatarData(f.admissao)}</Dado>
          {f.email && <Dado rotulo="E-mail">{f.email}</Dado>}
          {f.telefone && (
            <Dado rotulo="Telefone">{formatarTelefone(f.telefone)}</Dado>
          )}
          {f.motivoDesligamento && (
            <Dado rotulo="Motivo do desligamento">{f.motivoDesligamento}</Dado>
          )}
        </dl>
      </section>

      <ExamesETreinamentos f={f} podeEditar={podeEditar} />

      {ficha && (
        <section className={`${painel} mt-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
            <h2 className={tituloDaSecao}>Ficha de EPI</h2>
            {f.ativo && permissoes.includes("seguranca.editar") && (
              <Link
                href={`/seguranca/entregas-de-epi/nova?funcionario=${f.id}`}
                className={botaoPrimario}
              >
                <IconeDaTela
                  href={`/seguranca/entregas-de-epi/nova?funcionario=${f.id}`}
                />
                Registrar entrega
              </Link>
            )}
          </div>
          {!ficha.ok ? (
            <div className="p-5">
              <AvisoDeErro erro={ficha.erro} />
            </div>
          ) : ficha.dados.itens.length === 0 ? (
            <p className="px-5 pt-2 pb-5 text-base text-texto-2">
              Nenhum EPI entregue a este funcionário.
            </p>
          ) : (
            <div className="mt-3">
              <TabelaDeEntregas
                entregas={ficha.dados.itens}
                voltar={voltar}
                podeEditar={permissoes.includes("seguranca.editar")}
                gestor={permissoes.includes("seguranca.excluir")}
                comFuncionario={false}
              />
              {ficha.dados.total > ficha.dados.itens.length && (
                <p className="border-t border-borda px-5 py-2.5 text-sm text-texto-2">
                  Mostrando as {ficha.dados.itens.length} entregas mais recentes
                  de {ficha.dados.total}.{" "}
                  <Link
                    href={`/seguranca/entregas-de-epi?funcionarioId=${f.id}`}
                    className="text-info hover:underline"
                  >
                    Ver todas
                  </Link>
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {setores?.ok && funcoes?.ok && (
        <Recolhido titulo="Editar dados do funcionário">
          <FormularioDeFuncionario
            funcionario={f}
            setores={setores.dados}
            funcoes={funcoes.dados}
            embutido
          />
        </Recolhido>
      )}
      {podeEditar &&
        (f.ativo ? (
          <DesligarFuncionario funcionario={f} />
        ) : (
          <ReadmitirFuncionario funcionario={f} />
        ))}
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
