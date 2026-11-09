import type { Metadata } from "next";
import type { ChaveDeApi } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { CabecalhoDaPagina } from "@/components/cabecalho-da-pagina";
import { chamarApi } from "@/lib/api";
import { GerenciadorDeChaves } from "./gerenciador";

export const metadata: Metadata = { title: "API de acesso" };

/**
 * API de acesso (Integrações): chaves que sistemas externos (Power BI, scripts, ERPs) usam para ler os
 * dados da empresa no DaVinci. Backend em Identidade; o gateway já valida a chave a cada chamada.
 */
export default async function ApiDeAcesso() {
  const r = await chamarApi<ChaveDeApi[]>("/integracoes/chaves");
  return (
    <div className="w-full">
      <CabecalhoDaPagina
        titulo="API de acesso"
        descricao="Gere chaves para outros sistemas lerem os dados da sua empresa. A chave aparece uma única vez; guarde-a com cuidado."
      />
      {r.ok ? (
        <GerenciadorDeChaves chaves={r.dados} />
      ) : (
        <div className="mt-6">
          <AvisoDeErro erro={r.erro} />
        </div>
      )}
    </div>
  );
}
