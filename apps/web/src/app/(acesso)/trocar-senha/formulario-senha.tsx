"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { SENHA_MINIMO } from "@davinci/types";
import { trocarSenha, type EstadoDoFormulario } from "@/lib/acoes-sessao";
import { errosPorCampo } from "@/lib/formularios";
import { CampoDeAcesso } from "../campo-de-acesso";
import { ErroDeAcesso } from "../erro-de-acesso";

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
    <form action={acao} noValidate className="mt-5 flex flex-col gap-3">
      {CAMPOS.map((c, i) => (
        <CampoDeAcesso
          key={c.nome}
          id={c.nome}
          rotulo={c.rotulo}
          icone={Lock}
          type="password"
          autoComplete={c.autoComplete}
          autoFocus={i === 0}
          required
          erro={erros[c.nome]}
          ajuda={"ajuda" in c ? c.ajuda : undefined}
        />
      ))}
      {erroGeral && <ErroDeAcesso erro={erroGeral} />}
      <button
        type="submit"
        className="dv-acesso-botao mt-1"
        disabled={salvando}
      >
        {salvando ? "Salvando…" : "Salvar nova senha"}
      </button>
    </form>
  );
}
