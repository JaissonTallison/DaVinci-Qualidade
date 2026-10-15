import type { Metadata } from "next";
import type {
  DadosDoUsuario,
  Pagina,
  ParceiroResumo,
  ResultadoNps,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { FaixaDeIndicadores } from "@/components/faixa-de-indicadores";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { FormularioDeNps } from "./formulario";

export const metadata: Metadata = { title: "Satisfação do cliente (NPS)" };
const CATEGORIA = {
  promotor: "Promotor",
  neutro: "Neutro",
  detrator: "Detrator",
};

export default async function Nps({
  searchParams,
}: PageProps<"/servicos/nps">) {
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu, clientes] = await Promise.all([
    chamarApi<ResultadoNps>("/nps"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
    chamarApi<Pagina<ParceiroResumo>>("/parceiros?papel=cliente&porPagina=100"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("servicos.editar");
  return (
    <>
      <h1 className={tituloDaPagina}>Satisfação do cliente (NPS)</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        “De 0 a 10, quanto você recomendaria nossos serviços?” Nota 9 e 10 são
        promotores; 0 a 6, detratores. NPS = % promotores − % detratores, nos
        últimos 12 meses.
      </p>
      <Aviso avisos={{ registrada: "Resposta registrada." }} chave={aviso} />
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
                  rotulo: "NPS (12 meses)",
                  valor: r.dados.nps,
                  alerta: r.dados.nps !== null && r.dados.nps < 0,
                },
                { rotulo: "Promotores", valor: r.dados.promotores },
                { rotulo: "Neutros", valor: r.dados.neutros },
                {
                  rotulo: "Detratores",
                  valor: r.dados.detratores,
                  alerta: r.dados.detratores > 0,
                },
              ]}
            />
          </div>
          <section className={`${painel} mt-6`}>
            {r.dados.respostas.length === 0 ? (
              <p className="px-4 py-8 text-base text-texto-2">
                Nenhuma resposta nos últimos 12 meses.
              </p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-superficie-2 text-xs text-texto-2">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Data</th>
                      <th className="px-4 py-2 font-semibold">Cliente</th>
                      <th className="px-4 py-2 font-semibold">Nota</th>
                      <th className="px-4 py-2 font-semibold">Categoria</th>
                      <th className="px-4 py-2 font-semibold">Comentário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borda">
                    {r.dados.respostas.map((x) => (
                      <tr key={x.id}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {formatarData(x.data)}
                        </td>
                        <td className="px-4 py-2">{x.clienteNome}</td>
                        <td className="px-4 py-2 tabular-nums">{x.nota}</td>
                        <td
                          className={`px-4 py-2 ${x.categoria === "detrator" ? "text-nao-conforme" : x.categoria === "promotor" ? "text-conforme" : "text-texto-2"}`}
                        >
                          {CATEGORIA[x.categoria]}
                        </td>
                        <td className="max-w-md px-4 py-2 text-texto-2">
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
