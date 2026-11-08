"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, House, RotateCw } from "@/components/icones";
import { PaginaDeErro } from "@/components/pagina-de-erro";
import { botaoPrimario, botaoSecundario } from "@/lib/estilos";

/** Data e hora do erro no formato do sistema, para o suporte cruzar com o log. */
function agora(): string {
  return new Date().toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

/** Acessos frequentes do 404: as telas mais usadas, com o módulo ao lado (rotas reais do menu). */
const ATALHOS = [
  {
    href: "/qualidade/nao-conformidades",
    rotulo: "Não conformidades",
    modulo: "Qualidade",
  },
  { href: "/sgi/riscos", rotulo: "Riscos", modulo: "Gestão do SGI" },
  {
    href: "/auditorias/programacao",
    rotulo: "Programação de auditorias",
    modulo: "Auditorias",
  },
];

/** 404: endereço inexistente ou registro removido (interface.md §7.3). */
export function ErroNaoEncontrado() {
  const caminho = usePathname();
  const router = useRouter();
  return (
    <PaginaDeErro
      codigo="Erro 404"
      titulo="Página não encontrada"
      texto="O endereço acessado não existe ou o registro foi removido. Se você chegou aqui por um link salvo, ele pode estar desatualizado."
      acoes={
        <>
          <Link href="/" className={botaoPrimario}>
            <House aria-hidden size={16} strokeWidth={1.75} />
            Ir para o início
          </Link>
          <button
            type="button"
            className={botaoSecundario}
            onClick={() => router.back()}
          >
            <ArrowLeft aria-hidden size={16} strokeWidth={1.75} />
            Voltar à página anterior
          </button>
        </>
      }
      atalhos={ATALHOS}
      detalhes={[
        { rotulo: "Endereço solicitado", valor: caminho, mono: true },
        { rotulo: "Data e hora", valor: agora() },
      ]}
    />
  );
}

/**
 * 500: falha inesperada ao montar a tela. O `digest` é o identificador que o Next grava no log do servidor;
 * é ele que o suporte procura.
 */
export function ErroInesperado({
  digest,
  tentarDeNovo,
}: {
  digest?: string;
  tentarDeNovo: () => void;
}) {
  const caminho = usePathname();
  return (
    <PaginaDeErro
      codigo="Erro 500"
      titulo="Erro interno do sistema"
      texto="Não foi possível carregar esta tela por uma falha no servidor. Nenhum dado foi alterado. Tente de novo; se o erro continuar, envie os detalhes abaixo ao suporte."
      acoes={
        <>
          <button
            type="button"
            className={botaoPrimario}
            onClick={tentarDeNovo}
          >
            <RotateCw aria-hidden size={16} strokeWidth={1.75} />
            Tentar novamente
          </button>
          <Link href="/" className={botaoSecundario}>
            <House aria-hidden size={16} strokeWidth={1.75} />
            Ir para o início
          </Link>
        </>
      }
      detalhes={[
        { rotulo: "Endereço", valor: caminho, mono: true },
        { rotulo: "Data e hora", valor: agora() },
        ...(digest
          ? [{ rotulo: "ID do erro", valor: digest, mono: true }]
          : []),
      ]}
    />
  );
}
