"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { pedirLinkDeSenha, type EstadoDoFormulario } from "@/lib/acoes-sessao";
import {
  botaoLink,
  botaoPrimario,
  campo,
  erroDoCampo,
  rotulo,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

type Estado = EstadoDoFormulario & { enviado?: boolean };

export function FormularioPedido() {
  const [estado, acao, enviando] = useActionState<Estado, FormData>(
    pedirLinkDeSenha,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;

  if (estado.enviado)
    return (
      <div className="mt-6 flex flex-col gap-4">
        <p
          role="status"
          className="rounded-sm border border-borda bg-superficie-2 px-4 py-2.5 text-base text-texto-2"
        >
          Se <strong className="text-texto">{estado.email}</strong> tiver acesso
          ao sistema, o link chega em alguns minutos. Ele vale por 30 minutos e
          pode ser usado uma vez. Confira também a caixa de spam.
        </p>
        <Link href="/entrar" className={botaoLink}>
          Voltar para entrar
        </Link>
      </div>
    );

  return (
    <form action={acao} noValidate className="mt-6 flex flex-col gap-4">
      {erroGeral && <AvisoDeErro erro={erroGeral} />}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={rotulo}>
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className={`${campo} h-10`}
          defaultValue={estado.email}
          autoComplete="username"
          autoFocus
          required
          aria-invalid={Boolean(erros.email)}
          aria-describedby={erros.email ? "erro-email" : undefined}
        />
        {erros.email && (
          <p id="erro-email" className={erroDoCampo}>
            {erros.email}
          </p>
        )}
      </div>
      <button
        type="submit"
        className={`${botaoPrimario} mt-1 h-10 w-full`}
        disabled={enviando}
      >
        {enviando ? "Enviando…" : "Enviar o link"}
      </button>
      <Link href="/entrar" className={`${botaoLink} self-start`}>
        Voltar para entrar
      </Link>
    </form>
  );
}
