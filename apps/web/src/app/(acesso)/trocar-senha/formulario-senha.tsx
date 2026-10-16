"use client";

import { useActionState } from "react";
import { SENHA_MINIMO } from "@davinci/types";
import { ErroDeAcesso } from "../erro-de-acesso";
import { trocarSenha, type EstadoDoFormulario } from "@/lib/acoes-sessao";
import {
  ajudaDoCampo,
  botaoPrimario,
  campo,
  erroDoCampo,
  rotulo,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

const CAMPOS = [
  {
    nome: "senhaAtual",
    rotulo: "Senha atual",
    autoComplete: "current-password",
  },
  {
    nome: "novaSenha",
    rotulo: "Nova senha",
    autoComplete: "new-password",
    ajuda: `Pelo menos ${SENHA_MINIMO} caracteres.`,
  },
  {
    nome: "confirmacao",
    rotulo: "Repita a nova senha",
    autoComplete: "new-password",
  },
] as const;

export function FormularioSenha() {
  const [estado, acao, salvando] = useActionState<EstadoDoFormulario, FormData>(
    trocarSenha,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;

  return (
    <form action={acao} noValidate className="mt-6 flex flex-col gap-4">
      {erroGeral && <ErroDeAcesso erro={erroGeral} />}
      {CAMPOS.map((c) => (
        <div key={c.nome} className="flex flex-col gap-1.5">
          <label htmlFor={c.nome} className={rotulo}>
            {c.rotulo}
          </label>
          <input
            id={c.nome}
            name={c.nome}
            type="password"
            className={campo}
            autoComplete={c.autoComplete}
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
        className={`${botaoPrimario} mt-2 w-full`}
        disabled={salvando}
      >
        {salvando ? "Salvando…" : "Salvar nova senha"}
      </button>
    </form>
  );
}
