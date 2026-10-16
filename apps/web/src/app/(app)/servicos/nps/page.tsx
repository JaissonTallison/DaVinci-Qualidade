import type { Metadata } from "next";
import type {
  ConviteDePesquisa,
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
import { LinkDaPesquisa } from "@/components/link-da-pesquisa";
import { formatarMomento } from "@/lib/datas";
import { NovoConvite } from "./convites";
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
  const { aviso, convite } = (await searchParams) as {
    aviso?: string;
    convite?: string;
  };
  const [r, eu, clientes, convites] = await Promise.all([
    chamarApi<ResultadoNps>("/nps"),
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
      <h1 className={tituloDaPagina}>Satisfação do cliente (NPS)</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        “De 0 a 10, quanto você recomendaria nossos serviços?” Nota 9 e 10 são
        promotores; 0 a 6, detratores. NPS = % promotores − % detratores, nos
        últimos 12 meses.
      </p>
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
                  <thead className="bg-superficie-2 text-sm text-texto-2">
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
