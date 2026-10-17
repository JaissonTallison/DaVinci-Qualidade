import type { Metadata } from "next";
import Link from "next/link";
import type { FuncionarioResumo, Pagina, Treinamento } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { botaoLink, tituloDaPagina } from "@/lib/estilos";
import { FormularioDeTurma } from "./formulario";

export const metadata: Metadata = { title: "Registrar turma" };

export default async function Turma({
  searchParams,
}: PageProps<"/cadastros/treinamentos/turma">) {
  const { funcionario } = (await searchParams) as { funcionario?: string };
  const [treinamentos, funcionarios] = await Promise.all([
    chamarApi<Treinamento[]>("/treinamentos"),
    chamarApi<Pagina<FuncionarioResumo>>(
      "/funcionarios?situacao=ativos&porPagina=100",
    ),
  ]);
  const voltar = funcionario
    ? `/cadastros/funcionarios/${funcionario}`
    : "/cadastros/treinamentos";
  const erro = !treinamentos.ok
    ? treinamentos.erro
    : !funcionarios.ok
      ? funcionarios.erro
      : null;
  return (
    <>
      <Link href={voltar} className="dv-voltar">
        {funcionario ? "Funcionário" : "Treinamentos"}
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Registrar turma</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Marque quem participou. A validade de cada um sai do catálogo.
      </p>
      {erro ? (
        <div className="mt-6">
          <AvisoDeErro erro={erro} />
        </div>
      ) : treinamentos.ok && treinamentos.dados.length === 0 ? (
        <p className="mt-6 text-base text-texto-2">
          Nenhum treinamento ativo.{" "}
          <Link href="/cadastros/treinamentos" className={botaoLink}>
            Cadastre no catálogo
          </Link>{" "}
          antes.
        </p>
      ) : (
        <>
          {funcionarios.ok &&
            funcionarios.dados.total > funcionarios.dados.itens.length && (
              <p className="mt-4 text-sm text-atencao">
                Mostrando {funcionarios.dados.itens.length} de{" "}
                {funcionarios.dados.total} funcionários ativos: registre turmas
                maiores em partes.
              </p>
            )}
          <FormularioDeTurma
            treinamentos={treinamentos.ok ? treinamentos.dados : []}
            funcionarios={funcionarios.ok ? funcionarios.dados.itens : []}
            marcados={funcionario ? [funcionario] : []}
            voltar={voltar}
          />
        </>
      )}
    </>
  );
}
