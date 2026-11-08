"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BarraDeAcoes,
  ColunaDeResumo,
  SecaoDoCadastro,
  type SituacaoDaSecao,
} from "@/components/pagina-de-cadastro";
import { formatarData } from "@/lib/datas";

/**
 * Cadastro em blocos sem estado manual (interface.md §7.2). Os obrigatórios são os campos com `required`
 * (o formulário continua com `noValidate`; quem valida é o servidor): a situação de cada bloco, o
 * "x de y obrigatórios" e o resumo são lidos dos próprios campos a cada digitação. `minLength` conta como
 * mínimo para considerar o campo preenchido. Grupos de rádio e de caixa contam uma vez, pelo `name`.
 */

/** Um item da coluna de resumo: o rótulo e o `name` do campo de onde vem o valor. */
export type ItemDoResumo = { rotulo: string; campo: string; vazio?: string };

type LeituraDoBloco = {
  id: string;
  titulo: string;
  faltam: number;
  total: number;
};

const SituacoesDosBlocos = createContext<{
  situacoes: Record<string, SituacaoDaSecao>;
  embutido: boolean;
}>({ situacoes: {}, embutido: false });

function situacaoDoBloco(b: LeituraDoBloco): SituacaoDaSecao {
  if (b.total === 0) return { tipo: "opcional" };
  return b.faltam === 0
    ? { tipo: "completa" }
    : { tipo: "pendente", faltam: b.faltam };
}

type Controle = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function grupo(form: HTMLFormElement, nome: string): HTMLInputElement[] {
  return Array.from(form.elements).filter(
    (e): e is HTMLInputElement =>
      e instanceof HTMLInputElement && e.name === nome,
  );
}

function preenchido(el: Controle, form: HTMLFormElement): boolean {
  if (
    el instanceof HTMLInputElement &&
    (el.type === "radio" || el.type === "checkbox")
  )
    return grupo(form, el.name).some((i) => i.checked);
  if (el instanceof HTMLSelectElement) return el.value !== "";
  const minimo = el.minLength > 0 ? el.minLength : 1;
  return el.value.trim().length >= minimo;
}

/** Texto do rótulo de uma opção marcada (rádio ou caixa). */
function textoDoRotulo(i: HTMLInputElement): string {
  return (i.closest("label")?.textContent ?? i.value).trim();
}

/** Valor do campo como a pessoa o vê: texto da opção, data em dd/mm/aaaa, rótulos marcados. */
function valorVisivel(form: HTMLFormElement, nome: string): string {
  const itens = Array.from(form.elements).filter(
    (e): e is Controle =>
      (e instanceof HTMLInputElement ||
        e instanceof HTMLSelectElement ||
        e instanceof HTMLTextAreaElement) &&
      e.name === nome,
  );
  const primeiro = itens[0];
  if (!primeiro) return "";
  if (primeiro instanceof HTMLSelectElement)
    return primeiro.value
      ? (primeiro.selectedOptions[0]?.textContent ?? "").trim()
      : "";
  if (
    primeiro instanceof HTMLInputElement &&
    (primeiro.type === "radio" || primeiro.type === "checkbox")
  )
    return itens
      .filter((i): i is HTMLInputElement => i instanceof HTMLInputElement)
      .filter((i) => i.checked)
      .map(textoDoRotulo)
      .join(", ");
  if (primeiro instanceof HTMLInputElement && primeiro.type === "date")
    return primeiro.value ? formatarData(primeiro.value) : "";
  if (
    primeiro instanceof HTMLInputElement &&
    primeiro.type === "datetime-local"
  ) {
    const [dia, hora] = primeiro.value.split("T");
    return dia
      ? `${formatarData(dia)}${hora ? ` ${hora.slice(0, 5)}` : ""}`
      : "";
  }
  return primeiro.value.trim();
}

function ler(raiz: HTMLElement): {
  blocos: LeituraDoBloco[];
  valores: Record<string, string>;
} {
  const form = raiz.closest("form");
  if (!form) return { blocos: [], valores: {} };
  const blocos = Array.from(
    raiz.querySelectorAll<HTMLElement>("section[data-bloco]"),
  ).map((secao) => {
    const vistos = new Set<string>();
    let total = 0;
    let faltam = 0;
    secao
      .querySelectorAll<Controle>(
        "input[required], select[required], textarea[required]",
      )
      .forEach((el) => {
        if (el.disabled) return;
        if (
          el instanceof HTMLInputElement &&
          (el.type === "radio" || el.type === "checkbox")
        ) {
          if (vistos.has(el.name)) return;
          vistos.add(el.name);
        }
        total += 1;
        if (!preenchido(el, form)) faltam += 1;
      });
    return {
      id: secao.id,
      titulo: secao.dataset.bloco ?? secao.id,
      faltam,
      total,
    };
  });
  const valores: Record<string, string> = {};
  for (const el of Array.from(form.elements))
    if ("name" in el && typeof el.name === "string" && el.name)
      valores[el.name] ??= valorVisivel(form, el.name);
  return { blocos, valores };
}

/** Bloco de um cadastro montado com `CadastroEmBlocos`: a situação vem dos campos obrigatórios dele. */
export function Bloco({
  id,
  titulo,
  descricao,
  children,
}: {
  id: string;
  titulo: string;
  descricao?: string;
  children: ReactNode;
}) {
  const { situacoes, embutido } = useContext(SituacoesDosBlocos);
  // Edição dentro do detalhe: só os campos, sem o painel do bloco.
  if (embutido) return <>{children}</>;
  return (
    <SecaoDoCadastro
      id={id}
      titulo={titulo}
      descricao={descricao}
      situacao={situacoes[id]}
    >
      {children}
    </SecaoDoCadastro>
  );
}

/**
 * Corpo do cadastro dentro do `<form>`: blocos à esquerda e, à direita, a coluna de resumo com as ações no
 * fim do card de preenchimento (fixa ao rolar). Abaixo de 1024 px, as ações vão para a barra de ações.
 * `acoes` são os botões (Cancelar e a ação primária por último).
 */
export function CadastroEmBlocos({
  resumo,
  acoes,
  acoesEmbutido,
  embutido = false,
  children,
}: {
  resumo: ItemDoResumo[];
  acoes: ReactNode;
  /** Botões da edição embutida no detalhe (sem Cancelar); padrão: os mesmos de `acoes`. */
  acoesEmbutido?: ReactNode;
  /** Edição dentro do detalhe: campos empilhados e o botão embaixo, sem blocos nem resumo. */
  embutido?: boolean;
  children: ReactNode;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const [leitura, setLeitura] = useState<{
    blocos: LeituraDoBloco[];
    valores: Record<string, string>;
  }>({ blocos: [], valores: {} });
  const atualizar = useCallback(() => {
    if (raiz.current) setLeitura(ler(raiz.current));
  }, []);
  useEffect(() => {
    // Primeira leitura depois de montar: os valores iniciais (edição, retorno com erro) já estão nos campos.
    const quadro = requestAnimationFrame(atualizar);
    return () => cancelAnimationFrame(quadro);
  }, [atualizar]);

  const situacoes = Object.fromEntries(
    leitura.blocos.map((b) => [b.id, situacaoDoBloco(b)]),
  );
  const total = leitura.blocos.reduce((s, b) => s + b.total, 0);
  const faltam = leitura.blocos.reduce((s, b) => s + b.faltam, 0);
  const vazio = (texto = "Não informado") => (
    <span className="font-normal text-texto-3">{texto}</span>
  );

  if (embutido)
    return (
      <SituacoesDosBlocos.Provider value={{ situacoes: {}, embutido: true }}>
        <div className="flex flex-col gap-5">{children}</div>
        <div className="mt-5 flex justify-end gap-3">
          {acoesEmbutido ?? acoes}
        </div>
      </SituacoesDosBlocos.Provider>
    );

  return (
    <SituacoesDosBlocos.Provider value={{ situacoes, embutido: false }}>
      <div
        ref={raiz}
        onInput={atualizar}
        onChange={atualizar}
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"
      >
        <div className="flex min-w-0 flex-col gap-5">{children}</div>
        <ColunaDeResumo
          itens={resumo.map((r) => ({
            rotulo: r.rotulo,
            valor: leitura.valores[r.campo] || vazio(r.vazio),
          }))}
          obrigatorios={{ feitos: total - faltam, total }}
          secoes={leitura.blocos.map((b) => ({
            id: b.id,
            titulo: b.titulo,
            situacao: situacaoDoBloco(b),
          }))}
          acoes={acoes}
        />
      </div>
      <BarraDeAcoes
        soAbaixoDoComputador
        situacao={
          total === 0
            ? undefined
            : faltam
              ? `${faltam} ${faltam === 1 ? "campo obrigatório pendente" : "campos obrigatórios pendentes"}`
              : "Campos obrigatórios preenchidos"
        }
      >
        {acoes}
      </BarraDeAcoes>
    </SituacoesDosBlocos.Provider>
  );
}
