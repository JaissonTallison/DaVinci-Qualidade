import type { CSSProperties } from "react";
import Link from "next/link";
import type { Prazo } from "@davinci/types";
import { ChevronRight } from "@/components/icones";
import { Botao } from "@/components/botao";
import { Selo } from "@/components/selo";
import { cabecalhoDoPainel, painel, tituloDoPainel } from "@/lib/estilos";

/** Rótulo do tipo para o chip (o resto já vem pronto de `Prazo.tipo`). */
const ROTULO_TIPO: Record<string, string> = { NC: "Não conformidade" };

/** Dias em atraso de um prazo vencido. */
function diasEmAtraso(data: string, hoje: string): number {
  const ms = Date.parse(`${hoje}T00:00:00Z`) - Date.parse(`${data}T00:00:00Z`);
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
    <div className="dv-entrar" style={{ "--atraso": "150ms" } as CSSProperties}>
      <section className={painel} aria-labelledby="pendencias-titulo">
        <header className={`${cabecalhoDoPainel} flex-wrap justify-between`}>
          <div className="min-w-0">
            <h2 id="pendencias-titulo" className={tituloDoPainel}>
              Precisa da sua atenção
            </h2>
            <p className="text-sm text-texto-2">
              Os prazos vencidos há mais tempo, de todos os módulos.
            </p>
          </div>
          <Selo tom="perigo">
            {vencidos.length} {vencidos.length === 1 ? "item" : "itens"} em
            atraso
          </Selo>
        </header>

        <ul className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {itens.map((it, i) => (
            <li key={`${it.href}-${i}`}>
              <Link
                href={it.href}
                className="group flex h-full flex-col rounded-md border border-borda bg-superficie p-4 shadow-xs transition-colors hover:border-borda-forte hover:bg-superficie-2"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-xs text-texto-2">
                    {it.codigo ?? it.tipo}
                  </span>
                  <Selo tom="perigo">
                    {it.dias} {it.dias === 1 ? "dia" : "dias"}
                  </Selo>
                </span>
                <span className="mt-3 line-clamp-3 flex-1 text-base leading-snug font-medium text-texto group-hover:underline">
                  {it.descricao}
                </span>
                <span className="mt-3 text-xs text-texto-2">{it.tipo}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="border-t border-borda px-5 py-3">
          <Botao
            href="/paineis/vencimentos"
            variante="link"
            tamanho="pequeno"
            iconeDireita={ChevronRight}
          >
            Ver todos os vencimentos
          </Botao>
        </div>
      </section>
    </div>
  );
}
