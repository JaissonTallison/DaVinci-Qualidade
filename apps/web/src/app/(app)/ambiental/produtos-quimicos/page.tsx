import type { Metadata } from "next";
import Link from "next/link";
import { ListFilter } from "lucide-react";
import {
  PERIGOS_GHS,
  UNIDADES_PRODUTO,
  type DadosDoUsuario,
  type ProdutoQuimico,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { IconeDaTela } from "@/components/icones-do-menu";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  campoCompacto,
  painel,
  tituloDaPagina,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Produtos químicos" };

export default async function Produtos({
  searchParams,
}: PageProps<"/ambiental/produtos-quimicos">) {
  const { situacao, fds } = (await searchParams) as {
    situacao?: string;
    fds?: string;
  };
  const filtro = new URLSearchParams();
  if (situacao) filtro.set("situacao", situacao);
  if (fds) filtro.set("fds", fds);
  const [r, eu] = await Promise.all([
    chamarApi<ProdutoQuimico[]>(`/produtos-quimicos?${filtro}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("ambiental.editar");
  const vencidas = r.ok ? r.dados.filter((p) => p.fdsVencida).length : 0;
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Produtos químicos</h1>
          <p className="mt-1 max-w-2xl text-base text-texto-2">
            Inventário com os perigos da FDS (GHS) e onde cada produto fica. A
            FDS é conferida com o fornecedor a cada 5 anos.
            {vencidas > 0 && (
              <span className="text-nao-conforme">
                {" "}
                {vencidas === 1
                  ? "1 FDS para revisar."
                  : `${vencidas} FDS para revisar.`}
              </span>
            )}
          </p>
        </div>
        {podeCriar && (
          <Link
            href="/ambiental/produtos-quimicos/novo"
            className={botaoPrimario}
          >
            <IconeDaTela href="/ambiental/produtos-quimicos" />
            Novo produto
          </Link>
        )}
      </header>
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3">
          <select
            name="situacao"
            defaultValue={situacao ?? ""}
            aria-label="Situação"
            className={campoCompacto}
          >
            <option value="">Ativos</option>
            <option value="inativos">Inativos</option>
            <option value="todos">Todos</option>
          </select>
          <label className="inline-flex items-center gap-2 text-base">
            <input
              type="checkbox"
              name="fds"
              value="vencida"
              defaultChecked={fds === "vencida"}
              className="size-4 accent-primaria"
            />
            Só FDS para revisar
          </label>
          <button type="submit" className={botaoSecundario}>
            <ListFilter aria-hidden size={16} strokeWidth={2} />
            Filtrar
          </button>
        </form>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : r.dados.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            Nenhum produto neste filtro.
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-sm text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Produto</th>
                  <th className="px-4 py-2 font-semibold">Fabricante</th>
                  <th className="px-4 py-2 font-semibold">Perigos</th>
                  <th className="px-4 py-2 font-semibold">Local</th>
                  <th className="px-4 py-2 font-semibold">Máximo</th>
                  <th className="px-4 py-2 font-semibold">
                    Próxima revisão da FDS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {r.dados.map((p) => (
                  <tr
                    key={p.id}
                    className={` ${p.ativo ? "" : "text-texto-3"}`}
                  >
                    <td className="px-4 py-2">
                      <Link
                        href={`/ambiental/produtos-quimicos/${p.id}`}
                        className="text-info hover:underline"
                      >
                        {p.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-texto-2">{p.fabricante}</td>
                    <td className="max-w-xs px-4 py-2 text-sm">
                      {p.perigos.length
                        ? p.perigos.map((x) => PERIGOS_GHS[x]).join(", ")
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-texto-2">{p.local}</td>
                    <td className="px-4 py-2 tabular-nums whitespace-nowrap">
                      {p.quantidadeMaxima !== null
                        ? `${p.quantidadeMaxima.toLocaleString("pt-BR")} ${UNIDADES_PRODUTO[p.unidade]}`
                        : "—"}
                    </td>
                    <td
                      className={`px-4 py-2 whitespace-nowrap ${p.fdsVencida ? "text-nao-conforme" : ""}`}
                    >
                      {formatarData(p.proximaRevisaoFds)}
                      {p.fdsVencida && " · vencida"}
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
