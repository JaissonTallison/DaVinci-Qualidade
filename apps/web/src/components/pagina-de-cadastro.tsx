import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Circle,
  CircleAlert,
  CircleCheck,
} from "@/components/icones";
import { Selo } from "@/components/selo";
import {
  cabecalhoDoPainel,
  painel,
  tituloDaPagina,
  tituloDoPainel,
} from "@/lib/estilos";

/**
 * Peças da tela de cadastro (interface.md §7.2): cabeçalho com voltar, uma seção por bloco,
 * coluna de resumo fixa ao rolar e barra de ações no rodapé.
 */

/** Botão de voltar quadrado, só com a seta (interface.md §7): leva à tela de origem. */
export function BotaoVoltar({
  href,
  rotulo,
}: {
  href: string;
  rotulo: string;
}) {
  const texto = `Voltar para ${rotulo}`;
  return (
    <Link
      href={href}
      aria-label={texto}
      title={texto}
      className="mt-0.5 inline-flex size-9 print:hidden shrink-0 items-center justify-center rounded-campo border border-borda-campo bg-superficie text-texto-2 shadow-cartao transition-colors hover:bg-campo hover:text-texto"
    >
      <ArrowLeft aria-hidden size={18} strokeWidth={1.75} />
    </Link>
  );
}

/**
 * Cabeçalho de tela interna (detalhe, ficha, subtelas): o botão de voltar à esquerda e, ao lado, o que a
 * tela já mostra no topo (número, situação, título, linha de dados), alinhado ao título.
 */
export function CabecalhoComVoltar({
  voltar,
  children,
}: {
  voltar: { href: string; rotulo: string };
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <BotaoVoltar href={voltar.href} rotulo={voltar.rotulo} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Título da página de cadastro com o botão de voltar à listagem de origem, à esquerda do título. */
export function CabecalhoDeCadastro({
  voltar,
  titulo,
  descricao,
}: {
  voltar: { href: string; rotulo: string };
  titulo: string;
  descricao?: string;
}) {
  return (
    <CabecalhoComVoltar voltar={voltar}>
      <h1 className={tituloDaPagina}>{titulo}</h1>
      {descricao && (
        <p className="mt-1 max-w-3xl text-base text-texto-2">{descricao}</p>
      )}
    </CabecalhoComVoltar>
  );
}

export type SituacaoDaSecao =
  | { tipo: "completa" }
  | { tipo: "pendente"; faltam: number }
  | { tipo: "opcional" };

function textoDaSituacao(s: SituacaoDaSecao): string {
  if (s.tipo === "completa") return "Completa";
  if (s.tipo === "opcional") return "Opcional";
  return s.faltam === 1
    ? "1 obrigatório pendente"
    : `${s.faltam} obrigatórios pendentes`;
}

/** Situação da seção em selo: completa em sucesso, pendente em atenção, opcional neutro. */
function SeloDaSecao({ situacao }: { situacao: SituacaoDaSecao }) {
  const tom =
    situacao.tipo === "completa"
      ? "sucesso"
      : situacao.tipo === "pendente"
        ? "atencao"
        : "neutro";
  return <Selo tom={tom}>{textoDaSituacao(situacao)}</Selo>;
}

/** Um bloco do formulário: título, para que serve, situação do preenchimento e os campos. */
export function SecaoDoCadastro({
  id,
  titulo,
  descricao,
  situacao,
  children,
}: {
  id: string;
  titulo: string;
  descricao?: string;
  situacao?: SituacaoDaSecao;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-bloco={titulo}
      aria-labelledby={`${id}-titulo`}
      className={`${painel} scroll-mt-20`}
    >
      <header className={`${cabecalhoDoPainel} justify-between`}>
        <div className="min-w-0">
          <h2 id={`${id}-titulo`} className={tituloDoPainel}>
            {titulo}
          </h2>
          {descricao && <p className="text-sm text-texto-2">{descricao}</p>}
        </div>
        {situacao && <SeloDaSecao situacao={situacao} />}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Coluna à direita: resumo do registro e andamento do preenchimento, com atalho para cada seção. */
export function ColunaDeResumo({
  itens,
  obrigatorios,
  secoes,
}: {
  itens: { rotulo: string; valor: ReactNode }[];
  obrigatorios: { feitos: number; total: number };
  secoes: { id: string; titulo: string; situacao: SituacaoDaSecao }[];
}) {
  const pct = obrigatorios.total
    ? Math.round((100 * obrigatorios.feitos) / obrigatorios.total)
    : 100;
  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
      <section className={painel} aria-labelledby="resumo-titulo">
        <h2
          id="resumo-titulo"
          className="border-b border-borda px-4 py-3 text-md font-semibold text-texto"
        >
          Resumo
        </h2>
        <dl className="flex flex-col gap-3 px-4 py-3.5 text-sm">
          {itens.map((i) => (
            <div
              key={i.rotulo}
              className="flex items-center justify-between gap-3"
            >
              <dt className="text-texto-2">{i.rotulo}</dt>
              <dd className="min-w-0 truncate text-right font-semibold text-texto">
                {i.valor}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section className={painel} aria-labelledby="preenchimento-titulo">
        <h2
          id="preenchimento-titulo"
          className="border-b border-borda px-4 py-3 text-md font-semibold text-texto"
        >
          Preenchimento
        </h2>
        <div className="px-4 py-3.5">
          <p
            className={`text-sm ${pct >= 100 ? "font-semibold text-conforme" : "text-texto"}`}
          >
            {obrigatorios.feitos} de {obrigatorios.total} obrigatórios · {pct}%
          </p>
          <ul className="-mx-2 mt-2 flex flex-col">
            {secoes.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm text-texto hover:bg-superficie-2"
                >
                  {s.situacao.tipo === "completa" ? (
                    <CircleCheck
                      aria-hidden
                      size={16}
                      strokeWidth={1.75}
                      className="shrink-0 text-conforme"
                    />
                  ) : s.situacao.tipo === "pendente" ? (
                    <CircleAlert
                      aria-hidden
                      size={16}
                      strokeWidth={1.75}
                      className="shrink-0 text-atencao"
                    />
                  ) : (
                    <Circle
                      aria-hidden
                      size={16}
                      strokeWidth={1.75}
                      className="shrink-0 text-texto-3"
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate">{s.titulo}</span>
                  {s.situacao.tipo !== "completa" && (
                    <span className="text-xs text-texto-3">
                      {s.situacao.tipo === "pendente" ? "Pendente" : "Opcional"}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </aside>
  );
}

/**
 * Ações do cadastro, fixas no rodapé no computador e no tablet (no celular ficam no fim da página,
 * acima da barra inferior). À esquerda, a situação; à direita, Cancelar e a ação primária por último.
 */
export function BarraDeAcoes({
  situacao,
  children,
}: {
  situacao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-borda bg-superficie px-4 py-3 shadow-cartao sm:-mx-6 sm:px-6 md:sticky md:bottom-0 md:z-10 xl:-mx-8 xl:px-8">
      {situacao && <p className="mr-auto text-sm text-texto-2">{situacao}</p>}
      <div className="ml-auto flex items-center gap-3">{children}</div>
    </div>
  );
}
