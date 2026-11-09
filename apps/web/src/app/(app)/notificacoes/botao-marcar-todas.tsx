"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Botao } from "@/components/botao";
import { marcarTodasLidas } from "@/lib/acoes-notificacoes";

/** Marca todas as notificações como lidas e recarrega a lista. */
export function BotaoMarcarTodas() {
  const router = useRouter();
  const [processando, iniciar] = useTransition();
  return (
    <Botao
      variante="secundario"
      tamanho="pequeno"
      disabled={processando}
      onClick={() =>
        iniciar(async () => {
          await marcarTodasLidas();
          router.refresh();
        })
      }
    >
      Marcar todas como lidas
    </Botao>
  );
}
