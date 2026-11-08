import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "@/components/icones";
import {
  estiloDoBotao,
  type TamanhoDoBotao,
  type VarianteDoBotao,
} from "@/lib/estilos";

/**
 * Botão padrão do sistema (interface.md §8). Variante diz o peso da ação; tamanho diz onde ele está:
 * grande (40 px) no cabeçalho da página e na barra do cadastro, médio (36 px) no corpo, pequeno (30 px)
 * em card e tabela. Ícone só com sentido fixo (Plus cria, Pencil edita, Trash2 exclui…), nunca o do menu.
 * Com `href` vira link com a mesma cara; com `href` e `download`, âncora de arquivo.
 */
type Comum = {
  variante?: VarianteDoBotao;
  tamanho?: TamanhoDoBotao;
  /** Ícone à esquerda do texto. */
  icone?: LucideIcon;
  /** Ícone à direita: só seta de avançar (ArrowRight) e abrir menu (ChevronDown). */
  iconeDireita?: LucideIcon;
  className?: string;
  children: ReactNode;
};

type ComoBotao = Comum &
  Omit<ComponentProps<"button">, "className" | "children"> & {
    href?: undefined;
    /** Ação em andamento: troca o texto e trava o botão (sem animação). */
    carregando?: boolean;
    /** Texto durante o carregamento ("Salvando…"); padrão: o próprio texto. */
    textoCarregando?: string;
    /** Por que está desabilitado (aparece ao passar o mouse). */
    motivo?: string;
  };

type ComoLink = Comum &
  Omit<ComponentProps<typeof Link>, "className" | "children">;

function Conteudo({
  icone: Icone,
  iconeDireita: IconeDireita,
  tamanho,
  carregando,
  children,
}: {
  icone?: LucideIcon;
  iconeDireita?: LucideIcon;
  tamanho: TamanhoDoBotao;
  carregando?: boolean;
  children: ReactNode;
}) {
  const tam = tamanho === "pequeno" ? 14 : 16;
  return (
    <>
      {/* Carregando: sem giro (o sistema não anima); o texto muda ("Salvando…") e o ícone sai. */}
      {!carregando && Icone && (
        <Icone aria-hidden size={tam} strokeWidth={1.75} />
      )}
      {children}
      {IconeDireita && (
        <IconeDireita
          aria-hidden
          size={tam}
          strokeWidth={1.75}
          className="-mr-0.5"
        />
      )}
    </>
  );
}

export function Botao({
  variante = "secundario",
  tamanho = "medio",
  icone,
  iconeDireita,
  className = "",
  children,
  ...resto
}: ComoBotao | ComoLink) {
  const classe = `${estiloDoBotao(variante, tamanho)} ${className}`.trim();
  if (resto.href !== undefined) {
    const link = resto as Omit<ComoLink, keyof Comum>;
    const conteudo = (
      <Conteudo icone={icone} iconeDireita={iconeDireita} tamanho={tamanho}>
        {children}
      </Conteudo>
    );
    // Arquivo para baixar (CSV) ou endereço de fora (e-mail, WhatsApp): âncora comum, sem prefetch do Next.
    const href = String(link.href);
    if (link.download !== undefined || /^(https?:|mailto:|tel:)/.test(href))
      return (
        <a
          href={href}
          download={link.download}
          target={link.target}
          rel={link.rel}
          className={classe}
        >
          {conteudo}
        </a>
      );
    return (
      <Link {...link} className={classe}>
        {conteudo}
      </Link>
    );
  }
  const {
    carregando = false,
    textoCarregando,
    motivo,
    type = "button",
    disabled,
    title,
    ...botao
  } = resto as Omit<ComoBotao, keyof Comum>;
  return (
    <button
      {...botao}
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      title={title ?? (disabled ? motivo : undefined)}
      className={classe}
    >
      <Conteudo
        icone={icone}
        iconeDireita={iconeDireita}
        tamanho={tamanho}
        carregando={carregando}
      >
        {carregando && textoCarregando ? textoCarregando : children}
      </Conteudo>
    </button>
  );
}

/** Botão só com ícone: quadrado, com o rótulo para leitor de tela e no `title`. Com `href`, link. */
export function BotaoIcone({
  rotulo,
  icone: Icone,
  variante = "fantasma",
  tamanho = "medio",
  className = "",
  href,
  ...resto
}: Omit<ComponentProps<"button">, "children" | "className"> & {
  rotulo: string;
  icone: LucideIcon;
  variante?: "secundario" | "fantasma" | "perigo";
  tamanho?: TamanhoDoBotao;
  className?: string;
  /** Vira link (ex.: ano anterior e seguinte). */
  href?: string;
}) {
  const classe =
    `${estiloDoBotao(variante, tamanho, true)} ${className}`.trim();
  const icone = (
    <Icone
      aria-hidden
      size={tamanho === "pequeno" ? 14 : 16}
      strokeWidth={1.75}
    />
  );
  if (href)
    return (
      <Link href={href} aria-label={rotulo} title={rotulo} className={classe}>
        {icone}
      </Link>
    );
  return (
    <button
      type="button"
      {...resto}
      aria-label={rotulo}
      title={rotulo}
      className={classe}
    >
      {icone}
    </button>
  );
}
