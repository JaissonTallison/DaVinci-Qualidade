import { ChevronRight } from "@/components/icones";
import type { Metadata } from "next";
import Link from "next/link";
import type { DadosDoUsuario, Permissao } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { IconeDaTela } from "@/components/icones-do-menu";
import { chamarApi } from "@/lib/api";
import { painel, subtituloDaPagina, tituloDaPagina } from "@/lib/estilos";

export const metadata: Metadata = { title: "Configurações da qualidade" };

/** Telas de apoio/configuração do módulo Qualidade. Cada item mantém a própria rota e permissão. */
const ITENS: {
  rotulo: string;
  href: string;
  descricao: string;
  permissao: Permissao;
}[] = [
  {
    rotulo: "Modelos de inspeção",
    href: "/qualidade/modelos-de-inspecao",
    descricao:
      "Listas de itens que se repetem, copiadas para cada inspeção criada a partir do modelo.",
    permissao: "qualidade.ver",
  },
];

/** Área de configurações do módulo Qualidade: reúne as telas de apoio fora do fluxo do dia a dia. */
export default async function ConfiguracoesDaQualidade() {
  const eu = await chamarApi<DadosDoUsuario>("/auth/eu");
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const itens = ITENS.filter((i) => permissoes.includes(i.permissao));
  return (
    <>
      <h1 className={tituloDaPagina}>Configurações da qualidade</h1>
      <p className={subtituloDaPagina}>
        Telas de apoio do módulo Qualidade, fora do fluxo do dia a dia.
      </p>
      {!eu.ok ? (
        <div className="mt-6">
          <AvisoDeErro erro={eu.erro} />
        </div>
      ) : itens.length === 0 ? (
        <p className="mt-6 text-base text-texto-2">
          Você não tem acesso a nenhuma configuração da qualidade.
        </p>
      ) : (
        <ul className={`${painel} mt-6 divide-y divide-borda`}>
          {itens.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                className="flex items-center gap-4 px-5 py-4 hover:bg-campo"
              >
                <IconeDaTela href={i.href} />
                <span className="flex-1">
                  <span className="block font-semibold text-texto">
                    {i.rotulo}
                  </span>
                  <span className="block text-sm text-texto-2">
                    {i.descricao}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden
                  size={18}
                  strokeWidth={2}
                  className="text-texto-3"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
