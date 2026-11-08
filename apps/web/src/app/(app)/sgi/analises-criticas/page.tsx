import type { Metadata } from "next";
import Link from "next/link";
import type { AnaliseCritica, DadosDoUsuario, ResumoSgi } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel } from "@/lib/estilos";
import { Plus } from "@/components/icones";
import { Botao } from "@/components/botao";
import { CabecalhoDaPagina } from "@/components/cabecalho-da-pagina";

export const metadata: Metadata = { title: "Análises críticas" };

export default async function Analises() {
  const [lista, resumo, eu] = await Promise.all([
    chamarApi<AnaliseCritica[]>("/analises-criticas"),
    chamarApi<ResumoSgi>("/sgi/resumo"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeCriar = eu.ok && eu.dados.permissoes.includes("sgi.editar");
  return (
    <>
      <CabecalhoDaPagina
        titulo="Análises críticas pela direção"
        descricao="Análises críticas do sistema de gestão: o que foi analisado e o que foi decidido (ISO 9001, 9.3)."
        acoes={
          podeCriar && (
            <Botao
              href="/sgi/analises-criticas/nova"
              variante="primario"
              tamanho="grande"
              icone={Plus}
            >
              Registrar análise
            </Botao>
          )
        }
        regua={
          resumo.ok
            ? [
                {
                  rotulo: "Próxima prevista",
                  valor: resumo.dados.proximaAnaliseCritica
                    ? formatarData(resumo.dados.proximaAnaliseCritica)
                    : "Não registrada",
                  tom: resumo.dados.analiseCriticaAtrasada
                    ? "perigo"
                    : undefined,
                  detalhe: resumo.dados.analiseCriticaAtrasada
                    ? "atrasada"
                    : undefined,
                },
              ]
            : undefined
        }
      />
      <section className={`${painel} mt-6`}>
        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : lista.dados.length === 0 ? (
          <p className="px-4 py-8 text-base text-texto-2">
            Nenhuma análise registrada.
          </p>
        ) : (
          <ul className="divide-y divide-borda">
            {lista.dados.map((a) => (
              <li key={a.id} className="px-4 py-3">
                <Link
                  href={`/sgi/analises-criticas/${a.id}`}
                  className="font-medium text-info hover:underline"
                >
                  Reunião de {formatarData(a.data)}
                </Link>
                <p className="text-sm text-texto-2">{a.participantes}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
