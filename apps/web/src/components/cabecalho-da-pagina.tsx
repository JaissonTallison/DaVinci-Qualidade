import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "@/components/icones";
import { sobretitulo, subtituloDaPagina, tituloDaPagina } from "@/lib/estilos";

/**
 * Cabeçalho de página (interface.md §7): uma faixa branca de ponta a ponta, logo abaixo da barra superior,
 * igual em todas as telas. De cima para baixo: identificação do registro (número e status), título com o
 * voltar à esquerda e as ações à direita, a descrição e, por fim, a régua: os números e dados que resumem
 * a tela, rotulados e separados por divisórias. Abas, quando há, encostam na linha de baixo da faixa.
 */

/** Um item da régua. Número vira valor grande (18 px); texto fica em 14 px. */
export type ItemDaRegua = {
  rotulo: string;
  valor: ReactNode;
  /** Cor do valor quando pede ação (perigo), atenção ou está resolvido. */
  tom?: "perigo" | "atencao" | "sucesso";
  /** O valor leva à lista filtrada. */
  href?: string;
  /** Linha pequena embaixo do valor ("nos últimos 30 dias"). */
  detalhe?: string;
};

const COR: Record<NonNullable<ItemDaRegua["tom"]>, string> = {
  perigo: "text-nao-conforme-texto",
  atencao: "text-atencao-texto",
  sucesso: "text-conforme-texto",
};

/** Botão de voltar quadrado, só com a seta: leva à tela de origem. */
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
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-campo border border-borda-campo bg-superficie text-texto-2 shadow-xs transition-colors hover:border-borda-forte hover:bg-superficie-2 hover:text-texto print:hidden"
    >
      <ArrowLeft aria-hidden size={18} strokeWidth={1.75} />
    </Link>
  );
}

/** A régua: dados da tela lado a lado, rótulo em caixa alta em cima e o valor embaixo. */
export function Regua({ itens }: { itens: ItemDaRegua[] }) {
  if (itens.length === 0) return null;
  return (
    <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-borda py-4 sm:flex sm:flex-wrap sm:gap-x-0">
      {itens.map((i) => {
        const numero =
          typeof i.valor === "number" ||
          (typeof i.valor === "string" && /^[\d.,]+\s?%?$/.test(i.valor));
        const classe = `${numero ? "text-xl font-semibold tabular-nums" : "text-base font-medium"} ${i.tom ? COR[i.tom] : "text-texto"}`;
        return (
          <div
            key={i.rotulo}
            className="min-w-0 sm:border-l sm:border-borda sm:px-6 sm:first:border-l-0 sm:first:pl-0"
          >
            <dt className={sobretitulo}>{i.rotulo}</dt>
            <dd className={`mt-1 ${classe}`}>
              {i.href ? (
                <Link
                  href={i.href}
                  className="underline-offset-2 hover:underline"
                >
                  {i.valor}
                </Link>
              ) : (
                i.valor
              )}
            </dd>
            {i.detalhe && (
              <dd className="mt-0.5 text-xs text-texto-2">{i.detalhe}</dd>
            )}
          </div>
        );
      })}
    </dl>
  );
}

/**
 * A faixa em si: fundo branco de ponta a ponta (desfaz o recuo do conteúdo), linha de baixo e o espaço
 * da régua e das abas. Use `CabecalhoDaPagina`; a faixa sozinha é para telas com cabeçalho próprio.
 */
export function FaixaDaPagina({
  children,
  regua,
  abas,
}: {
  children: ReactNode;
  regua?: ItemDaRegua[];
  abas?: ReactNode;
}) {
  const temRegua = Boolean(regua?.length);
  return (
    <div
      className={`-mx-4 -mt-6 border-b border-borda bg-superficie px-4 pt-5 sm:-mx-6 sm:px-6 xl:-mx-8 xl:px-8 print:mx-0 print:mt-0 print:border-0 print:px-0 ${abas || temRegua ? "" : "pb-5"}`}
    >
      {children}
      {regua && <Regua itens={regua} />}
      {abas && <div className={temRegua ? "" : "mt-4"}>{abas}</div>}
    </div>
  );
}

/** Cabeçalho padrão de toda página do sistema. */
export function CabecalhoDaPagina({
  voltar,
  identificacao,
  titulo,
  selo,
  descricao,
  acoes,
  regua,
  abas,
  children,
}: {
  /** Telas internas: o botão quadrado à esquerda do título. */
  voltar?: { href: string; rotulo: string };
  /** Linha acima do título: número do registro em mono e o status. */
  identificacao?: ReactNode;
  titulo: ReactNode;
  /** Selo ao lado do título (status de uma ficha sem número). */
  selo?: ReactNode;
  /** Para que serve a tela, em uma frase. */
  descricao?: ReactNode;
  /** Botões à direita; o primário por último. */
  acoes?: ReactNode;
  regua?: ItemDaRegua[];
  abas?: ReactNode;
  /** Conteúdo extra abaixo da descrição (aviso curto, link de apoio). */
  children?: ReactNode;
}) {
  return (
    <FaixaDaPagina regua={regua} abas={abas}>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        {voltar && <BotaoVoltar href={voltar.href} rotulo={voltar.rotulo} />}
        <div className="min-w-0 flex-1 basis-80">
          {identificacao && (
            <div className="mb-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-texto-2">
              {identificacao}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className={tituloDaPagina}>{titulo}</h1>
            {selo}
          </div>
          {descricao && (
            <p className={`${subtituloDaPagina} max-w-3xl`}>{descricao}</p>
          )}
          {children}
        </div>
        {acoes && (
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {acoes}
          </div>
        )}
      </div>
    </FaixaDaPagina>
  );
}

/**
 * Cabeçalho de tela interna com estrutura própria (detalhes antigos): a mesma faixa, com o voltar à
 * esquerda e o conteúdo da tela ao lado. Tela nova usa `CabecalhoDaPagina`.
 */
export function CabecalhoComVoltar({
  voltar,
  regua,
  abas,
  children,
}: {
  voltar: { href: string; rotulo: string };
  regua?: ItemDaRegua[];
  abas?: ReactNode;
  children: ReactNode;
}) {
  return (
    <FaixaDaPagina regua={regua} abas={abas}>
      <div className="flex items-start gap-4">
        <BotaoVoltar href={voltar.href} rotulo={voltar.rotulo} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </FaixaDaPagina>
  );
}

/** Cabeçalho da página de cadastro: voltar, título e a frase do que se cadastra. */
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
    <CabecalhoDaPagina voltar={voltar} titulo={titulo} descricao={descricao} />
  );
}
