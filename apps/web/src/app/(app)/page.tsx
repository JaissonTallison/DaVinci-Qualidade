import type { Metadata } from "next";
import Link from "next/link";
import type { DadosDoUsuario, ResumoNcs } from "@davinci/types";
import { FaixaDeIndicadores } from "@/components/faixa-de-indicadores";
import { chamarApi } from "@/lib/api";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";

export const metadata: Metadata = { title: "Início" };

export default async function Inicio() {
  const eu = await chamarApi<DadosDoUsuario>("/auth/eu");
  const veNcs = eu.ok && eu.dados.permissoes.includes("qualidade.ver");
  const resumo = veNcs
    ? await chamarApi<ResumoNcs>("/nao-conformidades/resumo")
    : null;
  return (
    <>
      <h1 className={tituloDaPagina}>Início</h1>
      {resumo?.ok && (
        <section className={`${painel} mt-6`}>
          <div className="flex items-baseline justify-between border-b border-borda px-5 py-3">
            <h2 className={tituloDaSecao}>Não conformidades</h2>
            <Link
              href="/qualidade/nao-conformidades"
              className="text-sm font-semibold text-info hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <FaixaDeIndicadores
            itens={[
              {
                rotulo: "Em aberto",
                valor: resumo.dados.abertas,
                href: "/qualidade/nao-conformidades",
              },
              {
                rotulo: "Vencidas",
                valor: resumo.dados.vencidas,
                alerta: resumo.dados.vencidas > 0,
                href: "/qualidade/nao-conformidades?vencidas=true",
              },
              {
                rotulo: "Altas e críticas em aberto",
                valor: resumo.dados.graves,
                alerta: resumo.dados.graves > 0,
              },
            ]}
          />
        </section>
      )}
      {!veNcs && (
        <p className="mt-4 text-base text-texto-2">
          Nenhum módulo liberado para o seu perfil. Fale com o administrador da
          sua empresa.
        </p>
      )}
    </>
  );
}
