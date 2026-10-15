"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  detalhesDaValidacao,
  ehDesafio2fa,
  login2faSchema,
  loginSchema,
  trocarSenhaSchema,
  type ErroPadrao,
  type RespostaLogin,
  type Sessao,
} from "@davinci/types";
import { chamarApi } from "./api";
import { lerCookie } from "./cookie";
import {
  COOKIE_CONFIAVEL,
  COOKIE_DESAFIO,
  COOKIE_RENOVACAO,
  caminhoDeVolta,
  opcoes,
} from "./sessao";
import { gravarSessao, limparSessao } from "./sessao-servidor";

export type EstadoDoFormulario = { erro?: ErroPadrao; email?: string };

const CONFIRA_OS_CAMPOS = "Verifique os campos destacados.";

export async function entrar(
  _: EstadoDoFormulario,
  form: FormData,
): Promise<EstadoDoFormulario> {
  const email = String(form.get("email") ?? "");
  const dados = { email, senha: String(form.get("senha") ?? "") };
  const v = loginSchema.safeParse(dados);
  if (!v.success)
    return {
      email,
      erro: {
        codigo: "DADOS_INVALIDOS",
        mensagem: CONFIRA_OS_CAMPOS,
        detalhes: detalhesDaValidacao(v.error.issues),
      },
    };

  const navegadorConfiavel = await lerCookie(COOKIE_CONFIAVEL);
  const r = await chamarApi<RespostaLogin>("/auth/login", {
    metodo: "POST",
    corpo: { ...dados, navegadorConfiavel },
    publica: true,
  });
  if (!r.ok) return { email, erro: r.erro };
  const volta = caminhoDeVolta(form.get("volta"));
  if (ehDesafio2fa(r.dados)) {
    // Senha certa; falta o código. O desafio fica em cookie HttpOnly (5 min), nunca na URL.
    (await cookies()).set({
      name: COOKIE_DESAFIO,
      value: r.dados.desafio2fa,
      ...opcoes(r.dados.expiraEm),
    });
    redirect(
      `/entrar/codigo${volta !== "/" ? `?volta=${encodeURIComponent(volta)}` : ""}`,
    );
  }
  await gravarSessao(r.dados);
  redirect(destinoAposEntrar(r.dados, volta));
}

/** Segunda etapa do login: código do aplicativo ou de recuperação. */
export async function verificarCodigo(
  _: EstadoDoFormulario,
  form: FormData,
): Promise<EstadoDoFormulario & { expirou?: boolean }> {
  const desafio = await lerCookie(COOKIE_DESAFIO);
  if (!desafio)
    return {
      expirou: true,
      erro: {
        codigo: "NAO_AUTENTICADO",
        mensagem:
          "O tempo para digitar o código acabou. Entre de novo com e-mail e senha.",
      },
    };
  const dados = {
    desafio,
    codigo: String(form.get("codigo") ?? ""),
    confiar: form.get("confiar") === "on",
  };
  const v = login2faSchema.safeParse(dados);
  if (!v.success)
    return {
      erro: {
        codigo: "DADOS_INVALIDOS",
        mensagem: CONFIRA_OS_CAMPOS,
        detalhes: detalhesDaValidacao(v.error.issues),
      },
    };
  const r = await chamarApi<Sessao>("/auth/login/2fa", {
    metodo: "POST",
    corpo: dados,
    publica: true,
  });
  if (!r.ok) {
    const expirou = /Entre de novo/.test(r.erro.mensagem);
    if (expirou) (await cookies()).delete(COOKIE_DESAFIO);
    return { erro: r.erro, expirou };
  }
  (await cookies()).delete(COOKIE_DESAFIO);
  await gravarSessao(r.dados);
  redirect(destinoAposEntrar(r.dados, caminhoDeVolta(form.get("volta"))));
}

export async function sair(): Promise<void> {
  const tokenRenovacao = await lerCookie(COOKIE_RENOVACAO);
  // Encerra no servidor também; se o gateway estiver fora, ao menos este navegador sai
  if (tokenRenovacao)
    await chamarApi("/auth/sair", {
      metodo: "POST",
      corpo: { tokenRenovacao },
      publica: true,
    });
  await limparSessao();
  redirect("/entrar");
}

export async function trocarSenha(
  _: EstadoDoFormulario,
  form: FormData,
): Promise<EstadoDoFormulario> {
  const dados = {
    senhaAtual: String(form.get("senhaAtual") ?? ""),
    novaSenha: String(form.get("novaSenha") ?? ""),
  };
  const confirmacao = String(form.get("confirmacao") ?? "");
  const v = trocarSenhaSchema.safeParse(dados);
  const detalhes = v.success ? [] : detalhesDaValidacao(v.error.issues);
  if (confirmacao !== dados.novaSenha)
    detalhes.push({
      campo: "confirmacao",
      mensagem: "A confirmação não confere com a nova senha.",
    });
  if (detalhes.length)
    return {
      erro: {
        codigo: "DADOS_INVALIDOS",
        mensagem: CONFIRA_OS_CAMPOS,
        detalhes,
      },
    };

  const tokenRenovacao = await lerCookie(COOKIE_RENOVACAO);
  const r = await chamarApi<{ alterada: true }>("/auth/senha", {
    metodo: "POST",
    corpo: { ...dados, tokenRenovacao },
  });
  if (!r.ok) return { erro: r.erro };

  // Token novo, já sem a pendência de senha (as outras sessões foram encerradas pelo Identidade)
  const nova = tokenRenovacao
    ? await chamarApi<Sessao>("/auth/renovar", {
        metodo: "POST",
        corpo: { tokenRenovacao },
        publica: true,
      })
    : null;
  if (!nova?.ok) {
    await limparSessao();
    redirect("/entrar");
  }
  await gravarSessao(nova.dados);
  redirect("/?aviso=senha-alterada");
}

/** Senha provisória primeiro; senão, para onde a pessoa ia. */
function destinoAposEntrar(sessao: Sessao, volta: string): string {
  return sessao.usuario.deveTrocarSenha ? "/trocar-senha" : volta;
}
