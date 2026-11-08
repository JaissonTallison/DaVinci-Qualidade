import { Mail, MessageCircle } from "@/components/icones";
import type { ConviteDePesquisa } from "@davinci/types";
import { BotaoCopiar } from "@/components/botao-copiar";
import { formatarData } from "@/lib/datas";
import { enderecoDoSistema } from "@/lib/endereco-do-sistema";
import { CaixaDeAlerta } from "@/components/caixa-de-alerta";
import { Botao } from "@/components/botao";

/** O link do convite, com copiar, e-mail e WhatsApp prontos. */
export async function LinkDaPesquisa({
  convite,
}: {
  convite: ConviteDePesquisa;
}) {
  const url = `${await enderecoDoSistema()}/pesquisa/${convite.token}`;
  const texto = `Olá! Pode avaliar nosso serviço${convite.osNumero ? ` (${convite.osNumero})` : ""}? Leva 1 minuto: ${url}`;
  return (
    <CaixaDeAlerta tom="info" className="mt-4">
      <p className="font-semibold">
        Link da pesquisa para {convite.clienteNome}
      </p>
      <p className="mt-1 font-mono text-sm break-all">{url}</p>
      <p className="mt-1 text-sm text-texto-2">
        Vale até {formatarData(convite.expiraEm)}, para uma resposta.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <BotaoCopiar texto={url} rotulo="Copiar link" />
        <Botao
          href={`mailto:?subject=${encodeURIComponent("Pesquisa de satisfação")}&body=${encodeURIComponent(texto)}`}
          tamanho="pequeno"
          icone={Mail}
        >
          Enviar por e-mail
        </Botao>
        <Botao
          href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
          target="_blank"
          rel="noreferrer"
          tamanho="pequeno"
          icone={MessageCircle}
        >
          Enviar por WhatsApp
        </Botao>
      </div>
    </CaixaDeAlerta>
  );
}
