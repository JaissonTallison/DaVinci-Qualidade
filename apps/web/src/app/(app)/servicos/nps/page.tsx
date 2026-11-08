import type { Metadata } from "next";
import Link from "next/link";
import type {
  ConviteDePesquisa,
  DadosDoUsuario,
  Pagina,
  ParceiroResumo,
  ResultadoSatisfacao,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { FaixaDeIndicadores } from "@/components/faixa-de-indicadores";
import { Recolhido } from "@/components/recolhido";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel } from "@/lib/estilos";
import { LinkDaPesquisa } from "@/components/link-da-pesquisa";
import { formatarMomento } from "@/lib/datas";
import { NovoConvite } from "./convites";
import { FormularioDeNps } from "./formulario";
import { CabecalhoDaPagina } from "@/components/cabecalho-da-pagina";

export const metadata: Metadata = {
  title: "Satisfação do cliente (ISC)",
};

export default async function Satisfacao({
  searchParams,
}: PageProps<"/servicos/nps">) {
  const { aviso, convite } = (await searchParams) as {
    aviso?: string;
    convite?: string;
  };
  const [r, eu, clientes, convites] = await Promise.all([
    chamarApi<ResultadoSatisfacao>("/nps"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
    chamarApi<Pagina<ParceiroResumo>>("/parceiros?papel=cliente&porPagina=100"),
    chamarApi<ConviteDePesquisa[]>("/pesquisas"),
  ]);
  const novo = convites.ok
    ? convites.dados.find((c) => c.id === convite)
    : undefined;
  const podeEditar = eu.ok && eu.dados.permissoes.includes("servicos.editar");
  return (
    <>
      <CabecalhoDaPagina
        titulo="Índice de Satisfação do Cliente (ISC)"
        descricao="Satisfação do cliente medida nos últimos 12 meses (ISO 9001, 9.1.2)."
      />
      <Recolhido fixo titulo="Como funciona o ISC">
        <p className="max-w-2xl text-base text-texto-2">
          O cliente dá uma nota de 0 a 10 ao serviço. O Índice de Satisfação do
          Cliente (ISC) é a média dessas notas convertida para percentual (média
          × 10). A meta é de pelo menos 80%; abaixo disso, abra uma ação
          corretiva.
        </p>
      </Recolhido>
      <Aviso avisos={{ registrada: "Resposta registrada." }} chave={aviso} />
      {novo && <LinkDaPesquisa convite={novo} />}
      {podeEditar && clientes.ok && (
        <Recolhido titulo="Enviar pesquisa por link">
          <p className="mb-3 text-base text-texto-2">
            O cliente responde pelo link, sem login, em até 30 dias. A resposta
            entra aqui sozinha.
          </p>
          <NovoConvite clientes={clientes.dados.itens} />
          {convites.ok && convites.dados.length > 0 && (
            <ul className="mt-4 divide-y divide-borda border-t border-borda text-sm">
              {convites.dados.slice(0, 15).map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap justify-between gap-2 py-1.5"
                >
                  <span>
                    {c.clienteNome}
                    {c.osNumero && (
                      <span className="font-mono text-texto-2">
                        {" "}
                        · {c.osNumero}
                      </span>
                    )}
                  </span>
                  <span
                    className={
                      c.respondidoEm ? "text-conforme" : "text-texto-2"
                    }
                  >
                    {c.respondidoEm
                      ? `Respondida em ${formatarMomento(c.respondidoEm)}`
                      : `Aguardando · vale até ${formatarData(c.expiraEm)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Recolhido>
      )}
      {podeEditar && clientes.ok && (
        <Recolhido titulo="Registrar resposta">
          <FormularioDeNps clientes={clientes.dados.itens} />
        </Recolhido>
      )}
      {!r.ok ? (
        <div className="mt-6">
          <AvisoDeErro erro={r.erro} />
        </div>
      ) : (
        <>
          <div className="mt-6">
            <FaixaDeIndicadores
              itens={[
                {
                  rotulo: "Satisfação (ISC)",
                  valor: r.dados.indice === null ? null : `${r.dados.indice}%`,
                  alerta: r.dados.total > 0 && !r.dados.atingiu,
                },
                { rotulo: "Meta", valor: `≥ ${r.dados.meta}%` },
                {
                  rotulo: "Status",
                  valor:
                    r.dados.total === 0
                      ? "—"
                      : r.dados.atingiu
                        ? "Atingido"
                        : "Não atingido",
                  alerta: r.dados.total > 0 && !r.dados.atingiu,
                },
                { rotulo: "Respostas (12 meses)", valor: r.dados.total },
              ]}
            />
          </div>
          {r.dados.total > 0 && !r.dados.atingiu && (
            <p className="mt-3 text-sm text-nao-conforme">
              ISC abaixo da meta de {r.dados.meta}%.{" "}
              <Link
                href="/qualidade/planos-de-acao"
                className="font-medium underline"
              >
                Registre uma ação corretiva
              </Link>
              .
            </p>
          )}
          {r.dados.evolucao.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-sm font-semibold text-texto-2">
                Evolução por trimestre
              </h2>
              <FaixaDeIndicadores
                itens={r.dados.evolucao.map((p) => ({
                  rotulo: p.rotulo,
                  valor: p.indice === null ? null : `${p.indice}%`,
                  alerta: p.indice !== null && p.indice < r.dados.meta,
                }))}
              />
            </section>
          )}
          <section className={`${painel} mt-6`}>
            {r.dados.respostas.length === 0 ? (
              <p className="px-4 py-8 text-base text-texto-2">
                Nenhuma resposta nos últimos 12 meses.
              </p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-superficie-2 text-xs uppercase tracking-[0.04em] text-texto-2">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Data</th>
                      <th className="px-4 py-2.5 font-semibold">Cliente</th>
                      <th className="px-4 py-2.5 font-semibold">Nota</th>
                      <th className="px-4 py-2.5 font-semibold">Comentário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borda">
                    {r.dados.respostas.map((x) => (
                      <tr key={x.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatarData(x.data)}
                        </td>
                        <td className="px-4 py-3">{x.clienteNome}</td>
                        <td
                          className={`px-4 py-2 tabular-nums ${x.nota <= 6 ? "text-nao-conforme" : x.nota >= 9 ? "text-conforme" : ""}`}
                        >
                          {x.nota}
                        </td>
                        <td className="max-w-md px-4 py-3 text-texto-2">
                          {x.comentario}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
