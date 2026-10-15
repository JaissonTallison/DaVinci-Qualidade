import { ListFilter } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { DadosDoUsuario, Epi } from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { ValidadeDoCa } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import {
  botaoSecundario,
  campoCompacto,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";
import { FormularioDeEpi } from "./formulario";

export const metadata: Metadata = { title: "Catálogo de EPIs" };

const SITUACOES = { ativos: "Ativos", inativos: "Inativos", todos: "Todos" };

export default async function CatalogoDeEpis({
  searchParams,
}: PageProps<"/seguranca/epis">) {
  const { situacao, aviso } = (await searchParams) as {
    situacao?: string;
    aviso?: string;
  };
  const [lista, eu] = await Promise.all([
    chamarApi<Epi[]>(
      `/epis?situacao=${situacao && situacao in SITUACOES ? situacao : "ativos"}`,
    ),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("seguranca.editar");

  return (
    <>
      <h1 className={tituloDaPagina}>Catálogo de EPIs</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Cada EPI com o seu Certificado de Aprovação. Com o CA vencido, o EPI não
        pode ser entregue (NR-6).
      </p>
      <Aviso avisos={{ criado: "EPI cadastrado no catálogo." }} chave={aviso} />
      {podeEditar && (
        <Recolhido titulo="Cadastrar EPI">
          <FormularioDeEpi />
        </Recolhido>
      )}

      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3">
          <select
            name="situacao"
            defaultValue={situacao ?? "ativos"}
            aria-label="Situação"
            className={campoCompacto}
          >
            {Object.entries(SITUACOES).map(([chave, nome]) => (
              <option key={chave} value={chave}>
                {nome}
              </option>
            ))}
          </select>
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
            Nenhum EPI {situacao === "inativos" ? "inativo" : "no catálogo"}.
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-xs text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">EPI</th>
                  <th className="px-4 py-2 font-semibold">CA</th>
                  <th className="px-4 py-2 font-semibold">Validade do CA</th>
                  <th className="px-4 py-2 font-semibold">Vida útil</th>
                  <th className="px-4 py-2 font-semibold">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.map((e) => (
                  <tr key={e.id} className="hover:bg-superficie-2">
                    <td className="px-4 py-2">
                      <Link
                        href={`/seguranca/epis/${e.id}`}
                        className="font-medium text-info hover:underline"
                      >
                        {e.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-2 font-mono text-sm">{e.ca}</td>
                    <td className="px-4 py-2">
                      <ValidadeDoCa
                        validade={e.validadeCa}
                        vencido={e.caVencido}
                        venceEmBreve={e.caVenceEmBreve}
                      />
                    </td>
                    <td className="px-4 py-2 text-texto-2">
                      {e.vidaUtilDias
                        ? `${e.vidaUtilDias} ${e.vidaUtilDias === 1 ? "dia" : "dias"}`
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-texto-2">
                      {e.ativo ? "Ativo" : "Inativo"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
