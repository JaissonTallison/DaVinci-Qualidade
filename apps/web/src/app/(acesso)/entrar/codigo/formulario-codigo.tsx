"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";
import { verificarCodigo, type EstadoDoFormulario } from "@/lib/acoes-sessao";
import { errosPorCampo } from "@/lib/formularios";
import { CampoDeAcesso } from "../../campo-de-acesso";
import { ErroDeAcesso } from "../../erro-de-acesso";

export function FormularioCodigo({ volta }: { volta?: string }) {
  const [estado, acao, conferindo] = useActionState<
    EstadoDoFormulario & { expirou?: boolean },
    FormData
  >(verificarCodigo, {});
  const erros = errosPorCampo(estado.erro?.detalhes);
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;
  const voltar = (
    <Link
      href="/entrar"
      className="dv-acesso-link mt-2 inline-flex items-center justify-center gap-1.5 text-base"
    >
      <ArrowLeft aria-hidden size={16} strokeWidth={1.75} />
      {estado.expirou ? "Entrar de novo" : "Voltar para entrar"}
    </Link>
  );

  if (estado.expirou)
    return (
      <div className="mt-5 flex flex-col gap-3">
        {erroGeral && <ErroDeAcesso erro={erroGeral} />}
        {voltar}
      </div>
    );

  return (
    <form action={acao} noValidate className="mt-5 flex flex-col gap-3">
      {volta && <input type="hidden" name="volta" value={volta} />}
      <CampoDeAcesso
        id="codigo"
        rotulo="Código"
        icone={KeyRound}
        className="font-mono tracking-widest"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        required
        erro={erros.codigo}
      />
      {erroGeral && <ErroDeAcesso erro={erroGeral} />}
      <label className="flex items-center gap-2 text-base text-texto">
        <input type="checkbox" name="confiar" className="size-4 rounded-xs" />
        Confiar neste navegador por 30 dias
      </label>
      <button
        type="submit"
        className="dv-acesso-botao mt-1"
        disabled={conferindo}
      >
        {conferindo ? "Conferindo…" : "Confirmar código"}
      </button>
      {voltar}
    </form>
  );
}
