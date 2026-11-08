import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import Link from "next/link";
import type { Funcao, SetorDaEmpresa } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { botaoLink } from "@/lib/estilos";
import { FormularioDeFuncionario } from "../formulario";

export const metadata: Metadata = { title: "Cadastrar profissional" };

export default async function NovoFuncionario() {
  const [setores, funcoes] = await Promise.all([
    chamarApi<SetorDaEmpresa[]>("/setores-da-empresa"),
    chamarApi<Funcao[]>("/funcoes"),
  ]);
  const semEstrutura =
    setores.ok &&
    funcoes.ok &&
    (setores.dados.length === 0 || funcoes.dados.length === 0);
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{ href: "/cadastros/funcionarios", rotulo: "Profissionais" }}
        titulo="Cadastrar profissional"
      />
      {!setores.ok ? (
        <div className="mt-6">
          <AvisoDeErro erro={setores.erro} />
        </div>
      ) : !funcoes.ok ? (
        <div className="mt-6">
          <AvisoDeErro erro={funcoes.erro} />
        </div>
      ) : semEstrutura ? (
        <p className="mt-4 max-w-2xl text-base text-texto-2">
          Todo profissional tem setor e função. Cadastre-os antes em{" "}
          <Link href="/cadastros/setores-e-funcoes" className={botaoLink}>
            Setores e funções
          </Link>
          .
        </p>
      ) : (
        <FormularioDeFuncionario
          setores={setores.dados}
          funcoes={funcoes.dados}
        />
      )}
    </>
  );
}
