import type { Metadata } from "next";
import Link from "next/link";
import {
  TIPOS_DE_DESTINADOR,
  type DadosDoUsuario,
  type Destinador,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { EditarDestinador, NovoDestinador } from "./formularios";

export const metadata: Metadata = { title: "Transportadores e destinadores" };

/** Quem transporta e quem destina os resíduos, com a licença: a saída confere a validade na data. */
export default async function Destinadores({
  searchParams,
}: PageProps<"/ambiental/destinadores">) {
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Destinador[]>("/destinadores"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("ambiental.editar");
  return (
    <>
      <Link
        href="/ambiental/residuos"
        className="text-sm text-texto-2 hover:underline"
      >
        Resíduos
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>
        Transportadores e destinadores
      </h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        A empresa responde pelo resíduo até a destinação final (PNRS, Lei
        12.305). Na saída, o sistema recusa transportador ou destinador com a
        licença vencida na data. A licença que vence em até 60 dias aparece em
        destaque e no painel.
      </p>
      <Aviso
        avisos={{ criado: "Cadastrado.", salvo: "Salvo." }}
        chave={aviso}
      />
      {podeEditar && (
        <Recolhido titulo="Cadastrar transportador ou destinador">
          <NovoDestinador />
        </Recolhido>
      )}
      <section className={`${painel} mt-6`}>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : r.dados.length === 0 ? (
          <p className="px-5 py-6 text-base text-texto-2">Nenhum cadastro.</p>
        ) : (
          <ul className="divide-y divide-borda">
            {r.dados.map((d) => (
              <li key={d.id} className="px-5 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-base">
                    <span className="font-semibold">{d.nome}</span>{" "}
                    <span className="text-sm text-texto-2">
                      · {TIPOS_DE_DESTINADOR[d.tipo]}
                      {d.cnpj && ` · ${d.cnpj}`}
                    </span>
                  </p>
                  <span
                    className={`text-sm ${d.licencaVencida ? "font-semibold text-nao-conforme" : d.licencaVenceEmBreve ? "text-atencao" : "text-texto-2"}`}
                  >
                    {d.licencaNumero} ({d.licencaOrgao}) ·{" "}
                    {d.licencaVencida ? "vencida em" : "válida até"}{" "}
                    {formatarData(d.licencaValidade)}
                  </span>
                </div>
                {d.atividades && (
                  <p className="text-sm text-texto-2">{d.atividades}</p>
                )}
                {podeEditar && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-sm text-info">
                      Editar ou renovar a licença
                    </summary>
                    <div className="mt-2">
                      <EditarDestinador d={d} />
                    </div>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
