import type { Metadata } from "next";
import Link from "next/link";
import type {
  Epi,
  Funcionario,
  FuncionarioResumo,
  Pagina,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import {
  botaoLink,
  botaoSecundario,
  campoCompacto,
  tituloDaPagina,
} from "@/lib/estilos";
import { FormularioDeEntrega } from "./formulario";

export const metadata: Metadata = { title: "Registrar entrega de EPI" };

/** A lista de funcionários vem limitada; com muita gente, a busca acima estreita a escolha. */
const LIMITE = 100;

export default async function NovaEntrega({
  searchParams,
}: PageProps<"/seguranca/entregas-de-epi/nova">) {
  const { funcionario: funcionarioId, busca } = (await searchParams) as {
    funcionario?: string;
    busca?: string;
  };
  const consulta = new URLSearchParams({
    situacao: "ativos",
    porPagina: String(LIMITE),
  });
  if (busca) consulta.set("busca", busca);
  const [lista, epis, escolhido] = await Promise.all([
    chamarApi<Pagina<FuncionarioResumo>>(`/funcionarios?${consulta}`),
    chamarApi<Epi[]>("/epis"),
    funcionarioId
      ? chamarApi<Funcionario>(`/funcionarios/${funcionarioId}`)
      : null,
  ]);
  const voltar = funcionarioId
    ? `/cadastros/funcionarios/${funcionarioId}`
    : "/seguranca/entregas-de-epi";
  const erro = !lista.ok ? lista.erro : !epis.ok ? epis.erro : null;

  // O funcionário que veio da ficha entra na lista mesmo fora da busca.
  const funcionarios = lista.ok ? lista.dados.itens : [];
  if (
    escolhido?.ok &&
    escolhido.dados.ativo &&
    !funcionarios.some((f) => f.id === escolhido.dados.id)
  )
    funcionarios.unshift(escolhido.dados);

  return (
    <>
      <Link href={voltar} className="text-sm text-texto-2 hover:underline">
        {funcionarioId ? "Funcionário" : "Entregas de EPI"}
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Registrar entrega de EPI</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Só entra EPI com CA válido na data da entrega e só para funcionário
        ativo. A entrega vai para a ficha de EPI da pessoa.
      </p>
      {erro ? (
        <div className="mt-6">
          <AvisoDeErro erro={erro} />
        </div>
      ) : epis.ok && epis.dados.length === 0 ? (
        <p className="mt-6 text-base text-texto-2">
          Nenhum EPI ativo no catálogo.{" "}
          <Link href="/seguranca/epis" className={botaoLink}>
            Cadastre os EPIs
          </Link>{" "}
          antes de registrar entregas.
        </p>
      ) : (
        <>
          {lista.ok && (lista.dados.total > LIMITE || busca) && (
            <form
              className="mt-6 flex flex-wrap items-center gap-3"
              role="search"
            >
              {funcionarioId && (
                <input type="hidden" name="funcionario" value={funcionarioId} />
              )}
              <input
                name="busca"
                defaultValue={busca}
                placeholder="Nome, matrícula ou CPF"
                aria-label="Buscar funcionário"
                className={`${campoCompacto} w-64`}
              />
              <button type="submit" className={botaoSecundario}>
                Buscar funcionário
              </button>
              <span className="text-sm text-texto-2">
                {lista.dados.total > LIMITE
                  ? `Mostrando ${LIMITE} de ${lista.dados.total} funcionários ativos.`
                  : `${lista.dados.total} ${lista.dados.total === 1 ? "encontrado" : "encontrados"}.`}
              </span>
            </form>
          )}
          <FormularioDeEntrega
            funcionarios={funcionarios}
            epis={epis.ok ? epis.dados : []}
            funcionarioId={funcionarioId}
            voltar={voltar}
          />
        </>
      )}
    </>
  );
}
