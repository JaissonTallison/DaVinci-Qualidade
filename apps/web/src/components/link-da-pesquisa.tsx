import type { ConviteDePesquisa } from "@davinci/types";
import { BotaoCopiar } from "@/components/botao-copiar";
import { formatarData } from "@/lib/datas";
import { enderecoDoSistema } from "@/lib/endereco-do-sistema";

/** O link do convite, com copiar, e-mail e WhatsApp prontos. */
export async function LinkDaPesquisa({
  convite,
}: {
  convite: ConviteDePesquisa;
}) {
  const url = `${await enderecoDoSistema()}/pesquisa/${convite.token}`;
  const texto = `Olá! Pode avaliar nosso serviço${convite.osNumero ? ` (${convite.osNumero})` : ""}? Leva 1 minuto: ${url}`;
  return (
    <div
      role="status"
      className="mt-4 rounded-sm border border-borda bg-superficie px-4 py-3 text-base"
    >
      <p className="font-semibold">
        Link da pesquisa para {convite.clienteNome}
      </p>
      <p className="mt-1 font-mono text-sm break-all">{url}</p>
      <p className="mt-1 text-sm text-texto-2">
        Vale até {formatarData(convite.expiraEm)}, para uma resposta.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <BotaoCopiar texto={url} rotulo="Copiar link" />
        <a
          href={`mailto:?subject=${encodeURIComponent("Pesquisa de satisfação")}&body=${encodeURIComponent(texto)}`}
          className="text-info hover:underline"
        >
          Enviar por e-mail
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
          target="_blank"
          rel="noreferrer"
          className="text-info hover:underline"
        >
          Enviar por WhatsApp
        </a>
      </div>
    </div>
  );
}
