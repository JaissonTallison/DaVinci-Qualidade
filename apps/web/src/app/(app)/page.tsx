import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import type {
  DadosDoUsuario,
  ResumoAuditorias,
  ResumoCalibracao,
  ResumoInspecoes,
  ResumoNcs,
  ResumoPlanos,
} from "@davinci/types";
import { FaixaDeIndicadores } from "@/components/faixa-de-indicadores";
import { chamarApi } from "@/lib/api";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";

export const metadata: Metadata = { title: "Início" };

export default async function Inicio() {
  const eu = await chamarApi<DadosDoUsuario>("/auth/eu");
  const veQualidade = eu.ok && eu.dados.permissoes.includes("qualidade.ver");
  const [ncs, planos, inspecoes, calibracao] = veQualidade
    ? await Promise.all([
        chamarApi<ResumoNcs>("/nao-conformidades/resumo"),
        chamarApi<ResumoPlanos>("/planos-de-acao/resumo"),
        chamarApi<ResumoInspecoes>("/inspecoes/resumo"),
        chamarApi<ResumoCalibracao>("/instrumentos/resumo"),
      ])
    : [null, null, null, null];
  const veAuditorias = eu.ok && eu.dados.permissoes.includes("auditorias.ver");
  const auditorias = veAuditorias
    ? await chamarApi<ResumoAuditorias>("/auditorias/resumo")
    : null;
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
      {inspecoes?.ok && (
        <Quadro titulo="Inspeções" href="/qualidade/inspecoes">
          <FaixaDeIndicadores
            itens={[
              {
                rotulo: "Em andamento",
                valor: inspecoes.dados.emAndamento,
                href: "/qualidade/inspecoes?status=em_andamento",
              },
              {
                rotulo: "Reprovadas nos últimos 30 dias",
                valor: inspecoes.dados.reprovadas30Dias,
                alerta: inspecoes.dados.reprovadas30Dias > 0,
                href: "/qualidade/inspecoes?status=reprovada",
              },
              {
                rotulo: "Aprovação nos últimos 30 dias (%)",
                valor: inspecoes.dados.taxaDeAprovacao30Dias ?? 0,
              },
            ]}
          />
        </Quadro>
      )}
      {calibracao?.ok && (
        <Quadro titulo="Calibração" href="/qualidade/calibracao">
          <FaixaDeIndicadores
            itens={[
              {
                rotulo: "Vencidos",
                valor: calibracao.dados.vencidos,
                alerta: calibracao.dados.vencidos > 0,
                href: "/qualidade/calibracao?situacao=vencido",
              },
              {
                rotulo: "Reprovados",
                valor: calibracao.dados.reprovados,
                alerta: calibracao.dados.reprovados > 0,
                href: "/qualidade/calibracao?situacao=reprovado",
              },
              {
                rotulo: "Vencem em até 30 dias",
                valor: calibracao.dados.vencemEmBreve,
                href: "/qualidade/calibracao?situacao=vence_em_breve",
              },
            ]}
          />
        </Quadro>
      )}
      {auditorias?.ok && (
        <Quadro titulo="Auditorias" href="/auditorias">
          <FaixaDeIndicadores
            itens={[
              {
                rotulo: "Planejadas",
                valor: auditorias.dados.planejadas,
                href: "/auditorias?status=planejada",
              },
              {
                rotulo: "Em andamento",
                valor: auditorias.dados.emAndamento,
                href: "/auditorias?status=em_andamento",
              },
              {
                rotulo: "NCs em auditorias dos últimos 12 meses",
                valor: auditorias.dados.ncsUltimos12Meses,
              },
            ]}
          />
        </Quadro>
      )}
      {!veQualidade && !veAuditorias && (
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
