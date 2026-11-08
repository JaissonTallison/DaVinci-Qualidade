import type { ReactNode } from "react";
import { Circle, CircleAlert, CircleCheck } from "@/components/icones";
import { Selo } from "@/components/selo";
import { cabecalhoDoPainel, painel, tituloDoPainel } from "@/lib/estilos";

/**
 * Peças da tela de cadastro (interface.md §7.2): cabeçalho com voltar, uma seção por bloco,
 * coluna de resumo fixa ao rolar e barra de ações no rodapé.
 */

export {
  BotaoVoltar,
  CabecalhoComVoltar,
  CabecalhoDeCadastro,
} from "@/components/cabecalho-da-pagina";

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
  acoes,
}: {
  itens: { rotulo: string; valor: ReactNode }[];
  obrigatorios: { feitos: number; total: number };
  secoes: { id: string; titulo: string; situacao: SituacaoDaSecao }[];
  /**
   * Botões do cadastro (Cancelar e o primário por último). No computador ficam num card próprio no pé da
   * coluna, preso ao pé da tela ao rolar e alinhado à base do formulário no fim; abaixo de 1024 px, na barra
   * de ações (`BarraDeAcoes` com `soAbaixoDoComputador`).
   */
  acoes?: ReactNode;
}) {
  const pct = obrigatorios.total
    ? Math.round((100 * obrigatorios.feitos) / obrigatorios.total)
    : 100;
  const faltam = obrigatorios.total - obrigatorios.feitos;
  return (
    <aside className="flex flex-col gap-4 lg:self-stretch">
      <div className="flex flex-col gap-4 tela-alta:sticky tela-alta:top-20">
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
              {obrigatorios.feitos} de {obrigatorios.total} obrigatórios · {pct}
              %
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
                        {s.situacao.tipo === "pendente"
                          ? "Pendente"
                          : "Opcional"}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
      {acoes && (
        // Ações num card próprio no pé da coluna (que estica até a altura da grade): no fim da página a
        // base dele encosta na base do último bloco. Em tela alta, fica preso ao pé da tela ao rolar e o
        // resumo, ao topo; em tela baixa os dois rolam com a página, para um não cobrir o outro.
        <section
          aria-label="Ações do cadastro"
          className={`${painel} mt-auto hidden p-4 lg:block tela-alta:sticky tela-alta:bottom-6`}
        >
          <p
            className={`mb-3 text-sm ${faltam ? "text-texto-2" : "font-medium text-conforme-texto"}`}
          >
            {obrigatorios.total === 0
              ? "Sem campos obrigatórios"
              : faltam
                ? `${faltam} ${faltam === 1 ? "obrigatório pendente" : "obrigatórios pendentes"}`
                : "Obrigatórios preenchidos"}
          </p>
          <div className="flex flex-col-reverse gap-2 [&>*]:w-full">
            {acoes}
          </div>
        </section>
      )}
    </aside>
  );
}

/**
 * Ações do cadastro num card fixo: no tablet, preso ao pé da tela ao rolar; no celular, no fim da página
 * (acima da barra inferior). À esquerda, a situação; à direita, Cancelar e a ação primária por último.
 * Com `soAbaixoDoComputador`, some a partir de 1024 px, onde as ações ficam no card de preenchimento.
 */
export function BarraDeAcoes({
  situacao,
  soAbaixoDoComputador = false,
  children,
}: {
  situacao?: ReactNode;
  soAbaixoDoComputador?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`${painel} mt-6 flex flex-wrap items-center gap-3 px-4 py-3 md:sticky md:bottom-4 md:z-10 md:shadow-sm ${soAbaixoDoComputador ? "lg:hidden" : ""}`}
    >
      {situacao && <p className="mr-auto text-sm text-texto-2">{situacao}</p>}
      <div className="ml-auto flex items-center gap-3">{children}</div>
    </div>
  );
}
