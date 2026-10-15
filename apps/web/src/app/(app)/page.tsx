import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DadosDoUsuario, ResumoNcs, ResumoPlanos } from "@davinci/types";
import { FaixaDeIndicadores } from "@/components/faixa-de-indicadores";
import { chamarApi } from "@/lib/api";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";

export const metadata: Metadata = { title: "Início" };

export default async function Inicio() {
  const eu = await chamarApi<DadosDoUsuario>("/auth/eu");
  const veQualidade = eu.ok && eu.dados.permissoes.includes("qualidade.ver");
  const [ncs, planos] = veQualidade
    ? await Promise.all([
        chamarApi<ResumoNcs>("/nao-conformidades/resumo"),
        chamarApi<ResumoPlanos>("/planos-de-acao/resumo"),
      ])
    : [null, null];
  return (
    <>
      <h1 className={tituloDaPagina}>Início</h1>
      {ncs?.ok && (
        <Quadro titulo="Não conformidades" href="/qualidade/nao-conformidades">
          <FaixaDeIndicadores
            itens={[
              {
                rotulo: "Em aberto",
                valor: ncs.dados.abertas,
                href: "/qualidade/nao-conformidades",
              },
              {
                rotulo: "Vencidas",
                valor: ncs.dados.vencidas,
                alerta: ncs.dados.vencidas > 0,
                href: "/qualidade/nao-conformidades?vencidas=true",
              },
              {
                rotulo: "Altas e críticas em aberto",
                valor: ncs.dados.graves,
                alerta: ncs.dados.graves > 0,
              },
            ]}
          />
        </Quadro>
      )}
      {planos?.ok && (
        <Quadro titulo="Planos de ação" href="/qualidade/planos-de-acao">
          <FaixaDeIndicadores
            itens={[
              {
                rotulo: "Em execução",
                valor: planos.dados.emExecucao,
                href: "/qualidade/planos-de-acao?status=em_execucao",
              },
              {
                rotulo: "Com tarefa vencida",
                valor: planos.dados.atrasados,
                alerta: planos.dados.atrasados > 0,
                href: "/qualidade/planos-de-acao?atrasados=true",
              },
              {
                rotulo: "Aguardando eficácia",
                valor: planos.dados.aguardandoEficacia,
                href: "/qualidade/planos-de-acao?status=aguardando_eficacia",
              },
            ]}
          />
        </Quadro>
      )}
      {!veQualidade && (
        <p className="mt-4 text-base text-texto-2">
          Nenhum módulo liberado para o seu perfil. Fale com o administrador da
          sua empresa.
        </p>
      )}
    </>
  );
}

function Quadro({
  titulo,
  href,
  children,
}: {
  titulo: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <section className={`${painel} mt-6`}>
      <div className="flex items-baseline justify-between border-b border-borda px-5 py-3">
        <h2 className={tituloDaSecao}>{titulo}</h2>
        <Link
          href={href}
          className="text-sm font-semibold text-info hover:underline"
        >
          Ver todos
        </Link>
      </div>
      {children}
    </section>
  );
}
