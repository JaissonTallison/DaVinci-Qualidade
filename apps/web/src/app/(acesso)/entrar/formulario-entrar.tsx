"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { PROVEDORES_EXTERNOS, type ProvedorExterno } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { entrar, type EstadoDoFormulario } from "@/lib/acoes-sessao";
import {
  botaoLink,
  botaoPrimario,
  botaoSecundario,
  campo,
  erroDoCampo,
  rotulo,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { comRetentativa } from "@/lib/retentativa";

const entrarComRetentativa = comRetentativa(entrar);
const icone =
  "pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-texto-3";

export function FormularioEntrar({
  volta,
  provedores,
  recusa,
  lembrar: lembrarAntes,
}: {
  volta?: string;
  provedores: ProvedorExterno[];
  /** Recusa do login com Microsoft/Google. */
  recusa?: string;
  lembrar: boolean;
}) {
  const [estado, acao, entrando] = useActionState<EstadoDoFormulario, FormData>(
    entrarComRetentativa,
    {},
  );
  const [verSenha, setVerSenha] = useState(false);
  // O botão da Microsoft/Google é um link: leva a escolha junto
  const [lembrar, setLembrar] = useState(lembrarAntes);
  const erros = errosPorCampo(estado.erro?.detalhes);
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length
      ? estado.erro
      : !estado.erro && recusa
        ? { codigo: "NAO_AUTENTICADO" as const, mensagem: recusa }
        : undefined;
  const ida = (p: ProvedorExterno) =>
    `/entrar/externo/${p}?${new URLSearchParams({
      lembrar: lembrar ? "1" : "0",
      ...(volta ? { volta } : {}),
    }).toString()}`;

  return (
    <>
      <form action={acao} noValidate className="mt-6 flex flex-col gap-4">
        {erroGeral && <AvisoDeErro erro={erroGeral} />}
        {volta && <input type="hidden" name="volta" value={volta} />}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={rotulo}>
            E-mail
          </label>
          <div className="relative">
            <Mail aria-hidden size={16} strokeWidth={1.75} className={icone} />
            <input
              id="email"
              name="email"
              type="email"
              className={`${campo} h-10 pl-9`}
              defaultValue={estado.email}
              autoComplete="username"
              autoFocus
              required
              aria-invalid={Boolean(erros.email)}
              aria-describedby={erros.email ? "erro-email" : undefined}
            />
          </div>
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
          <div className="relative">
            <Lock aria-hidden size={16} strokeWidth={1.75} className={icone} />
            <input
              id="senha"
              name="senha"
              type={verSenha ? "text" : "password"}
              className={`${campo} h-10 pr-10 pl-9`}
              autoComplete="current-password"
              required
              aria-invalid={Boolean(erros.senha)}
              aria-describedby={erros.senha ? "erro-senha" : undefined}
            />
            <button
              type="button"
              onClick={() => setVerSenha((v) => !v)}
              aria-label={verSenha ? "Esconder a senha" : "Mostrar a senha"}
              aria-pressed={verSenha}
              className="absolute top-1/2 right-1 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-texto-3 hover:text-texto"
            >
              {verSenha ? (
                <EyeOff aria-hidden size={16} strokeWidth={1.75} />
              ) : (
                <Eye aria-hidden size={16} strokeWidth={1.75} />
              )}
            </button>
          </div>
          {erros.senha && (
            <p id="erro-senha" className={erroDoCampo}>
              {erros.senha}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-base text-texto-2">
            <input
              type="checkbox"
              name="lembrar"
              checked={lembrar}
              onChange={(e) => setLembrar(e.target.checked)}
              className="size-4 rounded-xs"
            />
            Lembrar de mim
          </label>
          <Link href="/esqueci-a-senha" className={botaoLink}>
            Esqueceu a senha?
          </Link>
        </div>
        <button
          type="submit"
          className={`${botaoPrimario} mt-1 h-10 w-full`}
          disabled={entrando}
        >
          {entrando ? (
            "Entrando…"
          ) : (
            <>
              Entrar
              <ArrowRight aria-hidden size={16} strokeWidth={1.75} />
            </>
          )}
        </button>
      </form>

      {provedores.length > 0 && (
        <>
          <p className="mt-6 flex items-center gap-3 text-sm text-texto-3 before:h-px before:flex-1 before:bg-borda after:h-px after:flex-1 after:bg-borda">
            ou entre com
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {provedores.map((p) => (
              <a
                key={p}
                href={ida(p)}
                className={`${botaoSecundario} h-10 ${provedores.length === 1 ? "col-span-2" : ""}`}
              >
                {p === "microsoft" ? <MarcaMicrosoft /> : <MarcaGoogle />}
                {PROVEDORES_EXTERNOS[p]}
              </a>
            ))}
          </div>
        </>
      )}
    </>
  );
}

/* Marcas dos provedores nas cores oficiais (exigência das diretrizes de cada um; não são ícones da interface). */
function MarcaMicrosoft() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 21 21">
      <path fill="#f25022" d="M1 1h9v9H1z" />
      <path fill="#7fba00" d="M11 1h9v9h-9z" />
      <path fill="#00a4ef" d="M1 11h9v9H1z" />
      <path fill="#ffb900" d="M11 11h9v9h-9z" />
    </svg>
  );
}

function MarcaGoogle() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 48 48">
      <path
        fill="#ea4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"
      />
      <path
        fill="#4285f4"
        d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.2z"
      />
      <path
        fill="#fbbc05"
        d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6.1z"
      />
      <path
        fill="#34a853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.2 0-11.5-4.2-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}
