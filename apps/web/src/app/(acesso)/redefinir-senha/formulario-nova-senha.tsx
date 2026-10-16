"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Lock } from "lucide-react";
import { SENHA_MINIMO } from "@davinci/types";
import { redefinirSenha, type EstadoDoFormulario } from "@/lib/acoes-sessao";
import { errosPorCampo } from "@/lib/formularios";
import { CampoDeAcesso } from "../campo-de-acesso";
import { ErroDeAcesso } from "../erro-de-acesso";

export function FormularioNovaSenha({ token }: { token: string }) {
  const [estado, acao, salvando] = useActionState<EstadoDoFormulario, FormData>(
    redefinirSenha,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;

  return (
    <form action={acao} noValidate className="mt-5 flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <CampoDeAcesso
        id="novaSenha"
        rotulo="Nova senha"
        icone={Lock}
        type="password"
        autoComplete="new-password"
        autoFocus
        required
        erro={erros.novaSenha}
        ajuda={`Pelo menos ${SENHA_MINIMO} caracteres.`}
      />
      <CampoDeAcesso
        id="confirmacao"
        rotulo="Repita a nova senha"
        icone={Lock}
        type="password"
        autoComplete="new-password"
        required
        erro={erros.confirmacao}
      />
      {erroGeral && <ErroDeAcesso erro={erroGeral} />}
      <button
        type="submit"
        className="dv-acesso-botao mt-1"
        disabled={salvando}
      >
        {salvando ? "Salvando…" : "Salvar a nova senha"}
      </button>
      <Link
        href="/esqueci-a-senha"
        className="dv-acesso-link mt-2 text-center text-base"
      >
        Pedir outro link
      </Link>
    </form>
  );
}
