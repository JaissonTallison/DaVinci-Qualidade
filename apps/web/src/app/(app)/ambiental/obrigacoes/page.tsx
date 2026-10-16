import type { Metadata } from "next";
import {
  NOMES_DAS_PERIODICIDADES,
  SITUACOES_DA_OBRIGACAO,
  type DadosDoUsuario,
  type ObrigacaoLegal,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import {
  CumprirObrigacao,
  ExcluirObrigacao,
  NovaObrigacao,
} from "./formularios";

export const metadata: Metadata = { title: "Obrigações legais" };

const COR = {
  em_dia: "",
  vence_em_breve: "text-atencao",
  vencida: "font-semibold text-nao-conforme",
  cumprida: "text-conforme",
};

/** Calendário de entregas aos órgãos: cada entrega guarda o comprovante e agenda a próxima. */
export default async function Obrigacoes({
  searchParams,
}: PageProps<"/ambiental/obrigacoes">) {
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<ObrigacaoLegal[]>("/obrigacoes-legais"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const podeEditar = permissoes.includes("ambiental.editar");
  const hoje = hojeEmBrasilia();
  return (
    <>
      <h1 className={tituloDaPagina}>Obrigações legais</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        RAPP, TCFA, certificado do CTF, inventário de resíduos,
        automonitoramento, outorga: cada obrigação com o órgão, a periodicidade
        e o responsável. Registrar a entrega guarda o comprovante e agenda o
        próximo vencimento, que entra no painel.
      </p>
      <Aviso
        avisos={{
          criada: "Obrigação incluída no calendário.",
          cumprida: "Entrega registrada.",
        }}
        chave={aviso}
      />
      {podeEditar && (
        <Recolhido titulo="Nova obrigação">
          <NovaObrigacao />
        </Recolhido>
      )}
      <section className={`${painel} mt-6`}>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : r.dados.length === 0 ? (
          <p className="px-5 py-6 text-base text-texto-2">
            Nenhuma obrigação no calendário.
          </p>
        ) : (
          <ul className="divide-y divide-borda">
            {r.dados.map((o) => (
              <li key={o.id} className="px-5 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-base">
                    <span className="font-semibold">{o.nome}</span>{" "}
                    <span className="text-sm text-texto-2">
                      · {o.orgao} · {NOMES_DAS_PERIODICIDADES[o.periodicidade]}{" "}
                      · {o.responsavel}
                    </span>
                  </p>
                  <span className={`text-sm ${COR[o.situacao]}`}>
                    {SITUACOES_DA_OBRIGACAO[o.situacao]}
                    {o.proximoVencimento &&
                      ` · ${formatarData(o.proximoVencimento)}`}
                  </span>
                </div>
                {o.descricao && (
                  <p className="text-sm text-texto-2">{o.descricao}</p>
                )}
                {o.historico.length > 0 && (
                  <p className="mt-1 text-sm text-texto-2">
                    Última entrega: {formatarData(o.historico[0]!.data)} ·{" "}
                    {o.historico[0]!.comprovante}
                    {!o.historico[0]!.noPrazo && (
                      <span className="text-nao-conforme">
                        {" "}
                        · fora do prazo
                      </span>
                    )}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap items-start gap-4">
                  {podeEditar && o.proximoVencimento && (
                    <CumprirObrigacao o={o} hoje={hoje} />
                  )}
                  {permissoes.includes("ambiental.excluir") &&
                    o.historico.length === 0 && <ExcluirObrigacao id={o.id} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
