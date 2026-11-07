import { ChevronRight } from "@/components/icones";
import type { Metadata } from "next";
import Link from "next/link";
import type { DadosDoUsuario, Permissao } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { IconeDaTela } from "@/components/icones-do-menu";
import { chamarApi } from "@/lib/api";
import {
  painel,
  subtituloDaPagina,
  tituloDaPagina,
  tituloDaSecao,
} from "@/lib/estilos";

export const metadata: Metadata = { title: "Biblioteca do Auditor" };

/** Um recurso da biblioteca. Cada item mantém a própria rota e permissão (sem duplicar entidades). */
type Recurso = {
  rotulo: string;
  href: string;
  descricao: string;
  permissao: Permissao;
};

/** Recursos de apoio à auditoria: critérios, perguntas, evidências e modelos de NC. */
const RECURSOS: Recurso[] = [
  {
    rotulo: "Critérios e perguntas próprios",
    href: "/auditorias/minha-biblioteca",
    descricao:
      "Critérios de auditoria, perguntas de roteiro e evidências próprias da empresa.",
    permissao: "auditorias.ver",
  },
  {
    rotulo: "Evidências de referência",
    href: "/auditorias/biblioteca",
    descricao:
      "Biblioteca de evidências por requisito, para montar o roteiro e sustentar as constatações.",
    permissao: "auditorias.ver",
  },
  {
    rotulo: "Modelos de NC",
    href: "/auditorias/banco-de-ncs",
    descricao:
      "Banco de modelos de não conformidade por requisito, com causa raiz e ação sugerida.",
    permissao: "auditorias.ver",
  },
];

/** Documentação e apoio contextual. */
const DOCUMENTACAO: Recurso[] = [
  {
    rotulo: "Prompts de IA",
    href: "/auditorias/prompts",
    descricao:
      "Prompts prontos para apoiar a redação de constatações e análises durante a auditoria.",
    permissao: "auditorias.ver",
  },
  {
    rotulo: "Manual de auditorias",
    href: "/auditorias/manual",
    descricao: "Como conduzir a auditoria, do planejamento ao encerramento.",
    permissao: "auditorias.ver",
  },
];

function ListaDeRecursos({ itens }: { itens: Recurso[] }) {
  return (
    <ul className={`${painel} mt-3 divide-y divide-borda`}>
      {itens.map((i) => (
        <li key={i.href}>
          <Link
            href={i.href}
            className="flex items-center gap-4 px-5 py-4 hover:bg-campo"
          >
            <IconeDaTela href={i.href} />
            <span className="flex-1">
              <span className="block font-semibold text-texto">{i.rotulo}</span>
              <span className="block text-sm text-texto-2">{i.descricao}</span>
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
  );
}

/** Hub do auditor: reúne critérios, perguntas, evidências e modelos de NC, além da documentação. */
export default async function BibliotecaDoAuditor() {
  const eu = await chamarApi<DadosDoUsuario>("/auth/eu");
  const permissoes = eu.ok ? eu.dados.permissoes : [];
  const recursos = RECURSOS.filter((i) => permissoes.includes(i.permissao));
  const documentacao = DOCUMENTACAO.filter((i) =>
    permissoes.includes(i.permissao),
  );
  return (
    <>
      <h1 className={tituloDaPagina}>Biblioteca do Auditor</h1>
      <p className={subtituloDaPagina}>
        Critérios, perguntas, evidências e modelos de NC usados no planejamento e
        na execução das auditorias.
      </p>
      {!eu.ok ? (
        <div className="mt-6">
          <AvisoDeErro erro={eu.erro} />
        </div>
      ) : (
        <>
          <section className="mt-6">
            <h2 className={tituloDaSecao}>Recursos de auditoria</h2>
            <ListaDeRecursos itens={recursos} />
          </section>
          {documentacao.length > 0 && (
            <section className="mt-8">
              <h2 className={tituloDaSecao}>Ajuda e documentação</h2>
              <ListaDeRecursos itens={documentacao} />
            </section>
          )}
        </>
      )}
    </>
  );
}
