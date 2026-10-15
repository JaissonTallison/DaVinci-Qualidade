"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { verificarCodigo, type EstadoDoFormulario } from "@/lib/acoes-sessao";
import {
  botaoLink,
  botaoPrimario,
  campo,
  erroDoCampo,
  rotulo,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

export function FormularioCodigo({ volta }: { volta?: string }) {
  const [estado, acao, conferindo] = useActionState<
    EstadoDoFormulario & { expirou?: boolean },
    FormData
  >(verificarCodigo, {});
  const erros = errosPorCampo(estado.erro?.detalhes);
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;

  if (estado.expirou)
    return (
      <div className="mt-6 flex flex-col gap-4">
        {erroGeral && <AvisoDeErro erro={erroGeral} />}
        <Link href="/entrar" className={botaoLink}>
          Entrar de novo
        </Link>
      </div>
    );

  return (
    <form action={acao} noValidate className="mt-6 flex flex-col gap-4">
      {erroGeral && <AvisoDeErro erro={erroGeral} />}
      {volta && <input type="hidden" name="volta" value={volta} />}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="codigo" className={rotulo}>
          Código
        </label>
        <input
          id="codigo"
          name="codigo"
          className={`${campo} font-mono`}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          aria-invalid={Boolean(erros.codigo)}
        />
        {erros.codigo && <p className={erroDoCampo}>{erros.codigo}</p>}
      </div>
      <label className="flex items-center gap-2 text-base text-texto-2">
        <input type="checkbox" name="confiar" className="size-4 rounded-xs" />
        Confiar neste navegador por 30 dias
      </label>
      <button
        type="submit"
        className={`${botaoPrimario} mt-2 w-full`}
        disabled={conferindo}
      >
        {conferindo ? "Conferindo…" : "Confirmar código"}
      </button>
    </form>
  );
}
