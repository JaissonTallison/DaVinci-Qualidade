import { ListFilter, Plus } from "@/components/icones";
import Link from "next/link";
import {
  CLASSES_RO,
  type DadosDoUsuario,
  type RiscoOuOportunidade,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { SelecaoDeFiltro } from "@/components/filtros";
import { ClasseDoRo } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel } from "@/lib/estilos";
import type { ConfigRo } from "./config";
import { Botao } from "@/components/botao";
import { CabecalhoDaPagina } from "@/components/cabecalho-da-pagina";

export async function ListaDeRo({
  cfg,
  searchParams,
}: {
  cfg: ConfigRo;
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const params = (await searchParams) as {
    classe?: string;
    situacao?: string;
  };
  const consulta = new URLSearchParams({ tipo: cfg.tipo });
  for (const k of ["classe", "situacao"] as const)
    if (params[k]) consulta.set(k, params[k]!);
  const [lista, eu] = await Promise.all([
    chamarApi<RiscoOuOportunidade[]>(`/riscos-e-oportunidades?${consulta}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("sgi.editar");
  const temFiltro = Boolean(params.classe || params.situacao);
  return (
    <>
      <CabecalhoDaPagina
        titulo={cfg.titulo}
        descricao={cfg.subtitulo}
        acoes={
          <>
            {podeCriar && (
              <Botao
                tamanho="grande"
                href={`${cfg.base}/novo`}
                variante="primario"
                icone={Plus}
              >
                {cfg.registrar}
              </Botao>
            )}
          </>
        }
      />
      <section className={`${painel} mt-6`}>
        <form className="flex flex-wrap items-end gap-3 border-b border-borda px-4 py-3">
          <SelecaoDeFiltro
            nome="classe"
            rotulo={cfg.classe}
            opcoes={CLASSES_RO}
            valor={params.classe}
          />
          <SelecaoDeFiltro
            nome="situacao"
            rotulo="Situação"
            opcoes={{ encerrados: "Encerrados", todos: "Todos" }}
            valor={params.situacao}
          />
          <Botao type="submit" icone={ListFilter}>
            Filtrar
          </Botao>
        </form>
        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : lista.dados.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            Nenhum registro{temFiltro ? " com esses filtros" : ""}.
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-xs uppercase tracking-[0.04em] text-texto-2">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">{cfg.classe}</th>
                  <th className="px-4 py-2.5 font-semibold">Processo</th>
                  <th className="px-4 py-2.5 font-semibold">Descrição</th>
                  <th className="px-4 py-2.5 font-semibold">Prazo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.map((r) => (
                  <tr
                    key={r.id}
                    className={r.encerradoEm ? "text-texto-3" : ""}
                  >
                    <td className="px-4 py-3">
                      <ClasseDoRo classe={r.classe} />
                    </td>
                    <td className="px-4 py-3 text-texto-2">{r.processo}</td>
                    <td className="max-w-md px-4 py-3">
                      <Link
                        href={`${cfg.base}/${r.id}`}
                        className="text-info hover:underline"
                      >
                        {r.descricao}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.encerradoEm ? (
                        "Encerrado"
                      ) : r.prazo ? (
                        <span
                          className={r.prazoVencido ? "text-nao-conforme" : ""}
                        >
                          {formatarData(r.prazo)}
                          {r.prazoVencido && " · vencido"}
                        </span>
                      ) : (
                        "—"
                      )}
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
