"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SENHA_MINIMO } from "@davinci/types";
import { ErroDeAcesso } from "../erro-de-acesso";
import { redefinirSenha, type EstadoDoFormulario } from "@/lib/acoes-sessao";
import {
  ajudaDoCampo,
  botaoLink,
  botaoPrimario,
  campo,
  erroDoCampo,
  rotulo,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

const CAMPOS = [
  {
    nome: "novaSenha",
    rotulo: "Nova senha",
    ajuda: `Pelo menos ${SENHA_MINIMO} caracteres.`,
  },
  { nome: "confirmacao", rotulo: "Repita a nova senha" },
] as const;

export function FormularioNovaSenha({ token }: { token: string }) {
  const [estado, acao, salvando] = useActionState<EstadoDoFormulario, FormData>(
    redefinirSenha,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;

  return (
    <form action={acao} noValidate className="mt-6 flex flex-col gap-4">
      {erroGeral && <ErroDeAcesso erro={erroGeral} />}
      <input type="hidden" name="token" value={token} />
      {CAMPOS.map((c, i) => (
        <div key={c.nome} className="flex flex-col gap-1.5">
          <label htmlFor={c.nome} className={rotulo}>
            {c.rotulo}
          </label>
          <input
            id={c.nome}
            name={c.nome}
            type="password"
            className={`${campo} h-10`}
            autoComplete="new-password"
            autoFocus={i === 0}
            required
            aria-invalid={Boolean(erros[c.nome])}
          />
          {erros[c.nome] ? (
            <p className={erroDoCampo}>{erros[c.nome]}</p>
          ) : (
            "ajuda" in c && <p className={ajudaDoCampo}>{c.ajuda}</p>
          )}
        </div>
      ))}
      <button
        type="submit"
        className={`${botaoPrimario} mt-1 h-10 w-full`}
        disabled={salvando}
      >
        {salvando ? "Salvando…" : "Salvar a nova senha"}
      </button>
      <Link href="/esqueci-a-senha" className={`${botaoLink} self-start`}>
        Pedir outro link
      </Link>
    </form>
  );
}
