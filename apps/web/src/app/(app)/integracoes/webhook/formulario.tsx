"use client";

import { useActionState } from "react";
import type { ConfigWebhook } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Botao } from "@/components/botao";
import { Campo } from "@/components/campo";
import { campo, painel } from "@/lib/estilos";
import { salvarWebhook, type EstadoWebhook } from "@/lib/acoes-integracoes";

/** Formulário do webhook: URL https + ativar. Prefill com a config atual; mantém o que a pessoa digitou no erro. */
export function FormularioDeWebhook({ webhook }: { webhook: ConfigWebhook }) {
  const [estado, salvar, salvando] = useActionState<EstadoWebhook, FormData>(
    salvarWebhook,
    {},
  );
  const v = estado.valores ?? { url: webhook.url ?? "", ativo: webhook.ativo };
  const erroUrl = estado.erro?.detalhes?.find((d) => d.campo === "url")
    ?.mensagem;
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;

  return (
    <form
      action={salvar}
      className={`${painel} mt-6 flex max-w-2xl flex-col gap-5 p-5`}
    >
      {erroGeral && <AvisoDeErro erro={erroGeral} />}
      {estado.ok && (
        <p className="rounded-md border border-conforme-borda bg-conforme-suave px-3 py-2 text-sm text-conforme-texto">
          Webhook salvo.
        </p>
      )}
      <Campo
        id="url"
        rotulo="Endereço (URL https)"
        erro={erroUrl}
        ajuda="Ex.: https://seu-sistema.com/hooks/davinci"
      >
        <input
          id="url"
          name="url"
          type="url"
          maxLength={500}
          defaultValue={v.url}
          placeholder="https://…"
          className={campo}
          aria-invalid={Boolean(erroUrl)}
        />
      </Campo>
      <label className="flex items-start gap-2.5">
        <input
          type="checkbox"
          name="ativo"
          defaultChecked={v.ativo}
          className="mt-0.5 size-4 accent-primaria"
        />
        <span className="text-sm text-texto">
          Ativar o envio de webhooks para este endereço.
        </span>
      </label>
      <div>
        <Botao
          type="submit"
          carregando={salvando}
          textoCarregando="Salvando…"
          variante="primario"
        >
          Salvar
        </Botao>
      </div>
    </form>
  );
}
