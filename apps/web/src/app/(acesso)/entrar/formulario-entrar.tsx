"use client";

import { useActionState } from "react";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { entrar, type EstadoDoFormulario } from "@/lib/acoes-sessao";
import { botaoPrimario, campo, erroDoCampo, rotulo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { comRetentativa } from "@/lib/retentativa";

const entrarComRetentativa = comRetentativa(entrar);

export function FormularioEntrar({ volta }: { volta?: string }) {
  const [estado, acao, entrando] = useActionState<EstadoDoFormulario, FormData>(
    entrarComRetentativa,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;

  return (
    <form action={acao} noValidate className="mt-6 flex flex-col gap-4">
      {erroGeral && <AvisoDeErro erro={erroGeral} />}
      {volta && <input type="hidden" name="volta" value={volta} />}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={rotulo}>
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className={campo}
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
      <div className="flex flex-col gap-1.5">
        <label htmlFor="senha" className={rotulo}>
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          className={campo}
          autoComplete="current-password"
          required
          aria-invalid={Boolean(erros.senha)}
          aria-describedby={erros.senha ? "erro-senha" : undefined}
        />
        {erros.senha && (
          <p id="erro-senha" className={erroDoCampo}>
            {erros.senha}
          </p>
        )}
      </div>
      <button
        type="submit"
        className={`${botaoPrimario} mt-2 w-full`}
        disabled={entrando}
      >
        {entrando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
