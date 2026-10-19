import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BotaoImprimir } from "./botao-imprimir";

/** Uma linha de assinatura no rodapé do documento (nome opcional, papel sempre). */
export interface Assinatura {
  nome?: string | null;
  papel: string;
}

/**
 * Folha padrão dos documentos imprimíveis/PDF (relatórios, planos, CAT, fichas…). Cobre a tela inteira:
 * a folha fica centralizada sobre o fundo gelo, sem o menu nem a barra do sistema — a pré-visualização já é
 * o documento. Logo e empresa no topo, título, número e emissão, o conteúdo e, no rodapé, assinaturas e a
 * identificação do sistema. Define o `@page` (A4, margens); a barra de ações some na impressão.
 */
export function FolhaDeDocumento({
  tipo,
  numero,
  titulo,
  subtitulo,
  empresa,
  emitidoEm,
  paisagem = false,
  voltarHref,
  voltarRotulo = "Voltar",
  acoes,
  assinaturas,
  children,
}: {
  /** Espécie do documento, ex.: "Relatório de auditoria". */
  tipo: string;
  numero?: string | null;
  /** Nome principal: organização auditada, título do FMEA, nome do funcionário… */
  titulo: string;
  subtitulo?: ReactNode;
  /** Empresa/unidade dona do sistema (de /auth/eu). */
  empresa?: string | null;
  /** Data de emissão já formatada. */
  emitidoEm: string;
  /** A4 paisagem para tabelas largas (FMEA, plano de controle). */
  paisagem?: boolean;
  voltarHref: string;
  voltarRotulo?: string;
  /** Ações extras na barra (ex.: seletor de modelo), escondidas na impressão. */
  acoes?: ReactNode;
  assinaturas?: Assinatura[];
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-fundo print:static print:z-auto print:overflow-visible print:bg-transparent">
      <style>{`@page { size: A4 ${paisagem ? "landscape" : "portrait"}; margin: 14mm; }`}</style>

      <div
        className={`mx-auto w-full px-4 py-6 print:max-w-none print:p-0 ${paisagem ? "max-w-6xl" : "max-w-4xl"}`}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href={voltarHref} className="dv-voltar">
            {voltarRotulo}
          </Link>
          <div className="flex items-center gap-2">
            {acoes}
            <BotaoImprimir />
          </div>
        </div>

        <article className="bg-superficie p-10 shadow-cartao print:p-0 print:shadow-none">
          <header className="border-b-2 border-texto pb-3">
            <div className="flex items-start justify-between gap-6">
              <Image
                src="/brand/logo.svg"
                alt="DaVinci Qualidade"
                width={573}
                height={215}
                className="h-9 w-auto shrink-0"
                priority
              />
              <div className="text-right text-sm text-texto-2">
                {empresa && (
                  <p className="font-semibold text-texto">{empresa}</p>
                )}
                <p>Emitido em {emitidoEm}</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold tracking-[0.04em] text-texto-2 uppercase">
              {tipo}
              {numero ? ` · ${numero}` : ""}
            </p>
            <h1 className="text-2xl font-bold text-texto">{titulo}</h1>
            {subtitulo && (
              <p className="mt-0.5 text-sm text-texto-2">{subtitulo}</p>
            )}
          </header>

          {children}

          {assinaturas && assinaturas.length > 0 && (
            <section className="mt-12 grid break-inside-avoid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {assinaturas.map((a, i) => (
                <div key={i} className="border-t border-texto pt-1.5 text-sm">
                  <p className="font-semibold text-texto">
                    {a.nome || " "}
                  </p>
                  <p className="text-texto-2">{a.papel}</p>
                </div>
              ))}
            </section>
          )}

          <footer className="mt-10 border-t border-borda pt-2 text-xs text-texto-3">
            Documento gerado pelo DaVinci Qualidade em {emitidoEm}. Confira
            sempre o registro atualizado no sistema.
          </footer>
        </article>
      </div>
    </div>
  );
}
