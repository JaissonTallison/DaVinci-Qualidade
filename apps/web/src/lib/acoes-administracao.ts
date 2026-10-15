"use server";

import { redirect } from "next/navigation";
import {
  alterarPerfilDoUsuarioSchema,
  atualizarPerfilSchema,
  devolverAcessoSchema,
  exige2faSchema,
  novoPerfilSchema,
  novoUsuarioSchema,
  removerAcessoSchema,
  salvarRecursosSchema,
  situacaoDoPerfilSchema,
  type Perfil,
  type SenhaRedefinida,
  type UsuarioCriado,
  type UsuarioDaEmpresa,
} from "@davinci/types";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";
import { chamarApi } from "./api";

const USUARIOS = "/administracao/usuarios";
const PERFIS = "/administracao/perfis";

/** A senha provisória aparece uma vez, na própria tela: nunca vai para a URL. */
export type EstadoComSenha = EstadoDaAcao & {
  senha?: string;
  usuarioId?: string;
  pessoaJaExistia?: boolean;
};

export async function criarUsuario(
  _: EstadoComSenha,
  form: FormData,
): Promise<EstadoComSenha> {
  const valores = textos(form);
  const r = await chamar<UsuarioCriado>(
    novoUsuarioSchema,
    valores,
    "/usuarios",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  return {
    senha: r.dados.senhaProvisoria ?? undefined,
    usuarioId: r.dados.usuario.id,
    pessoaJaExistia: r.dados.pessoaJaExistia,
  };
}

export async function alterarPerfilDoUsuario(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<UsuarioDaEmpresa>(
    alterarPerfilDoUsuarioSchema,
    { perfilId: valores.perfilId, versao: versaoDe(form) },
    `/usuarios/${id}/perfil`,
    "PUT",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${USUARIOS}/${id}?aviso=perfil`);
}

export async function removerAcesso(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<UsuarioDaEmpresa>(
    removerAcessoSchema,
    { motivo: valores.motivo, versao: versaoDe(form) },
    `/usuarios/${id}/remover-acesso`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${USUARIOS}/${id}?aviso=removido`);
}

export async function devolverAcesso(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const r = await chamar<UsuarioDaEmpresa>(
    devolverAcessoSchema,
    { versao: versaoDe(form) },
    `/usuarios/${id}/devolver-acesso`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`${USUARIOS}/${id}?aviso=devolvido`);
}

export async function redefinirSenha(id: string): Promise<EstadoComSenha> {
  const r = await chamarApi<SenhaRedefinida>(
    `/usuarios/${id}/redefinir-senha`,
    { metodo: "POST", corpo: {} },
  );
  return r.ok ? { senha: r.dados.senhaProvisoria } : { erro: r.erro };
}

export async function desativar2faDoUsuario(id: string): Promise<EstadoDaAcao> {
  const r = await chamarApi(`/usuarios/${id}/desativar-2fa`, {
    metodo: "POST",
    corpo: {},
  });
  if (!r.ok) return { erro: r.erro };
  redirect(`${USUARIOS}/${id}?aviso=2fa`);
}

/** Permissões vêm de várias caixas com o mesmo nome. */
export async function salvarPerfil(
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const permissoes = form.getAll("permissoes").map(String);
  valores.permissoes = permissoes.join(",");
  const dados = {
    nome: valores.nome,
    descricao: valores.descricao,
    permissoes,
  };
  const r = id
    ? await chamar<Perfil>(
        atualizarPerfilSchema,
        { ...dados, versao: versaoDe(form) },
        `/perfis/${id}`,
        "PUT",
        valores,
      )
    : await chamar<Perfil>(novoPerfilSchema, dados, "/perfis", "POST", valores);
  if ("erro" in r) return r;
  redirect(`${PERFIS}/${r.dados.id}?aviso=${id ? "salvo" : "criado"}`);
}

export async function exigir2faNoPerfil(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const exige = form.get("exige") === "sim";
  const r = await chamar<Perfil>(
    exige2faSchema,
    { exige, versao: versaoDe(form) },
    `/perfis/${id}/exige-2fa`,
    "PUT",
  );
  if ("erro" in r) return r;
  redirect(`${PERFIS}/${id}?aviso=${exige ? "2fa-exigido" : "2fa-livre"}`);
}

export async function mudarSituacaoDoPerfil(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const ativar = form.get("ativar") === "sim";
  const r = await chamar<Perfil>(
    situacaoDoPerfilSchema,
    { versao: versaoDe(form) },
    `/perfis/${id}/${ativar ? "reativar" : "inativar"}`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`${PERFIS}/${id}?aviso=${ativar ? "reativado" : "inativado"}`);
}

export async function salvarModulos(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const recursos = form.getAll("recursos").map(String);
  const r = await chamar(
    salvarRecursosSchema,
    { recursos },
    "/empresa/recursos",
    "PUT",
  );
  if ("erro" in r) return r;
  redirect("/administracao/modulos?aviso=salvo");
}
