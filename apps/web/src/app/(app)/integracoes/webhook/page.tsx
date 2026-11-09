import type { Metadata } from "next";
import type { ConfigDeIntegracoes } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { CabecalhoDaPagina } from "@/components/cabecalho-da-pagina";
import { chamarApi } from "@/lib/api";
import { FormularioDeWebhook } from "./formulario";

export const metadata: Metadata = { title: "Webhooks" };

/**
 * Webhooks (Integrações): o endereço externo que o DaVinci avisa quando algo acontece. Esta tela guarda a
 * configuração; o disparo assinado dos eventos entra na etapa de ligar as APIs externas.
 */
export default async function Webhooks() {
  const r = await chamarApi<ConfigDeIntegracoes>("/integracoes/config");
  return (
    <div className="w-full">
      <CabecalhoDaPagina
        titulo="Webhooks"
        descricao="Avise um sistema externo quando algo acontecer no DaVinci. Configure o endereço aqui; o envio é assinado."
      />
      {r.ok ? (
        <FormularioDeWebhook webhook={r.dados.webhook} />
      ) : (
        <div className="mt-6">
          <AvisoDeErro erro={r.erro} />
        </div>
      )}
    </div>
  );
}
