"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { pedirLinkDeSenha, type EstadoDoFormulario } from "@/lib/acoes-sessao";
import { errosPorCampo } from "@/lib/formularios";
import { CampoDeAcesso } from "../campo-de-acesso";
import { ErroDeAcesso } from "../erro-de-acesso";

type Estado = EstadoDoFormulario & { enviado?: boolean };

export function FormularioPedido() {
  const [estado, acao, enviando] = useActionState<Estado, FormData>(
    pedirLinkDeSenha,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;

  return (
    <div className="mt-5 flex flex-col gap-3">
      {estado.enviado ? (
        <p role="status" className="text-center text-base text-texto-2">
          Se <strong className="text-texto">{estado.email}</strong> tiver acesso
          ao sistema, o link chega em alguns minutos. Ele vale por 30 minutos e
          pode ser usado uma vez. Confira também a caixa de spam.
        </p>
      ) : (
        <form action={acao} noValidate className="flex flex-col gap-3">
          <CampoDeAcesso
            id="email"
            rotulo="E-mail"
            icone={Mail}
            type="email"
            defaultValue={estado.email}
            autoComplete="username"
            autoFocus
            required
            erro={erros.email}
          />
          {erroGeral && <ErroDeAcesso erro={erroGeral} />}
          <button
            type="submit"
            className="dv-acesso-botao mt-1"
            disabled={enviando}
          >
            {enviando ? "Enviando…" : "Enviar o link"}
          </button>
        </form>
      )}
      <Link
        href="/entrar"
        className="dv-acesso-link mt-2 inline-flex items-center justify-center gap-1.5 text-base"
      >
        <ArrowLeft aria-hidden size={16} strokeWidth={1.75} />
        Voltar para entrar
      </Link>
    </div>
  );
}
