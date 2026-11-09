"use client";

import { useActionState } from "react";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import type { EstadoDaAcao } from "@/lib/acao";
import { salvarConfigQualidade } from "@/lib/acoes-qualidade";
import { painel } from "@/lib/estilos";
import { Botao } from "@/components/botao";

/** Config da verificação de eficácia: por padrão, quem trata não verifica a própria eficácia (ERR-09). */
export function FormularioDeEficacia({ auto }: { auto: boolean }) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarConfigQualidade,
    {},
  );
  return (
    <form action={acao} className={`${painel} mt-6 p-5`}>
      {estado.erro && (
        <div className="mb-5">
          <AvisoDeErro erro={estado.erro} />
        </div>
      )}
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="autoVerificacaoEficacia"
          value="sim"
          defaultChecked={auto}
          className="mt-1.5"
        />
        <span>
          <span className="block text-base font-semibold text-texto">
            Permitir que quem registrou o tratamento verifique a própria
            eficácia
          </span>
          <span className="block text-sm text-texto-2">
            Desligado (recomendado), a verificação de eficácia precisa ser feita
            por outra pessoa — segregação de função. Ligue apenas em equipes
            pequenas, onde a mesma pessoa trata e verifica.
          </span>
        </span>
      </label>
      <div className="mt-5">
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
