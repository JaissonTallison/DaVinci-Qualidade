"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Perfil } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import { criarUsuario, type EstadoComSenha } from "@/lib/acoes-administracao";
import { botaoLink, botaoPrimario, campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { SenhaProvisoria } from "../senha-provisoria";

export function NovoUsuario({ perfis }: { perfis: Perfil[] }) {
  const [estado, acao, salvando] = useActionState<EstadoComSenha, FormData>(
    criarUsuario,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  if (estado.usuarioId)
    return (
      <div>
        {estado.senha ? (
          <SenhaProvisoria senha={estado.senha} />
        ) : (
          <p role="status" className="mt-2 text-base text-texto">
            {estado.pessoaJaExistia
              ? "Este e-mail já tinha acesso a outra empresa: a pessoa entra com a senha que já usa."
              : "Usuário cadastrado."}
          </p>
        )}
        <p className="mt-3 text-base">
          <Link
            href={`/administracao/usuarios/${estado.usuarioId}`}
            className={botaoLink}
          >
            Ver o usuário
          </Link>
        </p>
      </div>
    );
  return (
    <form action={acao} noValidate className="flex flex-col gap-5">
      {estado.erro && !estado.erro.detalhes?.length && (
        <AvisoDeErro erro={estado.erro} />
      )}
      <div className="grid gap-5 sm:grid-cols-3">
        <Campo id="nome" rotulo="Nome completo" erro={erros.nome}>
          <input
            id="nome"
            name="nome"
            defaultValue={v.nome}
            maxLength={150}
            className={campo}
            aria-invalid={Boolean(erros.nome)}
          />
        </Campo>
        <Campo id="email" rotulo="E-mail" erro={erros.email}>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={v.email}
            maxLength={150}
            className={campo}
            aria-invalid={Boolean(erros.email)}
          />
        </Campo>
        <Campo id="perfilId" rotulo="Perfil" erro={erros.perfilId}>
          <Selecao
            id="perfilId"
            name="perfilId"
            defaultValue={v.perfilId ?? ""}
            className={campo}
            aria-invalid={Boolean(erros.perfilId)}
          >
            <option value="">Escolha</option>
            {perfis
              .filter((p) => p.ativo)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
          </Selecao>
        </Campo>
      </div>
      <div>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : "Cadastrar usuário"}
        </button>
      </div>
    </form>
  );
}
