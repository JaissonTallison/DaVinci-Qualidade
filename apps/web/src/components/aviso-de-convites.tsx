"use client";

import { useState, useTransition } from "react";
import type { ConvitePendente } from "@davinci/types";
import { aceitarConvite, recusarConvite } from "@/lib/acoes-convites";
import { CaixaDeAlerta } from "@/components/caixa-de-alerta";
import { Botao } from "@/components/botao";

/**
 * Convites de acesso a outras empresas (ERR-04): a pessoa só entra onde aceita. Aparece no topo do
 * sistema; aceitar passa a empresa a fazer parte do seletor, recusar descarta o convite.
 */
export function AvisoDeConvites({ convites }: { convites: ConvitePendente[] }) {
  if (convites.length === 0) return null;
  return (
    <div className="mb-6 flex flex-col gap-3">
      {convites.map((c) => (
        <LinhaDeConvite key={c.id} convite={c} />
      ))}
    </div>
  );
}

function LinhaDeConvite({ convite }: { convite: ConvitePendente }) {
  const [erro, setErro] = useState<string | null>(null);
  const [processando, iniciar] = useTransition();

  const responder = (
    acao: (id: string) => Promise<{ ok: boolean; erro?: { mensagem: string } }>,
  ) =>
    iniciar(async () => {
      setErro(null);
      const r = await acao(convite.id);
      if (!r.ok) setErro(r.erro?.mensagem ?? "Não foi possível responder.");
    });

  return (
    <CaixaDeAlerta tom="info">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          <strong className="font-semibold">{convite.empresa}</strong> convidou
          você para acessar com o perfil {convite.perfil}.
          {erro && <span className="mt-1 block text-nao-conforme-texto">{erro}</span>}
        </span>
        <span className="flex shrink-0 gap-2">
          <Botao
            variante="primario"
            tamanho="pequeno"
            carregando={processando}
            textoCarregando="Aceitando…"
            onClick={() => responder(aceitarConvite)}
          >
            Aceitar
          </Botao>
          <Botao
            variante="secundario"
            tamanho="pequeno"
            disabled={processando}
            onClick={() => responder(recusarConvite)}
          >
            Recusar
          </Botao>
        </span>
      </div>
    </CaixaDeAlerta>
  );
}
