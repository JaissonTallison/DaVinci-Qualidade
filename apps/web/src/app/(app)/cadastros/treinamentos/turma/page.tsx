import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import Link from "next/link";
import type { FuncionarioResumo, Pagina, Treinamento } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { botaoLink } from "@/lib/estilos";
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
      <CabecalhoDeCadastro
        voltar={{
          href: voltar,
          rotulo: funcionario ? "Profissional" : "Treinamentos",
        }}
        titulo="Registrar turma"
        descricao="Registre a turma e quem participou. O treinamento entra na ficha de cada participante."
      />
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
                {funcionarios.dados.total} profissionais ativos: registre turmas
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
