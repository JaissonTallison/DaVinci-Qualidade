"use client";

import { useActionState } from "react";
import { PROVEDORES_DE_IA, type ConfigIa } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Botao } from "@/components/botao";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import { campo } from "@/lib/estilos";
import { salvarIaConfig, type EstadoIa } from "@/lib/acoes-integracoes";

/** Conecta o provedor de IA: escolhe o modelo e guarda a chave (cifrada). A chave nunca volta à tela. */
export function FormularioDeProvedorIa({ ia }: { ia: ConfigIa }) {
  const [estado, salvar, salvando] = useActionState<EstadoIa, FormData>(
    salvarIaConfig,
    {},
  );
  return (
    <div className="flex flex-col gap-3">
      {estado.erro && <AvisoDeErro erro={estado.erro} />}
      {estado.ok && (
        <p className="rounded-md border border-conforme-borda bg-conforme-suave px-3 py-2 text-sm text-conforme-texto">
          Provedor salvo.
        </p>
      )}
      <form
        action={salvar}
        className="flex flex-col gap-4 sm:flex-row sm:items-end"
      >
        <Campo id="provedor" rotulo="Provedor" className="sm:w-56">
          <Selecao
            id="provedor"
            name="provedor"
            defaultValue={ia.provedor ?? ""}
            className={campo}
          >
            <option value="" disabled>
              Escolha
            </option>
            {Object.entries(PROVEDORES_DE_IA).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo
          id="chave"
          rotulo={ia.temChave ? "Nova chave (opcional)" : "Chave da API"}
          ajuda={
            ia.temChave
              ? "Já há uma chave guardada (cifrada). Deixe em branco para manter."
              : "Guardada cifrada; nunca aparece de novo."
          }
          className="sm:flex-1"
        >
          <input
            id="chave"
            name="chave"
            type="password"
            autoComplete="off"
            maxLength={200}
            placeholder={ia.temChave ? "••••••••" : "Cole a chave do provedor"}
            className={campo}
          />
        </Campo>
        <Botao
          type="submit"
          variante="primario"
          carregando={salvando}
          textoCarregando="Salvando…"
        >
          Salvar
        </Botao>
      </form>
    </div>
  );
}
