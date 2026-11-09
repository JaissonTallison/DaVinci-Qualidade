import type { ReactNode } from "react";
import { Sparkles } from "@/components/icones";
import { Botao } from "@/components/botao";

/**
 * Faixa de copiloto de IA (prévia) — fica no topo de um formulário onde a IA pode ajudar: ler um
 * documento e preencher campos (F1) ou gerar/resumir um texto a partir dos dados (F5). Hoje é só a
 * casca: o botão vem desabilitado ("Em breve") até o provedor ser ligado em Administração › IA /
 * Assistente. A pessoa sempre confere antes de salvar (humano no fim); quando ligar, a lógica entra
 * aqui, num lugar só.
 */
export function FaixaDeIA({
  rotulo,
  children,
}: {
  /** Texto do botão: "Preencher com IA", "Gerar rascunho com IA", "Redigir com IA"… */
  rotulo: string;
  /** O que a IA faz, logo depois de "Em breve:". */
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-borda bg-superficie-2 p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-texto-2">
        <span className="font-medium text-texto">Em breve:</span> {children}
      </p>
      <Botao
        variante="secundario"
        tamanho="pequeno"
        icone={Sparkles}
        type="button"
        disabled
        motivo="Em breve: ligue o provedor em Administração › IA / Assistente."
      >
        {rotulo}
      </Botao>
    </div>
  );
}
