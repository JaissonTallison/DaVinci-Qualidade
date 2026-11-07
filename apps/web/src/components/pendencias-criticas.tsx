import type { CSSProperties } from "react";
import Link from "next/link";
import type { Prazo } from "@davinci/types";
import { ChevronRight } from "@/components/icones";

/** Rótulo do tipo para o chip (o resto já vem pronto de `Prazo.tipo`). */
const ROTULO_TIPO: Record<string, string> = { NC: "Não conformidade" };

/** Dias em atraso de um prazo vencido. */
function diasEmAtraso(data: string, hoje: string): number {
  const ms =
    Date.parse(`${hoje}T00:00:00Z`) - Date.parse(`${data}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

/**
 * "Precisa da sua atenção": card claro com a aba azul (estilo da régua) no cabeçalho e, no corpo, os
 * registros vencidos como cartões (código, dias em atraso, descrição e o tipo em chip).
 */
export function PendenciasCriticas({
  prazos,
  hoje,
}: {
  prazos: Prazo[];
  hoje: string;
}) {
  const vencidos = prazos
    .filter((p) => p.situacao === "vencido")
    .map((p) => {
      const partes = p.descricao.split(" · ");
      const temCodigo = partes.length > 1;
      return {
        codigo: temCodigo ? partes[0]! : null,
        descricao: temCodigo ? partes.slice(1).join(" · ") : p.descricao,
        dias: diasEmAtraso(p.data, hoje),
        tipo: ROTULO_TIPO[p.tipo] ?? p.tipo,
        href: p.href,
      };
    });
  if (vencidos.length === 0) return null;
  // Mostra no máximo 5 por tela (uma faixa); o restante fica em "Ver todos".
  const itens = vencidos.slice(0, 5);

  return (
    <div
      className="dv-entrar relative"
      style={{ "--atraso": "150ms" } as CSSProperties}
    >
      {/* aba azul em fita à esquerda, com dobra (decisão de design do Início) */}
      <span
        aria-hidden
        className="absolute top-2 bottom-0 -left-1.5 w-24 max-w-[26%] rounded-md"
        style={{
          background:
            "linear-gradient(180deg, var(--color-menu) 0%, color-mix(in srgb, var(--color-menu) 62%, #000) 100%)",
          boxShadow: "0 10px 22px rgb(16 31 120/.3)",
        }}
      />
      <span
        aria-hidden
        className="absolute -bottom-1.5 -left-1.5 size-5"
        style={{
          background: "color-mix(in srgb, var(--color-menu) 55%, #000)",
          clipPath: "polygon(0 0,100% 100%,0 100%)",
        }}
      />

      <section
        className="relative rounded-md border border-borda bg-superficie p-5 pl-7 shadow-cartao"
        aria-label="Precisa da sua atenção"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg text-texto">Precisa da sua atenção</h2>
            <p className="text-sm text-texto-2">Pendências críticas do sistema</p>
          </div>
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-9 w-px bg-borda" />
            <span className="text-3xl font-bold text-nao-conforme tabular-nums">
              {String(vencidos.length).padStart(2, "0")}
            </span>
            <span className="text-sm leading-tight text-texto-2">
              itens
              <br />
              em atraso
            </span>
          </div>
        </div>

        <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {itens.map((it, i) => (
            <li key={`${it.href}-${i}`}>
              <Link
                href={it.href}
                className="flex h-full flex-col rounded-md border border-nao-conforme/15 bg-nao-conforme/5 p-3 transition-colors hover:bg-nao-conforme/10"
              >
                <span className="text-xs font-bold text-texto-2">
                  {it.codigo ?? " "}
                </span>
                <span className="mt-1.5 text-2xl leading-none font-extrabold text-nao-conforme tabular-nums">
                  {it.dias} {it.dias === 1 ? "dia" : "dias"}
                </span>
                <span className="text-xs text-texto-2">em atraso</span>
                <span className="mt-2 flex-1 text-sm leading-snug text-texto">
                  {it.descricao}
                </span>
                <span className="mt-2.5 inline-flex w-fit items-center rounded-sm border border-borda bg-superficie px-2 py-1 text-xs text-texto-2">
                  {it.tipo}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/paineis/vencimentos"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-acao hover:underline"
        >
          Ver todos os registros
          <ChevronRight aria-hidden size={14} strokeWidth={2} />
        </Link>
      </section>
    </div>
  );
}
